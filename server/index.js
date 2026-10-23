// M-Carbon LED 제안서 서버
const path = require("path");
const express = require("express");
const helmet = require("helmet");
const compression = require("compression");
const { pool, migrate } = require("./db");
const { MODE, ALLOWED_DOMAINS, requireUser, requireAdmin } = require("./auth");
const { normalize, compute, DEFAULTS, PROPOSAL_KEYS } = require("../public/calc.js");
const { buildExcel } = require("./excel");
const { buildPptx } = require("./pptx");

const app = express();
app.set("trust proxy", 1);
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      "default-src": ["'self'"],
      "script-src": ["'self'", "https://cdn.jsdelivr.net"],
      "style-src": ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      "font-src": ["'self'", "https://fonts.gstatic.com"],
      "img-src": ["'self'", "data:", "blob:"],
      "connect-src": ["'self'", "https://identitytoolkit.googleapis.com", "https://securetoken.googleapis.com", "https://www.googleapis.com"],
      "frame-src": ["https://*.firebaseapp.com"],
    },
  },
}));
app.use(compression());
app.use(express.json({ limit: "100kb" }));
app.use(express.static(path.join(__dirname, "..", "public"), { maxAge: "1h" }));

const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
const summaryOf = (v) => {
  const r = compute(v);
  return { netTot: Math.round(r.netTot), aptTot: Math.round(r.aptTot), rep: Math.round(r.rep),
    saveKwh: Math.round(r.saveKwh), co2: +r.co2.toFixed(1), ratio: +r.ratio.toFixed(4), contract: r.contract };
};
const canSee = (u, row) => u.role === "admin" || row.owner_uid === u.uid;

// 상태 확인 (Railway 헬스체크용)
app.get("/healthz", wrap(async (req, res) => { await pool.query("SELECT 1"); res.json({ ok: true }); }));

// 브라우저가 쓸 로그인 설정 (공개 정보)
app.get("/api/config", (req, res) => {
  let firebase = null;
  try { firebase = process.env.FIREBASE_WEB_CONFIG ? JSON.parse(process.env.FIREBASE_WEB_CONFIG) : null; } catch (e) {}
  res.json({ authMode: MODE, firebase, allowedDomains: ALLOWED_DOMAINS });
});

app.get("/api/me", requireUser({ allowPending: true }), (req, res) => res.json(req.user));

// ---------- 회사 설정 (엑셀·PPT 전용 값) ----------
const pick = (v) => Object.fromEntries(PROPOSAL_KEYS.map((k) => [k, v[k]]));
async function companyDefaults() {
  const { rows } = await pool.query("SELECT value FROM settings WHERE key = 'defaults'");
  return pick(normalize(Object.assign({}, DEFAULTS, rows[0] ? rows[0].value : {})));
}
// 직원은 회사 설정을 바꿀 수 없음: 새 제안서는 회사 설정, 기존 제안서는 저장된 값 유지
function applyPolicy(user, v, base) {
  if (user.role === "admin") return v;
  return normalize(Object.assign({}, v, base));
}
app.get("/api/settings", requireUser(), wrap(async (req, res) => res.json(await companyDefaults())));
app.put("/api/settings", requireUser(), requireAdmin, wrap(async (req, res) => {
  const v = pick(normalize(Object.assign({}, DEFAULTS, await companyDefaults(), req.body || {})));
  await pool.query(
    `INSERT INTO settings (key, value, updated_by, updated_at) VALUES ('defaults', $1, $2, now())
     ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_by = EXCLUDED.updated_by, updated_at = now()`,
    [v, req.user.email]);
  res.json(v);
}));

// ---------- 제안서 ----------
app.get("/api/proposals", requireUser(), wrap(async (req, res) => {
  const all = req.user.role === "admin" && req.query.all === "1";
  const q = String(req.query.q || "").slice(0, 60);
  const params = [];
  let where = [];
  if (!all) { params.push(req.user.uid); where.push(`p.owner_uid = $${params.length}`); }
  if (q) { params.push("%" + q + "%"); where.push(`p.site ILIKE $${params.length}`); }
  const { rows } = await pool.query(
    `SELECT p.id, p.site, p.summary, p.created_at, p.updated_at, p.inputs->>'author' AS author, u.name AS owner_name, u.email AS owner_email
       FROM proposals p JOIN users u ON u.uid = p.owner_uid
       ${where.length ? "WHERE " + where.join(" AND ") : ""}
      ORDER BY p.updated_at DESC LIMIT 200`, params);
  res.json(rows);
}));

app.post("/api/proposals", requireUser(), wrap(async (req, res) => {
  const v = applyPolicy(req.user, normalize(req.body && req.body.inputs), await companyDefaults());
  const { rows } = await pool.query(
    `INSERT INTO proposals (owner_uid, site, inputs, summary) VALUES ($1,$2,$3,$4) RETURNING id, site, created_at, updated_at`,
    [req.user.uid, v.site, v, summaryOf(v)]);
  res.status(201).json(rows[0]);
}));

async function loadProposal(req, res) {
  const id = parseInt(req.params.id, 10);
  if (!Number.isInteger(id)) { res.status(400).json({ error: "bad_id" }); return null; }
  const { rows } = await pool.query("SELECT * FROM proposals WHERE id = $1", [id]);
  if (!rows[0] || !canSee(req.user, rows[0])) { res.status(404).json({ error: "not_found", message: "제안서를 찾을 수 없습니다." }); return null; }
  return rows[0];
}

app.get("/api/proposals/:id", requireUser(), wrap(async (req, res) => {
  const p = await loadProposal(req, res); if (p) res.json(p);
}));

app.put("/api/proposals/:id", requireUser(), wrap(async (req, res) => {
  const p = await loadProposal(req, res); if (!p) return;
  const v = applyPolicy(req.user, normalize(req.body && req.body.inputs), pick(normalize(p.inputs)));
  const { rows } = await pool.query(
    `UPDATE proposals SET site=$2, inputs=$3, summary=$4, updated_at=now() WHERE id=$1 RETURNING id, site, created_at, updated_at`,
    [p.id, v.site, v, summaryOf(v)]);
  res.json(rows[0]);
}));

app.delete("/api/proposals/:id", requireUser(), wrap(async (req, res) => {
  const p = await loadProposal(req, res); if (!p) return;
  await pool.query("DELETE FROM proposals WHERE id = $1", [p.id]);
  res.json({ ok: true });
}));

const safeName = (s) => s.replace(/[\\/:*?"<>|]+/g, "_").replace(/\s+/g, "_");
function sendFile(res, buf, filename, type) {
  res.set({
    "Content-Type": type,
    "Content-Disposition": `attachment; filename="file"; filename*=UTF-8''${encodeURIComponent(filename)}`,
    "Cache-Control": "no-store",
  });
  res.send(buf);
}
app.get("/api/proposals/:id/:kind(excel|pptx)", requireUser(), wrap(async (req, res) => {
  const p = await loadProposal(req, res); if (!p) return;
  const v = normalize(p.inputs);
  await pool.query("INSERT INTO downloads (proposal_id, uid, kind) VALUES ($1,$2,$3)", [p.id, req.user.uid, req.params.kind]);
  if (req.params.kind === "excel")
    return sendFile(res, await buildExcel(v), `${safeName(v.site)}_LED_절감산출.xlsx`, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
  sendFile(res, await buildPptx(v), `${safeName(v.site)}_스마트조명_도입제안서.pptx`, "application/vnd.openxmlformats-officedocument.presentationml.presentation");
}));

// ---------- 관리자 ----------
app.get("/api/admin/users", requireUser(), requireAdmin, wrap(async (req, res) => {
  const { rows } = await pool.query(
    `SELECT u.uid, u.email, u.name, u.role, u.status, u.created_at, u.last_login,
            (SELECT count(*) FROM proposals p WHERE p.owner_uid = u.uid)::int AS proposals
       FROM users u ORDER BY (u.status = 'pending') DESC, u.created_at DESC`);
  res.json(rows);
}));
app.patch("/api/admin/users/:uid", requireUser(), requireAdmin, wrap(async (req, res) => {
  const { status, role } = req.body || {};
  if (req.params.uid === req.user.uid) return res.status(400).json({ error: "self", message: "본인 계정은 변경할 수 없습니다." });
  if (status && !["pending", "active", "disabled"].includes(status)) return res.status(400).json({ error: "bad_status" });
  if (role && !["user", "admin"].includes(role)) return res.status(400).json({ error: "bad_role" });
  const { rows } = await pool.query(
    `UPDATE users SET status = COALESCE($2, status), role = COALESCE($3, role) WHERE uid = $1 RETURNING uid, email, name, role, status`,
    [req.params.uid, status || null, role || null]);
  if (!rows[0]) return res.status(404).json({ error: "not_found" });
  res.json(rows[0]);
}));

app.use("/api", (req, res) => res.status(404).json({ error: "not_found" }));
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: "server_error", message: "서버 오류가 발생했습니다. 잠시 후 다시 시도하세요." });
});

const PORT = process.env.PORT || 3000;
migrate().then(() => {
  if (!process.env.ADMIN_EMAILS) console.warn("⚠ ADMIN_EMAILS 가 비어 있어 관리자가 없습니다. 가입자를 승인할 수 없습니다.");
  app.listen(PORT, () => console.log(`서버 실행 중: http://localhost:${PORT} (로그인 모드: ${MODE})`));
}).catch((e) => { console.error("DB 초기화 실패:", e.message); process.exit(1); });

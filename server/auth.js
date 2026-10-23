// 로그인 확인: 브라우저가 보낸 Firebase 토큰을 검증하고 사용자 권한을 확인합니다.
const { pool } = require("./db");

const MODE = process.env.AUTH_MODE === "dev" ? "dev" : "firebase";
const list = (s) => String(s || "").split(",").map((x) => x.trim().toLowerCase()).filter(Boolean);
const ADMIN_EMAILS = list(process.env.ADMIN_EMAILS);
const AUTO_APPROVE_DOMAINS = list(process.env.AUTO_APPROVE_DOMAINS);
const ALLOWED_DOMAINS = list(process.env.ALLOWED_DOMAINS);

let verify;
if (MODE === "dev") {
  if (process.env.NODE_ENV === "production") {
    console.error("AUTH_MODE=dev 는 운영(production)에서 사용할 수 없습니다.");
    process.exit(1);
  }
  console.warn("⚠ 개발용 로그인 모드(AUTH_MODE=dev) — 비밀번호 없이 로그인됩니다. 테스트에만 사용하세요.");
  // 헤더 형식: "Dev 이메일|이름"
  verify = async (token) => {
    const [email, name] = decodeURIComponent(token).split("|");
    if (!email || !email.includes("@")) throw new Error("bad dev token");
    return { uid: "dev:" + email.toLowerCase(), email: email.toLowerCase(), name: name || email.split("@")[0], email_verified: true };
  };
} else {
  const admin = require("firebase-admin");
  if (!process.env.FIREBASE_PROJECT_ID) {
    console.error("FIREBASE_PROJECT_ID 환경변수가 없습니다. (.env.example 참고)");
    process.exit(1);
  }
  admin.initializeApp({ projectId: process.env.FIREBASE_PROJECT_ID });
  verify = async (token) => {
    const d = await admin.auth().verifyIdToken(token);
    return { uid: d.uid, email: (d.email || "").toLowerCase(), name: d.name || "", email_verified: !!d.email_verified };
  };
}

async function upsertUser(t) {
  const domain = t.email.split("@")[1] || "";
  const isAdmin = t.email_verified && ADMIN_EMAILS.includes(t.email);
  // 도메인 자동 승인은 이메일 인증을 마친 경우에만 (남의 회사 메일로 가입하는 것 방지)
  const autoOk = isAdmin || (t.email_verified && AUTO_APPROVE_DOMAINS.includes(domain));
  const { rows } = await pool.query(
    `INSERT INTO users (uid, email, name, role, status, last_login)
     VALUES ($1,$2,$3,$4,$5, now())
     ON CONFLICT (uid) DO UPDATE SET
       email = EXCLUDED.email,
       name = CASE WHEN EXCLUDED.name <> '' THEN EXCLUDED.name ELSE users.name END,
       role = CASE WHEN $6 THEN 'admin' ELSE users.role END,
       status = CASE WHEN users.status = 'pending' AND $7 THEN 'active' ELSE users.status END,
       last_login = now()
     RETURNING uid, email, name, role, status`,
    [t.uid, t.email, t.name, isAdmin ? "admin" : "user", autoOk ? "active" : "pending", isAdmin, autoOk]
  );
  return { ...rows[0], email_verified: t.email_verified };
}

/** 로그인 필수. opts.allowPending: 승인 대기 사용자도 통과 (내 정보 조회용) */
function requireUser(opts = {}) {
  return async (req, res, next) => {
    const h = req.get("authorization") || "";
    const m = h.match(/^(Bearer|Dev) (.+)$/);
    if (!m || (m[1] === "Dev") !== (MODE === "dev")) return res.status(401).json({ error: "login_required", message: "로그인이 필요합니다." });
    let t;
    try { t = await verify(m[2]); }
    catch (e) { return res.status(401).json({ error: "invalid_token", message: "로그인이 만료되었습니다. 다시 로그인하세요." }); }
    if (!t.email) return res.status(401).json({ error: "no_email", message: "이메일 계정으로 로그인하세요." });
    if (ALLOWED_DOMAINS.length && !ALLOWED_DOMAINS.includes(t.email.split("@")[1]))
      return res.status(403).json({ error: "domain_not_allowed", message: "허용된 회사 이메일만 사용할 수 있습니다." });
    try {
      req.user = await upsertUser(t);
    } catch (e) { return next(e); }
    if (req.user.status === "disabled") return res.status(403).json({ error: "disabled", message: "사용이 중지된 계정입니다. 관리자에게 문의하세요." });
    if (req.user.status !== "active" && !opts.allowPending)
      return res.status(403).json({ error: "pending", message: "관리자 승인 후 사용할 수 있습니다." });
    next();
  };
}
function requireAdmin(req, res, next) {
  if (req.user && req.user.role === "admin") return next();
  res.status(403).json({ error: "admin_only", message: "관리자만 사용할 수 있습니다." });
}

module.exports = { MODE, ALLOWED_DOMAINS, requireUser, requireAdmin };

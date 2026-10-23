/* M-Carbon LED 제안서 — 브라우저 화면 */
(() => {
"use strict";
const $ = (id) => document.getElementById(id);
const { DEFAULTS, NUM_KEYS, normalize, compute, f0, f1, man } = window.LEDCalc;
const TEXT_KEYS = ["site", "to", "date", "author"];
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

/* =========================================================
   로그인
   ========================================================= */
let cfg = null, fbAuth = null, me = null;
let devToken = null;
try { devToken = sessionStorage.getItem("mc_dev_token"); } catch (e) {}

async function getToken(force) {
  if (cfg.authMode === "dev") return devToken;
  const u = fbAuth && fbAuth.currentUser;
  return u ? u.getIdToken(!!force) : null;
}
async function api(path, opts = {}) {
  const t = await getToken();
  const headers = Object.assign({}, opts.headers || {});
  if (t) headers.Authorization = (cfg.authMode === "dev" ? "Dev " : "Bearer ") + t;
  if (opts.json !== undefined) { headers["Content-Type"] = "application/json"; opts.body = JSON.stringify(opts.json); }
  const res = await fetch(path, { method: opts.method || "GET", headers, body: opts.body });
  if (opts.raw && res.ok) return res;
  let data = null;
  try { data = await res.json(); } catch (e) {}
  if (!res.ok) {
    const err = new Error((data && data.message) || "요청에 실패했습니다 (" + res.status + ")");
    err.code = data && data.error; err.status = res.status;
    if (!opts.noRefresh && (res.status === 401 || res.status === 403) && (res.status === 401 || (res.status === 403 && ["pending", "disabled", "domain_not_allowed"].includes(err.code)))) refreshMe();
    throw err;
  }
  return data;
}

const ERR = {
  "auth/invalid-email": "이메일 형식이 올바르지 않습니다.",
  "auth/user-not-found": "이메일 또는 비밀번호가 올바르지 않습니다.",
  "auth/wrong-password": "이메일 또는 비밀번호가 올바르지 않습니다.",
  "auth/invalid-credential": "이메일 또는 비밀번호가 올바르지 않습니다.",
  "auth/invalid-login-credentials": "이메일 또는 비밀번호가 올바르지 않습니다.",
  "auth/email-already-in-use": "이미 가입된 이메일입니다. 로그인하거나 비밀번호를 재설정하세요.",
  "auth/weak-password": "비밀번호가 너무 약합니다.",
  "auth/too-many-requests": "시도가 너무 많습니다. 잠시 후 다시 시도하세요.",
  "auth/network-request-failed": "네트워크 오류입니다. 인터넷 연결을 확인하세요.",
  "auth/user-disabled": "사용이 중지된 계정입니다. 관리자에게 문의하세요.",
};
const errText = (e) => ERR[e && e.code] || (e && e.message) || "알 수 없는 오류가 발생했습니다.";

const forms = { login: $("fLogin"), signup: $("fSignup"), reset: $("fReset") };
const titles = { login: "로그인", signup: "회원가입", reset: "비밀번호 찾기", pending: "승인 대기" };
function showAuth(v, keepMsg) {
  Object.entries(forms).forEach(([k, f]) => (f.hidden = k !== v));
  $("pendingView").hidden = v !== "pending";
  $("tabs").hidden = v === "reset" || v === "pending";
  $("tabs").querySelectorAll("button").forEach((b) => b.setAttribute("aria-selected", b.dataset.v === v));
  $("aTitle").textContent = titles[v];
  if (!keepMsg) amsg("");
  const first = forms[v] && forms[v].querySelector("input");
  if (first) setTimeout(() => first.focus(), 0);
}
function amsg(t, ok) { const m = $("aMsg"); m.textContent = t; m.className = "msg " + (ok ? "ok" : "err"); }
$("tabs").addEventListener("click", (e) => { const b = e.target.closest("button"); if (b) showAuth(b.dataset.v); });
document.querySelectorAll("[data-go]").forEach((b) => b.addEventListener("click", () => {
  if (b.dataset.go === "reset") $("rEmail").value = $("lEmail").value;
  showAuth(b.dataset.go);
}));
document.querySelectorAll(".eye").forEach((b) => b.addEventListener("click", () => {
  const i = $(b.dataset.for); const s = i.type === "password"; i.type = s ? "text" : "password"; b.textContent = s ? "숨기기" : "보기";
}));
const validEmail = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
const strong = (p) => p.length >= 8 && /[A-Za-z]/.test(p) && /[0-9]/.test(p);
async function busy(btn, fn) {
  btn.disabled = true;
  try { await fn(); } catch (e) { amsg(errText(e)); } finally { btn.disabled = false; }
}

forms.login.addEventListener("submit", (e) => { e.preventDefault(); busy(e.submitter || forms.login.querySelector("[type=submit]"), async () => {
  const em = $("lEmail").value.trim(), pw = $("lPw").value;
  if (!validEmail(em)) return amsg("이메일을 정확히 입력하세요.");
  if (!pw) return amsg("비밀번호를 입력하세요.");
  if (cfg.authMode === "dev") { setDevToken(em, em.split("@")[0]); return refreshMe(); }
  const P = firebase.auth.Auth.Persistence;
  await fbAuth.setPersistence($("lKeep").checked ? P.LOCAL : P.SESSION);
  await fbAuth.signInWithEmailAndPassword(em, pw);
}); });

forms.signup.addEventListener("submit", (e) => { e.preventDefault(); busy(forms.signup.querySelector("[type=submit]"), async () => {
  const nm = $("sName").value.trim(), em = $("sEmail").value.trim(), pw = $("sPw").value, pw2 = $("sPw2").value;
  if (!nm) return amsg("이름을 입력하세요.");
  if (!validEmail(em)) return amsg("이메일을 정확히 입력하세요.");
  const dom = em.split("@")[1].toLowerCase();
  if (cfg.allowedDomains.length && !cfg.allowedDomains.includes(dom)) return amsg("허용된 회사 이메일로만 가입할 수 있습니다.");
  if (!strong(pw)) return amsg("비밀번호는 8자 이상이며 영문과 숫자를 모두 포함해야 합니다.");
  if (pw !== pw2) return amsg("비밀번호 확인이 일치하지 않습니다.");
  if (cfg.authMode === "dev") { setDevToken(em, nm); return refreshMe(); }
  const c = await fbAuth.createUserWithEmailAndPassword(em, pw);
  await c.user.updateProfile({ displayName: nm });
  try { await c.user.sendEmailVerification(); } catch (err) {}
  await c.user.getIdToken(true);   // 이름이 반영된 토큰으로 갱신
  await refreshMe();
}); });

forms.reset.addEventListener("submit", (e) => { e.preventDefault(); busy(forms.reset.querySelector("[type=submit]"), async () => {
  const em = $("rEmail").value.trim();
  if (!validEmail(em)) return amsg("이메일을 정확히 입력하세요.");
  if (cfg.authMode === "dev") return amsg("개발 모드에서는 비밀번호가 없습니다.", true);
  try { await fbAuth.sendPasswordResetEmail(em); }
  catch (err) { if (err.code !== "auth/user-not-found") throw err; }
  amsg("입력한 이메일로 비밀번호 재설정 링크를 보냈습니다. 메일함(스팸함 포함)을 확인하세요.", true);
}); });

function setDevToken(email, name) {
  devToken = encodeURIComponent(email.toLowerCase() + "|" + name);
  try { sessionStorage.setItem("mc_dev_token", devToken); } catch (e) {}
}
async function logout() {
  if (cfg.authMode === "dev") { devToken = null; try { sessionStorage.removeItem("mc_dev_token"); } catch (e) {} refreshMe(); }
  else await fbAuth.signOut();
}
$("logout").addEventListener("click", logout);
$("pLogout").addEventListener("click", logout);
$("pRefresh").addEventListener("click", async () => {
  if (fbAuth && fbAuth.currentUser) { await fbAuth.currentUser.reload(); await fbAuth.currentUser.getIdToken(true); }
  refreshMe(true);
});
$("pResend").addEventListener("click", async (e) => {
  try { await fbAuth.currentUser.sendEmailVerification(); amsg("인증 메일을 다시 보냈습니다.", true); }
  catch (err) { amsg(errText(err)); }
});

let refreshing = null;
async function refreshMe(showMsg) {
  while (refreshing) { try { await refreshing; } catch (e) {} }
  refreshing = (async () => {
    const t = await getToken();
    if (!t) { me = null; lock(); return; }
    try {
      me = await api("/api/me", { noRefresh: true });
    } catch (e) {
      me = null; lock();
      if (e.code === "disabled" || e.code === "domain_not_allowed") { showAuth("pending"); $("pendingText").textContent = e.message; $("verifyText").hidden = true; $("pResend").hidden = true; }
      else amsg(e.message);
      return;
    }
    if (me.status === "active") return unlock();
    lock(); showAuth("pending", showMsg);
    $("pendingText").textContent = `${me.name || me.email} 님, 가입이 완료되었습니다. 관리자 승인 후 사용할 수 있습니다.`;
    const needVerify = cfg.authMode !== "dev" && !me.email_verified;
    $("verifyText").hidden = !needVerify; $("pResend").hidden = !needVerify;
    if (showMsg) amsg("아직 승인 대기 중입니다.", false);
  })();
  try { await refreshing; } finally { refreshing = null; }
}
function lock() {
  document.body.classList.add("locked");
  if (!me) showAuth("login", true);
}
function unlock() {
  document.body.classList.remove("locked");
  ["lPw", "sPw", "sPw2"].forEach((id) => ($(id).value = ""));
  amsg("");
  $("whoName").textContent = me.name || me.email;
  const admin = me.role === "admin";
  $("whoRole").hidden = !admin; $("navAdmin").hidden = !admin; $("allWrap").hidden = !admin;
  if (!$("author").value.trim()) { $("author").value = me.name || ""; render(); }
}

/* =========================================================
   제안서 작성 화면
   ========================================================= */
let docId = null, dirty = false;

function buildTable() {
  $("tb").innerHTML = DEFAULTS.shares.map((s, i) => `<tr><td>${i + 1}년차</td><td><span class="pin"><input aria-label="${i + 1}년차 아파트 비율" inputmode="decimal" value="${s}">%</span><span class="bar2"><i></i></span></td><td></td><td></td><td></td><td></td></tr>`).join("");
  $("tb").querySelectorAll("input").forEach((i) => i.addEventListener("input", onEdit));
}
function today() { const d = new Date(); return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`; }
function readInputs() {
  const raw = {};
  TEXT_KEYS.concat(NUM_KEYS).forEach((k) => (raw[k] = $(k).value));
  raw.shares = [...$("tb").querySelectorAll("input")].map((i) => i.value);
  return normalize(raw);
}
function fillInputs(v) {
  TEXT_KEYS.forEach((k) => ($(k).value = v[k] ?? ""));
  NUM_KEYS.forEach((k) => ($(k).value = ["qty", "fac", "ledP"].includes(k) ? f0(v[k]) : v[k]));
  $("tb").querySelectorAll("input").forEach((i, n) => (i.value = v.shares[n]));
  render();
}
function setDoc(id, isDirty) {
  docId = id; dirty = isDirty;
  $("docState").textContent = id ? `저장된 제안서 #${id}${isDirty ? " · 수정됨 (저장 전)" : ""}` : "새 제안서 (저장 전)";
}
function onEdit() { render(); setDoc(docId, true); }

function render() {
  const v = readInputs(), r = compute(v);
  $("xSite").textContent = v.site;
  $("cUse").textContent = f0(r.useYr) + " kWh";
  $("cCost").textContent = f0(r.costYr) + " 원";
  $("cInv").textContent = f0(r.inv) + " 원";
  $("cRep").textContent = f0(r.rep) + " 원 (" + r.repN + "회 교체)";
  const pct = r.ratio * 100;
  $("gArc").style.strokeDashoffset = (314.16 * (1 - Math.min(Math.max(pct, 0), 100) / 100)).toFixed(2);
  $("gPct").innerHTML = `${f1(pct)}<small>%</small>`;
  $("gYrs").textContent = r.contract + "년";
  $("bigN").textContent = `총 ${f0(r.netTot)}원 (약 ${man(r.netTot)}만 원)`;
  $("bigS").textContent = `전기 절감 배분수익 ${man(r.aptTot)}만 원 + 자체 시설교체 추가투자 비용 절감액 ${man(r.rep)}만 원`;
  const W = (n, u) => `${n}<small>${u}</small>`;
  $("e1").innerHTML = W(f0(r.saveKwh), "kWh"); $("e10").innerHTML = W(f1(r.saveKwh * 10 / 1000), "MWh");
  $("m1").innerHTML = W(man(r.years[0].save), "만원"); $("m10").innerHTML = W(man(r.saveTot), "만원");
  $("a1").innerHTML = W(man(r.years[0].apt), "만원"); $("a10").innerHTML = W(man(r.aptTot), "만원");
  $("c1").innerHTML = W(f1(r.co2), "tCO₂"); $("c10").innerHTML = W(f1(r.co2 * 10), "tCO₂");
  $("t1").innerHTML = W(f0(r.trees), "그루"); $("t10").innerHTML = W(f0(r.trees * 10), "그루");
  [...$("tb").rows].forEach((tr, i) => {
    const y = r.years[i];
    tr.className = y.share >= 1 ? "after" : "";
    tr.querySelector(".bar2 i").style.width = y.share * 100 + "%";
    tr.cells[2].textContent = f0(y.save); tr.cells[3].textContent = f0(y.apt); tr.cells[4].textContent = f0(y.op); tr.cells[5].textContent = f0(y.acc);
  });
  $("fT").textContent = f0(r.saveTot); $("fA").textContent = f0(r.aptTot); $("fO").textContent = f0(r.opTot);
  const Wd = 440, H = 210, L = 40, R = 8, T = 22, B = 24, n = 10, step = (Wd - L - R) / n, bw = step * 0.62;
  const vals = r.years.map((y) => y.apt / 1e4), max = Math.max(...vals, 1);
  const nice = (x) => { const p = Math.pow(10, Math.floor(Math.log10(x))); const q = x / p; return (q <= 1 ? 1 : q <= 2 ? 2 : q <= 2.5 ? 2.5 : q <= 5 ? 5 : 10) * p; };
  const tick = nice(max / 4), top = Math.ceil(max / tick) * tick || 1, yy = (t) => T + (H - T - B) * (1 - t / top);
  let g = "";
  for (let t = 0; t <= top + 1e-9; t += tick) g += `<line class="grid" x1="${L}" x2="${Wd - R}" y1="${yy(t)}" y2="${yy(t)}"/><text class="ax" x="${L - 6}" y="${yy(t) + 3.5}" text-anchor="end">${Math.round(t).toLocaleString("ko-KR")}</text>`;
  vals.forEach((t, i) => {
    const x = L + step * i + (step - bw) / 2, cls = r.years[i].share >= 1 ? " full" : "";
    g += `<rect class="col${cls}" x="${x}" y="${yy(t)}" width="${bw}" height="${Math.max(yy(0) - yy(t), 0)}" rx="3"/>`;
    g += `<text class="val" x="${x + bw / 2}" y="${yy(t) - 5}" text-anchor="middle">${Math.round(t).toLocaleString("ko-KR")}</text>`;
    g += `<text class="ax" x="${x + bw / 2}" y="${H - 7}" text-anchor="middle">${i + 1}년</text>`;
  });
  $("yrChart").innerHTML = g;
  $("yrSub").textContent = `10년 합계 ${man(r.aptTot)}만원 · 밝은 막대는 계약 종료 후(100% 단지 귀속)`;
}

function setStatus(t, err) { const s = $("status"); s.textContent = t; s.className = err ? "err" : ""; }
async function save() {
  const inputs = readInputs();
  const row = docId ? await api(`/api/proposals/${docId}`, { method: "PUT", json: { inputs } })
                    : await api("/api/proposals", { method: "POST", json: { inputs } });
  setDoc(row.id, false);
  return row.id;
}
async function download(id, kind) {
  const res = await api(`/api/proposals/${id}/${kind}`, { raw: true });
  const cd = res.headers.get("content-disposition") || "";
  const m = cd.match(/filename\*=UTF-8''([^;]+)/);
  const name = m ? decodeURIComponent(m[1]) : `proposal.${kind === "excel" ? "xlsx" : "pptx"}`;
  const blob = await res.blob();
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob); a.download = name;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 5000);
}
async function run(btn, label, fn) {
  btn.disabled = true; setStatus(label);
  try { const t = await fn(); setStatus(t || "완료되었습니다."); }
  catch (e) { console.error(e); setStatus(e.message || String(e), true); }
  finally { btn.disabled = false; }
}
$("bSave").addEventListener("click", (e) => run(e.currentTarget, "저장 중…", async () => { await save(); return "저장했습니다."; }));
$("bXl").addEventListener("click", (e) => run(e.currentTarget, "엑셀 파일을 만드는 중…", async () => { const id = await save(); await download(id, "excel"); return "저장 후 엑셀 파일을 받았습니다."; }));
$("bPp").addEventListener("click", (e) => run(e.currentTarget, "PPT 파일을 만드는 중… (10초 정도 걸릴 수 있습니다)", async () => { const id = await save(); await download(id, "pptx"); return "저장 후 PPT 파일을 받았습니다."; }));
$("bNew").addEventListener("click", () => {
  if (dirty && !window.confirm("저장하지 않은 내용이 있습니다. 새 제안서를 시작할까요?")) return;
  newDoc();
});
function newDoc() {
  fillInputs(Object.assign({}, DEFAULTS, { site: "", date: today(), author: (me && me.name) || "" }));
  setDoc(null, false); setStatus("");
}

/* =========================================================
   탭 · 목록 · 관리자
   ========================================================= */
function showTab(t) {
  document.querySelectorAll(".nav > button").forEach((b) => b.dataset.tab === t ? b.setAttribute("aria-current", "page") : b.removeAttribute("aria-current"));
  $("tabEdit").hidden = t !== "edit"; document.querySelector(".meta").hidden = t !== "edit"; $("tabList").hidden = t !== "list"; $("tabAdmin").hidden = t !== "admin";
  if (t === "list") loadList();
  if (t === "admin") loadUsers();
}
document.querySelectorAll(".nav > button").forEach((b) => b.addEventListener("click", () => showTab(b.dataset.tab)));
const dt = (s) => { const d = new Date(s); return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`; };

let qTimer;
$("q").addEventListener("input", () => { clearTimeout(qTimer); qTimer = setTimeout(loadList, 250); });
$("allProps").addEventListener("change", loadList);
async function loadList() {
  const all = !$("allWrap").hidden && $("allProps").checked;
  $("thOwner").hidden = !all;
  let rows;
  try { rows = await api(`/api/proposals?q=${encodeURIComponent($("q").value.trim())}${all ? "&all=1" : ""}`); }
  catch (e) { $("listBody").innerHTML = ""; $("listEmpty").hidden = false; $("listEmpty").textContent = e.message; return; }
  $("listEmpty").hidden = rows.length > 0; $("listEmpty").textContent = "아직 저장된 제안서가 없습니다.";
  $("listBody").innerHTML = rows.map((p) => `<tr data-id="${p.id}">
    <td><b>${esc(p.site)}</b><small>#${p.id}${p.author ? " · 작성 " + esc(p.author) : ""}</small></td>
    <td class="r">${man(p.summary.netTot)}만 원</td>
    <td class="r">${f1(p.summary.co2)} t</td>
    ${all ? `<td>${esc(p.owner_name || p.owner_email)}</td>` : ""}
    <td>${dt(p.updated_at)}</td>
    <td><div class="acts"><button class="go" data-a="open">열기</button><button data-a="excel">Excel</button><button data-a="pptx">PPT</button><button class="x" data-a="del">삭제</button></div></td>
  </tr>`).join("");
}
$("listBody").addEventListener("click", async (e) => {
  const b = e.target.closest("button[data-a]"); if (!b) return;
  const id = b.closest("tr").dataset.id, a = b.dataset.a;
  b.disabled = true;
  try {
    if (a === "open") {
      if (dirty && !window.confirm("저장하지 않은 내용이 있습니다. 다른 제안서를 열까요?")) return;
      const p = await api(`/api/proposals/${id}`);
      fillInputs(normalize(p.inputs)); setDoc(p.id, false); setStatus(""); showTab("edit"); window.scrollTo(0, 0);
    } else if (a === "excel" || a === "pptx") await download(id, a);
    else if (a === "del") {
      if (!window.confirm("이 제안서를 삭제할까요? 되돌릴 수 없습니다.")) return;
      await api(`/api/proposals/${id}`, { method: "DELETE" });
      if (String(docId) === String(id)) setDoc(null, true);
      loadList();
    }
  } catch (err) { window.alert(err.message); }
  finally { b.disabled = false; }
});

const ST = { pending: "승인 대기", active: "사용 중", disabled: "중지됨" };
async function loadUsers() {
  let rows;
  try { rows = await api("/api/admin/users"); } catch (e) { $("userBody").innerHTML = `<tr><td colspan="7">${esc(e.message)}</td></tr>`; return; }
  $("userBody").innerHTML = rows.map((u) => {
    const self = u.uid === me.uid;
    const acts = self ? "<small>본인</small>" : [
      u.status !== "active" ? `<button class="go" data-a="active">${u.status === "pending" ? "승인" : "다시 사용"}</button>` : "",
      u.status !== "disabled" ? `<button class="x" data-a="disabled">${u.status === "pending" ? "거절" : "사용 중지"}</button>` : "",
      u.role === "admin" ? `<button data-a="user">관리자 해제</button>` : (u.status === "active" ? `<button data-a="admin">관리자 지정</button>` : ""),
    ].join("");
    return `<tr data-uid="${esc(u.uid)}"><td><b>${esc(u.name || "-")}</b></td><td>${esc(u.email)}</td>
      <td><span class="st ${u.status}">${ST[u.status]}</span></td><td>${u.role === "admin" ? "관리자" : "직원"}</td>
      <td class="r">${u.proposals}</td><td>${dt(u.created_at)}</td><td><div class="acts">${acts}</div></td></tr>`;
  }).join("");
}
$("userBody").addEventListener("click", async (e) => {
  const b = e.target.closest("button[data-a]"); if (!b) return;
  const uid = b.closest("tr").dataset.uid, a = b.dataset.a;
  const body = ["user", "admin"].includes(a) ? { role: a } : { status: a };
  b.disabled = true;
  try { await api(`/api/admin/users/${encodeURIComponent(uid)}`, { method: "PATCH", json: body }); loadUsers(); }
  catch (err) { window.alert(err.message); b.disabled = false; }
});

/* =========================================================
   시작
   ========================================================= */
buildTable();
TEXT_KEYS.concat(NUM_KEYS).forEach((k) => $(k).addEventListener("input", onEdit));
["qty", "fac", "ledP"].forEach((k) => $(k).addEventListener("blur", (e) => { e.target.value = f0(normalize({ [k]: e.target.value })[k]); }));
window.addEventListener("beforeunload", (e) => { if (dirty && me) { e.preventDefault(); e.returnValue = ""; } });
fillInputs(Object.assign({}, DEFAULTS, { date: today() }));
setDoc(null, false);

(async () => {
  try { cfg = await (await fetch("/api/config")).json(); }
  catch (e) { cfg = { authMode: "firebase", firebase: null, allowedDomains: [] }; }
  if (cfg.allowedDomains.length) { $("domainHint").hidden = false; $("domainHint").textContent = "가입 가능 이메일: @" + cfg.allowedDomains.join(", @"); }
  if (cfg.authMode === "dev") {
    $("cfgErr").hidden = false; $("cfgErr").textContent = "개발 모드: 아무 이메일로나 로그인됩니다 (테스트 전용).";
    document.body.classList.remove("loading");
    refreshMe();
    return;
  }
  if (!cfg.firebase || !window.firebase) {
    $("cfgErr").hidden = false;
    $("cfgErr").textContent = !cfg.firebase ? "서버에 FIREBASE_WEB_CONFIG 설정이 없습니다. 관리자에게 문의하세요." : "로그인 모듈을 불러오지 못했습니다. 인터넷 연결을 확인하세요.";
    document.body.classList.remove("loading");
    return;
  }
  firebase.initializeApp(cfg.firebase);
  fbAuth = firebase.auth(); fbAuth.languageCode = "ko";
  fbAuth.onAuthStateChanged(() => { document.body.classList.remove("loading"); refreshMe(); });
})();
})();

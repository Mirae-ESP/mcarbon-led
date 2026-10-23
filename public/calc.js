/* LED 절감 계산 — 브라우저(미리보기)와 서버(파일 생성)가 같은 식을 씁니다.
   INPUT_DATA.xlsx 의 수식과 동일합니다. */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.LEDCalc = factory();
})(typeof self !== "undefined" ? self : this, function () {
  const PITCH_PER_HA = 1.3; // 원본 제안서 기준: 1ha ≈ 축구장 1.3개

  const DEFAULTS = {
    site: "고양호수마을 1단지", to: "입주자대표회의", date: "", author: "",
    w: 32, qty: 995, hrs: 24, days: 365, price: 230, esc: 5,
    effOld: 120, effNew: 180, iot: 25,
    fac: 25000, facK: 2, ledP: 30000, cyc: 3,
    ef: 0.4781, efS: 0.4173, tree: 6.6, forest: 11,
    shares: [20, 20, 20, 30, 30, 40, 40, 100, 100, 100], // 년차별 아파트 비율(%)
  };
  // INPUT_DATA.xlsx 에 고정(하드코딩)된 값 — 웹에서 묻지 않음
  //  (B14 M-Carbon 효율은 웹에서 입력) B15 IoT 25%, B21 추가시설비 25,000, B22 회수 2, B41 LED 단가 30,000,
  //  H4:H13 성과공유 비율, 수식 속 365일 · 1.05(5% 상승) · 8/3(교체주기 3년), PPT 각주 배출계수 0.4781
  const FIXED = { iot: 25, esc: 5, fac: 25000, facK: 2, ledP: 30000, cyc: 3, ef: 0.4781, forest: 11,
    shares: [20, 20, 20, 30, 30, 40, 40, 100, 100, 100], to: "입주자대표회의" };
  const EXCEL_DAYS = 365;
  // 회사 설정(관리자만 변경) — 엑셀·PPT에만 쓰이는 값
  const PROPOSAL_KEYS = ["to","effNew","iot","esc","fac","facK","ledP","cyc","ef","forest","shares"];
  const NUM_KEYS = ["w","qty","hrs","days","price","esc","effOld","effNew","iot","fac","facK","ledP","cyc","ef","efS","tree","forest"];
  const LIMITS = { w:[0,10000], qty:[0,1e6], hrs:[0,24], days:[0,366], price:[0,10000], esc:[-50,100],
    effOld:[0,1000], effNew:[0,1000], iot:[0,100], fac:[0,1e8], facK:[0,100], ledP:[0,1e8], cyc:[0,100],
    ef:[0,10], efS:[0,10], tree:[0,1000], forest:[0,1000] };

  const toNum = (v) => { const n = parseFloat(String(v ?? "").replace(/,/g, "")); return isFinite(n) ? n : 0; };
  const str = (v, max) => String(v ?? "").replace(/[\u0000-\u001f]/g, " ").trim().slice(0, max);

  /** 사용자가 보낸 값을 안전한 입력 객체로 정리 */
  function normalize(raw) {
    raw = raw || {};
    const v = {
      site: str(raw.site, 60) || "○○단지",
      to: str(raw.to, 40), date: str(raw.date, 20), author: str(raw.author, 40),
    };
    for (const k of NUM_KEYS) {
      const [lo, hi] = LIMITS[k];
      v[k] = Math.min(hi, Math.max(lo, raw[k] === undefined ? DEFAULTS[k] : toNum(raw[k])));
    }
    const sh = Array.isArray(raw.shares) ? raw.shares : DEFAULTS.shares;
    v.shares = Array.from({ length: 10 }, (_, i) => Math.min(100, Math.max(0, toNum(sh[i] ?? 0))));
    // 엑셀 고정값은 항상 원본 값으로
    Object.assign(v, FIXED, { shares: FIXED.shares.slice() });
    return v;
  }

  /** 계산 (v: normalize 결과, shares는 % 단위) */
  function compute(v) {
    const r = {};
    r.dayKw = v.w * v.hrs * v.qty / 1000;
    r.useYr = r.dayKw * EXCEL_DAYS;   // 엑셀 B7 = B6*365 (고정)
    r.costYr = r.useYr * v.price;
    r.ratio = v.effOld > 0 ? (v.effNew / v.effOld) - 1 + v.iot / 100 : 0;
    r.saveKwh = r.useYr * r.ratio;
    r.saveWon = r.costYr * r.ratio;
    r.inv = v.fac * v.qty * v.facK;
    r.repN = v.cyc > 0 ? Math.floor(8 / v.cyc) : 0;
    r.rep = v.ledP * r.repN * v.qty;
    r.years = []; let acc = 0;
    for (let i = 0; i < 10; i++) {
      const s = r.saveWon * Math.pow(1 + v.esc / 100, i), sh = v.shares[i] / 100;
      const a = s * sh, o = s * (1 - sh); acc += a;
      r.years.push({ y: i + 1, save: s, share: sh, apt: a, op: o, acc });
    }
    r.saveTot = r.years.reduce((t, y) => t + y.save, 0);
    r.aptTot = r.years.reduce((t, y) => t + y.apt, 0);
    r.opTot = r.years.reduce((t, y) => t + y.op, 0);
    r.netTot = r.aptTot + r.rep;
    r.contract = v.shares.filter((s) => s < 100).length;
    r.co2 = r.saveKwh * v.ef / 1000;
    r.trees = v.tree > 0 ? r.co2 * 1000 / v.tree : 0;
    r.ha = v.forest > 0 ? r.co2 / v.forest : 0;
    r.pitch = r.ha * PITCH_PER_HA;
    return r;
  }

  /** 화면용 산출 (원본 'LED 교체 절감효과 산출서' HTML 과 같은 식 — LED 광효율은 입력한 M-Carbon 등 효율) */
  function computeScreen(v) {
    const base = v.qty * v.hrs * v.days / 1000;
    const wNew = v.effNew > 0 ? v.w * v.effOld / v.effNew : 0;
    const useOld = v.w * base, useNew = wNew * base, e = Math.max(useOld - useNew, 0);
    const m = e * v.price, c = e * v.efS, t = v.tree > 0 ? c / v.tree : 0;
    const pct = useOld > 0 ? useNew / useOld * 100 : 0;
    return { wNew, useOld, useNew, e, m, c, t, pct, rate: useOld > 0 ? Math.max(0, 100 - pct) : 0, costOld: useOld * v.price };
  }

  // 받침 여부에 따른 조사 (이/가 등)
  function josa(word, a, b) {
    const c = String(word).trim().slice(-1), k = c.charCodeAt(0);
    if (k >= 0xac00 && k <= 0xd7a3) return (k - 0xac00) % 28 ? a : b;
    if (/[0-9]/.test(c)) return "013678".includes(c) ? a : b;
    if (/[lmnrLMNR]/.test(c)) return a;
    return b;
  }
  const f0 = (n) => Math.round(n).toLocaleString("ko-KR");
  const f1 = (n) => n.toLocaleString("ko-KR", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  const man = (n) => Math.round(n / 1e4).toLocaleString("ko-KR");

  return { DEFAULTS, FIXED, NUM_KEYS, PROPOSAL_KEYS, PITCH_PER_HA, normalize, compute, computeScreen, josa, f0, f1, man };
});

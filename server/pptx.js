// 제안서 PPT 생성 — 원본 12장 디자인 위에 현장별 이름·수치를 얹습니다.
// 슬라이드 이미지는 서버(server/assets/slides)에만 있고 사용자에게 직접 공개되지 않습니다.
const fs = require("fs");
const path = require("path");
const PptxGenJS = require("pptxgenjs");
const { compute, josa, f0, f1, man } = require("../public/calc.js");

const SLIDES = {};
for (let i = 1; i <= 12; i++) {
  const k = "s" + String(i).padStart(2, "0");
  SLIDES[k] = "image/jpeg;base64," + fs.readFileSync(path.join(__dirname, "assets", "slides", k + ".jpg")).toString("base64");
}

const PX = 13.333 / 1376; // 원본 슬라이드 1px → inch
const px = (n) => +(n * PX).toFixed(3);
const FONT = "Malgun Gothic";

// 글자 폭을 추정해 한 줄에 들어가는 폰트 크기 계산
function fit(text, maxW_px, maxPt, minPt = 10) {
  let em = 0;
  for (const ch of text) em += /[ㄱ-힝一-鿿]/.test(ch) ? 1 : ch === " " ? 0.3 : 0.58;
  const pt = (maxW_px * PX * 72) / (em || 1);
  return Math.max(minPt, Math.min(maxPt, Math.floor(pt * 0.98)));
}
async function buildPptx(v) {
  const r = compute(v);
  const site = v.site;
  const pptx = new PptxGenJS();
  pptx.defineLayout({ name: "MC", width: 13.333, height: +(768 * PX).toFixed(3) });
  pptx.layout = "MC";
  pptx.author = v.author || "미래이에스피";
  pptx.company = "미래이에스피(주)";
  pptx.title = `${site} M-카본 LED 교체 제안서`;
  const T = (s, text, o) => s.addText(text, Object.assign({ fontFace: FONT, margin: 0, valign: "middle" }, o));
  const bgSlide = (k) => { const s = pptx.addSlide(); s.background = { data: SLIDES[k] }; return s; };

  // 1. 표지
  let s = bgSlide("s01");
  const t1 = `${site} 지하주차장`;
  T(s, t1, { x: px(162), y: px(212), w: px(760), h: px(72), fontSize: fit(t1, 760, 33, 18), bold: true, color: "1B2740" });
  const rc = `${site} ${v.to} 귀중`.replace(/\s+/g, " ").trim();
  T(s, rc, { x: px(560), y: px(588), w: px(660), h: px(44), fontSize: fit(rc, 660, 15, 10), bold: true, color: "1B2740", align: "right" });
  ["s02", "s03", "s04"].forEach(bgSlide);

  // 5. 성과공유 — 원본 슬라이드 그대로
  bgSlide("s05");
  const labels = r.years.map((y) => y.y + "년차");

  // 6. 10년 누적 절감 시뮬레이션
  s = bgSlide("s06");
  const t6 = `${site} 10년 누적 절감 시뮬레이션`;
  T(s, t6, { x: px(66), y: px(52), w: px(1000), h: px(70), fontSize: fit(t6, 1000, 32, 20), bold: true, color: "FFFFFF" });
  s.addShape(pptx.ShapeType.roundRect, { x: px(66), y: px(130), w: px(910), h: px(44), rectRadius: 0.22, fill: { color: "FFFFFF", transparency: 88 }, line: { color: "FFFFFF", transparency: 55, width: 1 } });
  s.addText([{ text: "초기 투자비 0원으로 창출되는 아파트의 순수 재무 이익 ", options: { bold: true, fontSize: 14 } },
    { text: `(한전 평균단가 ${f0(v.price)}원/kWh, 연 ${v.esc}% 인상 반영 기준)`, options: { fontSize: 11.5 } }],
    { x: px(86), y: px(130), w: px(880), h: px(44), fontFace: FONT, color: "FFFFFF", margin: 0, valign: "middle" });
  s.addShape(pptx.ShapeType.roundRect, { x: px(62), y: px(192), w: px(828), h: px(108), rectRadius: 0.12, fill: { color: "0B1A14", transparency: 35 }, line: { color: "3DDC84", width: 2 } });
  T(s, "아파트 10년 누적 순수익 (예측)", { x: px(62), y: px(200), w: px(828), h: px(22), fontSize: 10.5, color: "C9D6CF", align: "center" });
  T(s, `총 ${f0(r.netTot)}원 (약 ${man(r.netTot)}만 원)`, { x: px(62), y: px(222), w: px(828), h: px(48), fontSize: 27, bold: true, color: "3DDC84", align: "center" });
  const sub6 = `전기 절감 배분수익 ${man(r.aptTot)}만 원 + 자체 시설교체 추가투자 비용 절감액 ${man(r.rep)}만 원`;
  s.addShape(pptx.ShapeType.roundRect, { x: px(250), y: px(272), w: px(452), h: px(20), rectRadius: 0.1, fill: { color: "000000", transparency: 45 }, line: { type: "none" } });
  T(s, sub6, { x: px(250), y: px(272), w: px(452), h: px(20), fontSize: 8.5, color: "E5ECE8", align: "center" });
  s.addChart(pptx.ChartType.bar, [{ name: "아파트 수익(만원)", labels, values: r.years.map((y) => Math.round(y.apt / 1e4)) }],
    { x: px(52), y: px(318), w: px(845), h: px(380), barDir: "col", barGapWidthPct: 55, chartColors: ["3DDC84"],
      showValue: true, dataLabelFormatCode: '"약 "#,##0"만 원"', dataLabelColor: "FFFFFF", dataLabelFontSize: 8.5, dataLabelFontBold: true, dataLabelFontFace: FONT, dataLabelPosition: "outEnd",
      catAxisLabelColor: "FFFFFF", catAxisLabelFontSize: 11, catAxisLabelFontFace: FONT, catAxisLineShow: true, catAxisLineColor: "5B6B66",
      valAxisHidden: true, valGridLine: { style: "none" }, catGridLine: { style: "none" }, showLegend: false });
  // 원본 표기 방식: 전력 절감량은 천 kWh 단위 반올림, CO₂는 소수 첫째 자리, 소나무는 10그루 단위
  const kwhR = Math.round(r.saveKwh / 1000) * 1000;
  const co2R = Math.round(r.co2 * 10) / 10;
  const treesR = v.tree > 0 ? Math.floor(co2R * 1000 / v.tree / 10) * 10 : 0;
  const haR = v.forest > 0 ? Math.round(co2R / v.forest * 10) / 10 : 0;
  const pitchR = Math.round(haR * 1.3 * 10) / 10;   // 원본: 1ha ≈ 축구장 1.3개
  const nf = (n) => n.toLocaleString("ko-KR", { maximumFractionDigits: 1 });
  const X0 = 922, W0 = 410;
  s.addShape(pptx.ShapeType.roundRect, { x: px(X0), y: px(192), w: px(W0), h: px(512), rectRadius: 0.15, fill: { color: "0B1A14", transparency: 30 }, line: { color: "3DDC84", width: 1.5, transparency: 20 } });
  s.addShape(pptx.ShapeType.ellipse, { x: px(X0 + 22), y: px(210), w: px(30), h: px(30), fill: { color: "3DDC84" }, line: { type: "none" } });
  T(s, "CO₂", { x: px(X0 + 22), y: px(210), w: px(30), h: px(30), fontSize: 7, bold: true, color: "0B1A14", align: "center" });
  T(s, "탄소배출 절감 효과", { x: px(X0 + 62), y: px(208), w: px(320), h: px(34), fontSize: 16, bold: true, color: "FFFFFF" });
  T(s, `전력 절감 → 온실가스 감축 환산 (연간 약 ${f0(kwhR)}kWh 절감 기준)`, { x: px(X0 + 20), y: px(244), w: px(W0 - 40), h: px(18), fontSize: 7.5, color: "A9B8B1" });
  const rowBox = (y, h, label, val, unit, hi) => {
    s.addShape(pptx.ShapeType.roundRect, { x: px(X0 + 18), y: px(y), w: px(W0 - 36), h: px(h), rectRadius: 0.1,
      fill: { color: hi ? "0F3A26" : "FFFFFF", transparency: hi ? 10 : 92 }, line: { color: hi ? "3DDC84" : "FFFFFF", transparency: hi ? 0 : 80, width: hi ? 1.5 : 0.75 } });
    if (hi) {
      T(s, label, { x: px(X0 + 18), y: px(y + 6), w: px(W0 - 36), h: px(20), fontSize: 10, color: "E5ECE8", align: "center" });
      s.addText([{ text: "약 " + val + " ", options: { fontSize: 24, bold: true } }, { text: unit, options: { fontSize: 13, bold: true } }],
        { x: px(X0 + 18), y: px(y + 26), w: px(W0 - 36), h: px(h - 30), fontFace: FONT, color: "3DDC84", align: "center", valign: "middle", margin: 0 });
    } else {
      T(s, label, { x: px(X0 + 34), y: px(y), w: px(170), h: px(h), fontSize: 10.5, color: "E5ECE8" });
      s.addText([{ text: "약 " + val + " ", options: { fontSize: 19, bold: true } }, { text: unit, options: { fontSize: 9, color: "C9D6CF" } }],
        { x: px(X0 + 170), y: px(y), w: px(W0 - 206), h: px(h), fontFace: FONT, color: "FFFFFF", align: "right", valign: "middle", margin: 0 });
    }
  };
  rowBox(270, 52, "연간 전력 절감량", f0(kwhR), "kWh");
  rowBox(330, 52, "연간 CO₂ 감축량", f1(co2R), "tCO₂");
  rowBox(392, 78, "10년 누적 CO₂ 감축량", nf(co2R * 10), "tCO₂", true);
  T(s, "나무심기 환산 효과", { x: px(X0 + 22), y: px(480), w: px(300), h: px(22), fontSize: 11, bold: true, color: "FFFFFF" });
  for (let i = 0; i < 9; i++) {
    const tx = X0 + 30 + i * 39.5;
    s.addShape(pptx.ShapeType.triangle, { x: px(tx), y: px(507), w: px(32), h: px(30), fill: { color: "2FBF6A" }, line: { type: "none" } });
    s.addShape(pptx.ShapeType.rect, { x: px(tx + 13), y: px(537), w: px(6), h: px(8), fill: { color: "7A5A3A" }, line: { type: "none" } });
  }
  T(s, `30년생 소나무 약 ${f0(treesR)}그루`, { x: px(X0), y: px(552), w: px(W0), h: px(32), fontSize: 18, bold: true, color: "3DDC84", align: "center" });
  T(s, "가 1년 동안 흡수하는 CO₂를 매년 줄이는 효과", { x: px(X0), y: px(584), w: px(W0), h: px(18), fontSize: 9, color: "C9D6CF", align: "center" });
  s.addShape(pptx.ShapeType.line, { x: px(X0 + 30), y: px(608), w: px(W0 - 60), h: 0, line: { color: "FFFFFF", transparency: 75, width: 0.75 } });
  T(s, `= 소나무 숲 약 ${nf(haR)}ha (축구장 약 ${nf(pitchR)}개) 조성 효과`, { x: px(X0), y: px(614), w: px(W0), h: px(24), fontSize: 11, bold: true, color: "FFFFFF", align: "center" });
  T(s, `* 산출 기준: 국가 전력 배출계수 ${v.ef} tCO₂eq/MWh,\n  30년생 소나무 1그루 연 ${v.tree}kg CO₂ 흡수(국립산림과학원), 소나무 숲 1ha 연 ${v.forest}t`,
    { x: px(X0 + 22), y: px(645), w: px(W0 - 40), h: px(46), fontSize: 7, color: "A9B8B1", valign: "top" });
  T(s, "*상기 시뮬레이션은 제안 단가의 기준치를 적용한 예시이며, 실제 전력사용량 및 현장 상황에 따라 1원 단위로 투명하게 정산됩니다.*",
    { x: px(0), y: px(718), w: px(1376), h: px(30), fontSize: 10.5, color: "A9B3B0", align: "center" });

  ["s07", "s08", "s09"].forEach(bgSlide);
  // 10. 무상 양도
  s = bgSlide("s10");
  T(s, `7년 계약 종료 시, 어떠한 추가 비용 요구나 철거 없이 설치된 최첨단 IoT LED 조명 자산 일체를 ${site}에 100% 무상 양도합니다.`,
    { x: px(842), y: px(208), w: px(420), h: px(90), fontSize: 11, color: "1F2937", valign: "top", lineSpacingMultiple: 1.2 });
  bgSlide("s11");
  // 12. 마무리
  s = bgSlide("s12");
  const t12 = `${site}의 가치를 높이는`;
  T(s, [{ text: t12, options: { fontSize: fit(t12, 1000, 34, 20), breakLine: true } }, { text: "가장 스마트한 결정", options: { fontSize: 34 } }],
    { x: px(188), y: px(88), w: px(1000), h: px(132), bold: true, color: "FFFFFF", align: "center", lineSpacingMultiple: 1.05 });
  const t12b = `이제, ${site}${josa(site, "이", "가")} 미래형 친환경 스마트 단지로 거듭날 차례입니다.`;
  T(s, t12b, { x: px(140), y: px(458), w: px(1096), h: px(50), fontSize: fit(t12b, 1096, 19, 11), color: "A7AEB5", align: "center" });

  return pptx.write({ outputType: "nodebuffer" });
}

module.exports = { buildPptx };

// 제안서 PPT 생성
// 보내주신 'M-카본 LED 제안서 (new_FINAL)' 를 그대로 쓰고, 빨간 표시가 있던 자리만 바꿉니다.
//  - 1장: 고객명 (제목, 귀중)
//  - 6장: 고객명, 공용요금 단가, 10년 누적 순수익, 년차별 금액 10개, 연간 전력 절감량, 연간 CO₂, 10년 CO₂, 소나무 그루
//  - 12장: 고객명 (제목, 마지막 문장)
// 그 외 모든 내용은 원본 그대로입니다.
const fs = require("fs");
const path = require("path");
const JSZip = require("jszip");
const { compute, josa, f0, f1, man } = require("../public/calc.js");

const TEMPLATE = fs.readFileSync(path.join(__dirname, "assets", "template.pptx"));
const PX_PT = (13.333 * 72) / 1376; // 원본 이미지 1px → pt

const xml = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
// 글자 폭을 추정해 상자에 한 줄로 들어가는 크기(pt) 계산
function fit(text, boxPx, maxPt, minPt) {
  let em = 0;
  for (const ch of text) em += /[ㄱ-힝一-鿿]/.test(ch) ? 1 : ch === " " ? 0.3 : 0.58;
  return Math.max(minPt, Math.min(maxPt, Math.floor((boxPx * PX_PT) / (em || 1) * 0.97 * 2) / 2));
}
// 해당 이름의 도형 안 글자 크기 변경 (sz 는 1/100 pt)
function setSize(slideXml, shapeName, pt) {
  const i = slideXml.indexOf(`name="${shapeName}"`);
  if (i < 0) return slideXml;
  const start = slideXml.lastIndexOf("<p:sp>", i), end = slideXml.indexOf("</p:sp>", i);
  const block = slideXml.slice(start, end).replace(/ sz="\d+"/g, ` sz="${Math.round(pt * 100)}"`);
  return slideXml.slice(0, start) + block + slideXml.slice(end);
}

async function buildPptx(v) {
  const r = compute(v);
  const site = v.site;

  // 원본 표기 방식
  const kwhR = Math.round(r.saveKwh / 1000) * 1000;              // 약 22,000
  const co2R = Math.round(r.co2 * 10) / 10;                      // 약 10.5
  const co210 = Math.round(co2R * 10 * 10) / 10;                 // 약 105
  const TREE_KG = 6.6; // 원본 PPT 각주에 고정된 값 (30년생 소나무 1그루 연 6.6kg)
  const treesR = Math.floor(co2R * 1000 / TREE_KG / 10) * 10;   // 약 1,590
  const nf = (n) => n.toLocaleString("ko-KR", { maximumFractionDigits: 1 });

  const vals = {
    SITE: site,
    JOSA: josa(site, "이", "가"),
    PRICE: f0(v.price),
    TOTAL: man(r.netTot),
    KWH: f0(kwhR),
    CO2: f1(co2R),
    CO210: nf(co210),
    TREES: f0(treesR),
  };
  r.years.forEach((y, i) => (vals["Y" + (i + 1)] = man(y.apt)));

  const zip = await JSZip.loadAsync(TEMPLATE);
  const fill = (s) => s.replace(/\{\{([A-Z0-9]+)\}\}/g, (m, k) => (k in vals ? xml(vals[k]) : m));

  // 고객명이 길면 한 줄에 맞게 글자 크기 조정 (상자 너비 px, 최대/최소 pt)
  const sizes = {
    "ppt/slides/slide1.xml": [["S1_TITLE", `${site} 지하주차장`, 738, 33, 18], ["S1_TO", `${site} 입주자대표회의 귀중`, 661, 15, 9]],
    "ppt/slides/slide6.xml": [["S6_TITLE", `${site} 10년 누적 절감 시뮬레이션`, 994, 33, 18]].concat(
      // 막대 위 금액: 가장 긴 금액에 맞춰 10개 모두 같은 크기 (막대 간격 약 80px)
      (() => { const longest = r.years.map((y) => `약 ${man(y.apt)}만 원`).sort((a, b) => b.length - a.length)[0];
        const pt = fit(longest, 78, 9, 6); return r.years.map((y, i) => ["S6_Y" + (i + 1), longest, 78, pt, pt]); })()),
    "ppt/slides/slide12.xml": [["S12_T1", `${site}의 가치를 높이는`, 1000, 33, 18],
      ["S12_T2", `이제, ${site}${vals.JOSA} 미래형 친환경 스마트 단지로 거듭날 차례입니다.`, 1096, 18, 10]],
  };
  for (const file of Object.keys(sizes)) {
    let s = fill(await zip.file(file).async("string"));
    for (const [name, text, w, max, min] of sizes[file]) s = setSize(s, name, fit(text, w, max, min));
    zip.file(file, s);
  }
  zip.file("docProps/core.xml", fill(await zip.file("docProps/core.xml").async("string")));
  return zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE", compressionOptions: { level: 6 } });
}

module.exports = { buildPptx };

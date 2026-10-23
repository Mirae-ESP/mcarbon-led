// 절감 산출 엑셀 생성
// 보내주신 INPUT_DATA.xlsx 원본을 그대로 열어 입력칸 값만 바꿉니다.
// 배치·서식·문구·수식·고정값은 원본과 동일하고, 현장 입력칸(B2·B3·B4·B5·B8·B13)만 채웁니다.
const path = require("path");
const ExcelJS = require("exceljs");
const { compute, f0 } = require("../public/calc.js");

const TEMPLATE = path.join(__dirname, "assets", "INPUT_DATA_styled.xlsx"); // 원본 INPUT_DATA 에 서식만 입히고 요약 시트를 추가한 것

async function buildExcel(v) {
  const r = compute(v);
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(TEMPLATE);
  wb.calcProperties.fullCalcOnLoad = true; // 엑셀에서 열 때 다시 계산
  const ws = wb.getWorksheet("절감 산출");
  const val = (a, x) => { ws.getCell(a).value = x; };
  const fx = (a, formula, result) => { ws.getCell(a).value = result === undefined ? { formula } : { formula, result }; };

  // ---- 입력칸: 현장마다 다른 값만 (나머지 고정값 셀은 원본 그대로 둠) ----
  val("B2", v.site);
  val("B3", v.w);
  val("B4", v.hrs);
  val("B5", v.qty);
  val("B8", v.price);
  val("B13", v.effOld);

  // ---- 원본 수식 그대로 (계산값을 함께 넣어 미리보기에서도 보이게) ----
  fx("B6", "B3*B4*B5/1000", r.dayKw);
  fx("B7", "B6*365", r.useYr);
  fx("B9", "B7*B8", r.costYr);
  fx("B17", "(B14/B13)-1+B15", r.ratio);
  fx("B18", "R4");                       // 원본 그대로 (R4는 빈 칸)
  fx("B19", "B9*B17", r.saveWon);
  fx("B23", "B21*B5*B22", r.inv);
  r.years.forEach((y, i) => {
    const row = 27 + i;
    fx("B" + row, i === 0 ? "B19" : `B${row - 1}*1.05`, y.save);
  });
  fx("B40", "ROUNDDOWN((8/3),0)", r.repN);
  fx("B42", "B41*B40*B5", r.rep);
  r.years.forEach((y, i) => {
    const row = 4 + i;
    fx("F" + row, "B" + (27 + i), y.save);
    fx("G" + row, `1-H${row}`, 1 - y.share);
    fx("I" + row, `$F${row}*G${row}`, y.op);
    fx("J" + row, `$F${row}*H${row}`, y.apt);
  });
  fx("J14", "B42", r.rep);
  fx("I15", "SUM(I4:I13)", r.opTot);
  fx("J15", "SUM(J4:J14)", r.netTot);

  // ---- 제안 요약 시트: 수식은 템플릿 그대로, 미리 계산한 값만 넣기 ----
  const sm = wb.getWorksheet("제안 요약");
  const res = (a, result) => { const c = sm.getCell(a); if (c.formula) c.value = { formula: c.formula, result }; };
  res("B2", (v.site ? v.site + " " : "") + "LED 교체 절감효과 산출서");
  res("B6", r.useYr); res("D6", r.costYr); res("F6", r.ratio); res("G6", r.saveWon);
  res("B9", r.netTot);
  res("B10", `전기 절감 배분수익 ${f0(r.aptTot)}원 + 자체 시설교체 추가투자 비용 절감액 ${f0(r.rep)}원`);
  const maxApt = Math.max(...r.years.map((y) => y.apt)) || 1;
  r.years.forEach((y, i) => {
    const row = 14 + i;
    res("B" + row, y.y); res("C" + row, y.save); res("D" + row, y.share); res("E" + row, y.apt);
    res("F" + row, y.op); res("G" + row, y.acc); res("H" + row, "█".repeat(Math.round(y.apt / maxApt * 22)));
  });
  res("C24", r.saveTot); res("E24", r.aptTot); res("F24", r.opTot); res("E25", r.rep); res("E26", r.netTot);
  res("B28", `산출 기준: 현장 입력값 — 소비전력 ${v.w}W · 일일 점등 ${v.hrs}시간 · LED ${f0(v.qty)}등 · 전기요금 ${v.price}원/kWh · 현재 등 효율 ${v.effOld}lm/W. 고정값 — M-Carbon 등 효율 180lm/W · Smart IoT 추가 절감 25% · 전기요금 연 5% 상승 · 성과공유 비율(산출 시트 H열). 상세 계산은 ‘절감 산출’ 시트 참고.`);

  return Buffer.from(await wb.xlsx.writeBuffer());
}

module.exports = { buildExcel };

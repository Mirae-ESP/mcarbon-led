// 절감 산출 엑셀 생성
// 보내주신 INPUT_DATA.xlsx 원본을 그대로 열어 입력칸 값만 바꿉니다.
// 배치·서식·문구·수식은 원본과 동일합니다. (운전일수·요금 상승률·교체주기는 원본 수식 속 숫자로 들어갑니다)
const path = require("path");
const ExcelJS = require("exceljs");
const { compute } = require("../public/calc.js");

const TEMPLATE = path.join(__dirname, "assets", "INPUT_DATA.xlsx");
const num = (n) => String(+Number(n).toFixed(10)); // 수식에 넣을 숫자 표기

async function buildExcel(v) {
  const r = compute(v);
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(TEMPLATE);
  wb.calcProperties.fullCalcOnLoad = true; // 엑셀에서 열 때 다시 계산
  const ws = wb.worksheets[0];
  const val = (a, x) => { ws.getCell(a).value = x; };
  const fx = (a, formula, result) => { ws.getCell(a).value = result === undefined ? { formula } : { formula, result }; };

  // ---- 입력칸 (원본 노란 칸 등) ----
  val("B2", v.site);
  val("B3", v.w);
  val("B4", v.hrs);
  val("B5", v.qty);
  val("B8", v.price);
  val("B13", v.effOld);
  val("B14", v.effNew);
  val("B15", v.iot / 100);
  val("B21", v.fac);
  val("B22", v.facK);
  val("B41", v.ledP);
  r.years.forEach((y, i) => val("H" + (4 + i), y.share));

  // ---- 원본 수식 (값은 미리 계산해 넣어 미리보기에서도 보이게) ----
  const g = 1 + v.esc / 100;
  fx("B6", "B3*B4*B5/1000", r.dayKw);
  fx("B7", `B6*${num(v.days)}`, r.useYr);
  fx("B9", "B7*B8", r.costYr);
  fx("B17", "(B14/B13)-1+B15", r.ratio);
  fx("B18", "R4");                       // 원본 그대로 (R4는 빈 칸)
  fx("B19", "B9*B17", r.saveWon);
  fx("B23", "B21*B5*B22", r.inv);
  val("B25", `${num(v.esc)}% 전기용금 상승 기준`);
  r.years.forEach((y, i) => {
    const row = 27 + i;
    fx("B" + row, i === 0 ? "B19" : `B${row - 1}*${num(g)}`, y.save);
  });
  fx("B40", `ROUNDDOWN((8/${num(v.cyc)}),0)`, r.repN);
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

  return Buffer.from(await wb.xlsx.writeBuffer());
}

module.exports = { buildExcel };

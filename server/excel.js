// 절감 산출 엑셀 생성 (INPUT_DATA.xlsx 와 같은 배치, 수식 포함)
const ExcelJS = require("exceljs");
const { compute } = require("../public/calc.js");

async function buildExcel(v) {
  const r = compute(v);
  const wb = new ExcelJS.Workbook();
  wb.creator = v.author || "M-Carbon";
  wb.calcProperties.fullCalcOnLoad = true;
  const ws = wb.addWorksheet("절감산출");
  const widths = { A: 31.9, B: 26.1, C: 2.1, D: 2, E: 8.9, F: 14, G: 7, H: 7, I: 14.9, J: 13.9, K: 4, L: 11.8, M: 16 };
  Object.entries(widths).forEach(([k, w]) => (ws.getColumn(k).width = w));
  const YEL = "FFFFFF00", ORG = "FFFFC000", GRN = "FFE2EFDA", GRY = "FFF2F2F2", BLU = "FFDDEBF7", GRN2 = "FF92D050";
  const NF = "#,##0", P = "0%";
  const thin = { style: "thin", color: { argb: "FFBFBFBF" } }, border = { top: thin, left: thin, bottom: thin, right: thin };
  const mk = (sheet) => (addr, val, o = {}) => {
    const c = sheet.getCell(addr);
    c.value = o.f !== undefined ? { formula: o.f, result: val } : val;
    if (o.nf) c.numFmt = o.nf;
    if (o.fill) c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: o.fill } };
    if (o.b) c.font = { bold: true, size: o.sz || 11 };
    if (o.al) c.alignment = { horizontal: o.al, vertical: "middle" };
    if (o.br !== false) c.border = border;
    return c;
  };
  const put = mk(ws);

  put("A1", "전기사용량 비교", { b: true, br: false });
  put("A2", "고객명", { fill: YEL }); put("B2", v.site, { fill: YEL });
  put("A3", "소비전력[W]", { fill: YEL }); put("B3", v.w, { fill: YEL });
  put("A4", "일일점등시간[시간]", { fill: YEL }); put("B4", v.hrs, { fill: YEL });
  put("A5", "LED 등수", { fill: YEL }); put("B5", v.qty, { fill: YEL, nf: NF });
  put("A6", "일 사용량[KW]"); put("B6", r.dayKw, { f: "B3*B4*B5/1000", nf: "#,##0.00" });
  put("A7", "년간 전력사용량 [kWh]"); put("B7", r.useYr, { f: "B6*B10", nf: NF });
  put("A8", "전기요금[원/KW]", { fill: YEL }); put("B8", v.price, { fill: YEL, nf: NF });
  put("A9", "현재 기준 년간 전기요금", { fill: BLU }); put("B9", r.costYr, { f: "B7*B8", nf: NF, fill: BLU });
  put("A10", "연간 운전일수[일]", { fill: YEL }); put("B10", v.days, { fill: YEL });
  put("A11", "전기요금 연 상승률", { fill: YEL }); put("B11", v.esc / 100, { fill: YEL, nf: P });
  put("A12", "절감율 산출", { fill: ORG, b: true }); put("B12", "", { fill: ORG });
  put("A13", "현재 등 효율 [lm/W]", { fill: YEL }); put("B13", v.effOld, { fill: YEL });
  put("A14", "M-Carbon 등 효율 [lm/W]", { fill: YEL }); put("B14", v.effNew, { fill: YEL });
  put("A15", "Smart IoT추가 절감효율 [%]", { fill: ORG }); put("B15", v.iot / 100, { fill: ORG, nf: P });
  put("A17", "에너지 Saving Ratio"); put("B17", r.ratio, { f: "(B14/B13)-1+B15", nf: "0.0%" });
  put("A18", "연간 절감 전력 [kWh]"); put("B18", r.saveKwh, { f: "B7*B17", nf: NF });
  put("A19", "연간 절감 요금 [원]", { fill: BLU }); put("B19", r.saveWon, { f: "B9*B17", nf: NF, fill: BLU });
  put("A21", "추가시설비 단가", { fill: YEL }); put("B21", v.fac, { fill: YEL, nf: NF });
  put("A22", "회수/10년 기준", { fill: YEL }); put("B22", v.facK, { fill: YEL, nf: NF });
  put("A23", "투자비_LED단가적용(제품,시설 및 기타)"); put("B23", r.inv, { f: "B21*B5*B22", nf: NF, fill: GRN2 });
  put("A25", "년차별 절감 예상", { b: true });
  put("B25", `${v.esc}% 전기요금 상승 기준`, { f: 'TEXT(B11,"0%")&" 전기요금 상승 기준"' });
  r.years.forEach((y, i) => {
    const row = 27 + i;
    put("A" + row, y.y, { al: "center" });
    put("B" + row, y.save, { f: i === 0 ? "B19" : `B${row - 1}*(1+$B$11)`, nf: NF });
  });
  put("A39", "기존 조명 교체주기[년]", { fill: YEL }); put("B39", v.cyc, { fill: YEL });
  put("A40", "제품 교체비용[매3년] 교체횟수"); put("B40", r.repN, { f: "ROUNDDOWN(8/B39,0)" });
  put("A41", "led평균단가(제품+시설)", { fill: YEL }); put("B41", v.ledP, { fill: YEL, nf: NF });
  put("A42", "건물주 추가투자비용 절감액"); put("B42", r.rep, { f: "B41*B40*B5", nf: NF });

  put("E1", "성과공유", { b: true, br: false });
  ws.mergeCells("F2:F3"); ws.mergeCells("G2:H2"); ws.mergeCells("I2:J2");
  put("E2", "년", { fill: GRN, b: true, al: "center" }); put("F2", "운영수익", { fill: GRN, b: true, al: "center" });
  put("G2", "비율정의", { fill: GRY, b: true, al: "center" }); put("I2", "수익", { fill: GRN, b: true, al: "center" });
  put("E3", "수익자", { fill: GRN, al: "center" }); put("G3", "운영사", { fill: GRY, al: "center" }); put("H3", "건물", { fill: GRY, al: "center" });
  put("I3", "운영사", { fill: GRN, al: "center" }); put("J3", "건물", { fill: GRN, al: "center" });
  r.years.forEach((y, i) => {
    const row = 4 + i;
    put("E" + row, y.y, { al: "center" });
    put("F" + row, y.save, { f: "B" + (27 + i), nf: NF });
    put("G" + row, 1 - y.share, { f: `1-H${row}`, nf: P, fill: GRY });
    put("H" + row, y.share, { nf: P, fill: YEL });
    put("I" + row, y.op, { f: `$F${row}*G${row}`, nf: NF });
    put("J" + row, y.apt, { f: `$F${row}*H${row}`, nf: NF });
  });
  ws.mergeCells("E14:I14"); put("E14", "건물주 추가투지비용 절감액"); put("J14", r.rep, { f: "B42", nf: NF });
  ws.mergeCells("E15:H15"); put("E15", "총계", { b: true, al: "center" });
  put("I15", r.opTot, { f: "SUM(I4:I13)", nf: NF, b: true }); put("J15", r.netTot, { f: "SUM(J4:J14)", nf: NF, b: true });
  put("L2", "", { fill: YEL }); put("M2", "input information", { br: false });
  put("L3", "", { fill: ORG }); put("M3", "Calculated", { br: false });
  put("E18", "작성일", { fill: GRY }); ws.mergeCells("F18:G18"); put("F18", v.date);
  put("E19", "작성자", { fill: GRY }); ws.mergeCells("F19:G19"); put("F19", v.author);
  put("E20", "수신", { fill: GRY }); ws.mergeCells("F20:J20"); put("F20", `${v.site} ${v.to}`.trim());

  const s2 = wb.addWorksheet("10년 시뮬레이션");
  [30, 18, 12, 18, 18, 18].forEach((w, i) => (s2.getColumn(i + 1).width = w));
  const p2 = mk(s2), S = "'절감산출'!";
  s2.mergeCells("A1:F1"); p2("A1", `${v.site} 10년 누적 절감 시뮬레이션`, { b: true, sz: 14, br: false });
  ["년차", "전기요금 절감액", "아파트 비율", "아파트 수익", "제안사 수익", "아파트 누적"].forEach((h, i) =>
    p2(String.fromCharCode(65 + i) + "3", h, { b: true, fill: GRN, al: "center" }));
  r.years.forEach((y, i) => {
    const row = 4 + i;
    p2("A" + row, y.y, { al: "center" }); p2("B" + row, y.save, { f: S + "F" + row, nf: NF });
    p2("C" + row, y.share, { f: S + "H" + row, nf: P });
    p2("D" + row, y.apt, { f: S + "J" + row, nf: NF }); p2("E" + row, y.op, { f: S + "I" + row, nf: NF });
    p2("F" + row, y.acc, { f: i === 0 ? "D4" : `F${row - 1}+D${row}`, nf: NF });
  });
  p2("A14", "합계", { b: true, al: "center" }); p2("B14", r.saveTot, { f: "SUM(B4:B13)", nf: NF, b: true }); p2("C14", "");
  p2("D14", r.aptTot, { f: "SUM(D4:D13)", nf: NF, b: true }); p2("E14", r.opTot, { f: "SUM(E4:E13)", nf: NF, b: true }); p2("F14", "");
  const kv = [
    ["건물주 추가투자비용 절감액", r.rep, { f: S + "J14", nf: NF }],
    ["아파트 10년 누적 순수익", r.netTot, { f: "D14+B16", nf: NF, b: true, fill: GRN }],
    null,
    ["연간 전력 절감량 [kWh]", r.saveKwh, { f: S + "B18", nf: NF }],
    ["전력 배출계수 [kgCO2/kWh]", v.ef, { fill: YEL, nf: "0.0000" }],
    ["연간 CO2 감축량 [tCO2]", r.co2, { f: "B19*B20/1000", nf: "#,##0.0" }],
    ["10년 누적 CO2 감축량 [tCO2]", r.co2 * 10, { f: "B21*10", nf: "#,##0.0", b: true }],
    ["소나무 1그루 연간 흡수량 [kg]", v.tree, { fill: YEL }],
    ["30년생 소나무 환산 [그루]", r.trees, { f: "IF(B23>0,B21*1000/B23,0)", nf: NF }],
    ["소나무 숲 1ha 연간 흡수량 [t]", v.forest, { fill: YEL }],
    ["소나무 숲 면적 [ha]", r.ha, { f: "IF(B25>0,B21/B25,0)", nf: "0.00" }],
    ["축구장 환산 [개] (1개=0.714ha)", r.pitch, { f: "B26/0.714", nf: "0.0" }],
  ];
  kv.forEach((e, i) => { if (!e) return; const row = 16 + i; p2("A" + row, e[0], { fill: e[2].fill === GRN ? GRN : undefined }); p2("B" + row, e[1], e[2]); });

  return Buffer.from(await wb.xlsx.writeBuffer());
}

module.exports = { buildExcel };

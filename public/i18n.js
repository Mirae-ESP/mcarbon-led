/* 한국어 / English 화면 전환
   - 화면의 고정 문구는 아래 EN 사전으로 바꿉니다 (원문 한국어는 기억했다가 되돌림)
   - app.js 가 만드는 문구는 I18N.t(한국어, English) 로 고릅니다
   - 생성되는 엑셀·PPT 파일은 원본 양식(한국어) 그대로입니다 */
(() => {
"use strict";
const EN = {
  "LED 제안서 자동 생성기": "LED Proposal Generator",
  "미래이에스피(주)": "Mirae ESP Co., Ltd.",
  "미래이에스피": "Mirae ESP",
  "(주)": " Co., Ltd.",
  "로그인": "Log in",
  "스마트 LED 제안서 자동 생성기": "Smart LED Proposal Generator",
  "회원가입": "Sign up",
  "관리자 승인을 기다리고 있습니다.": "Waiting for administrator approval.",
  "가입한 이메일로 인증 메일을 보냈습니다. 메일의 링크를 누른 뒤": "We sent a verification email to your address. Click the link in the email, then press",
  "상태 새로고침": "Refresh status",
  "을 눌러주세요.": ".",
  "인증 메일 다시 보내기": "Resend verification email",
  "로그아웃": "Log out",
  "이메일": "Email",
  "비밀번호": "Password",
  "보기": "Show",
  "숨기기": "Hide",
  "로그인 상태 유지": "Keep me signed in",
  "비밀번호를 잊으셨나요?": "Forgot password?",
  "이름": "Name",
  "비밀번호 (8자 이상, 영문·숫자 포함)": "Password (8+ characters, letters and numbers)",
  "비밀번호 확인": "Confirm password",
  "계정 만들기": "Create account",
  "가입한 이메일을 입력하면 비밀번호 재설정 링크를 보내드립니다.": "Enter your account email and we'll send you a password reset link.",
  "재설정 링크 보내기": "Send reset link",
  "← 로그인으로 돌아가기": "← Back to log in",
  "스마트 LED 도입": "Smart LED",
  "제안서": "Proposal",
  "자동 생성기": "Generator",
  "현장 데이터를 입력하면 절감 산출 엑셀과 제안 PPT가 바로 만들어집니다": "Enter site data to instantly create the savings Excel and the proposal PowerPoint",
  "단지 / 시설명": "Complex / facility",
  "수신": "Addressed to",
  "작성일": "Date",
  "작성자": "Prepared by",
  "메뉴": "Menu",
  "제안서 작성": "New proposal",
  "제안서 목록": "Proposals",
  "사용자 관리": "Users",
  "사용자 관리 ": "Users ",
  "님": "",
  "관리자": "Admin",
  "파일을 만들면 자동으로 저장됩니다.": "Proposals are saved automatically when you create a file.",
  "제안서(엑셀·PPT) 기준 Saving Ratio가 100%를 넘습니다. 파일을 만들기 전에 광효율 값을 확인하세요.": "The proposal (Excel · PowerPoint) Saving Ratio is over 100%. Check the light efficiency value before creating files.",
  "새 제안서": "New",
  "저장": "Save",
  "Excel 생성": "Create Excel",
  "PowerPoint 생성": "Create PowerPoint",
  "현재 건물 현황": "Current building status",
  "기존 등기구": "Existing light fixtures",
  "소비전력": "Power consumption",
  "W[와트]": "W",
  "광효율": "Light efficiency",
  "운영 조건 (공통)": "Operating conditions",
  "설치 수량": "Number of fixtures",
  "개": "pcs",
  "일일 점등시간": "Daily lighting hours",
  "시간": "hrs",
  "연간 운전일수": "Operating days per year",
  "일": "days",
  "전력 단가": "Electricity price",
  "원/kWh": "KRW/kWh",
  "연간 예상 전력요금": "Estimated annual electricity cost",
  "연간 전력사용량": "Annual electricity use",
  "기존 등기구 기준 연간 전기요금": "Annual cost with existing fixtures",
  "고급 설정": "Advanced settings",
  "LED 효율 · IoT · 요금 상승률 · 투자비 · 환산 계수 (기본값 = INPUT_DATA 엑셀)": "LED efficiency · IoT · price increase · investment · conversion factors (defaults = INPUT_DATA Excel)",
  "절감율 산출": "Savings rate",
  "M-Carbon 등 효율": "M-Carbon LED efficiency",
  "Smart IoT 추가 절감": "Smart IoT extra savings",
  "요금 연 상승률": "Yearly price increase",
  "투자비 · 교체비용": "Investment · replacement cost",
  "추가시설비 단가": "Extra installation cost",
  "원/등": "KRW/fixture",
  "회수 계수 (10년 기준)": "Recovery factor (10 years)",
  "배": "×",
  "LED 평균단가 (제품+시설)": "Average LED unit cost (product + install)",
  "기존 조명 교체주기": "Existing light replacement cycle",
  "년": "yrs",
  "제안사 투자비 (제품·시설)": "Proposer's investment (product · install)",
  "건물주 추가투자비용 절감액": "Owner's avoided replacement cost",
  "환산 계수": "Conversion factors",
  "전력 배출계수": "Grid emission factor",
  "소나무 흡수량(1그루)": "Pine tree absorption (per tree)",
  "kg/년": "kg/yr",
  "소나무 숲 1ha 흡수량": "Pine forest absorption (per ha)",
  "t/년": "t/yr",
  "고급 설정 기본값으로": "Reset advanced settings",
  "에너지 절감율": "Energy savings rate",
  "절감율": "Savings rate",
  "계약기간": "Contract term",
  "예상 절감 효과": "Expected savings",
  "1년차 · 10년 누적": "Year 1 · 10-year total",
  "아파트 10년 누적 순수익 (예측)": "Apartment 10-year net benefit (forecast)",
  "항목": "Item",
  "1년차": "Year 1",
  "10년 누적": "10-year total",
  "전력 절감량": "Electricity saved",
  "에너지": "Energy",
  "전기요금 절감액": "Bill savings",
  "요금 상승 반영": "Incl. price increase",
  "아파트 배분수익": "Apartment share",
  "성과공유": "Profit sharing",
  "CO₂ 감축량": "CO₂ reduction",
  "탄소배출": "Emissions",
  "소나무 환산": "Pine tree equivalent",
  "30년생 소나무": "30-year-old pines",
  "년차별 아파트 수익": "Apartment income by year",
  "단위: 만원": "Unit: ₩10,000",
  "1~10년차 아파트 배분수익 막대그래프": "Bar chart of apartment income, years 1–10",
  "성과공유 비율": "Profit-sharing ratios",
  "년차별 아파트 몫 (기본값 = INPUT_DATA 엑셀 · 1~3년 20% / 4~5년 30% / 6~7년 40% / 8~10년 100%)": "Apartment share by year (defaults = INPUT_DATA Excel · yrs 1–3 20% / 4–5 30% / 6–7 40% / 8–10 100%)",
  "년차": "Year",
  "아파트 비율": "Apartment %",
  "아파트 수익": "Apartment income",
  "제안사 수익": "Proposer income",
  "아파트 누적": "Apartment cumulative",
  "합계": "Total",
  "산출 기준": "Basis",
  "Saving Ratio = (M-Carbon 등 효율 ÷ 현재 등 효율) − 1 + Smart IoT 추가 절감율 · 연간 절감 요금 = 현재 연간 전기요금 × Saving Ratio (INPUT_DATA 엑셀과 동일한 식)": "Saving Ratio = (M-Carbon efficiency ÷ current efficiency) − 1 + Smart IoT extra savings · Annual bill savings = current annual bill × Saving Ratio (same formula as the INPUT_DATA Excel)",
  "2년차부터 전기요금이 매년 입력한 상승률만큼 오른다고 보고 계산하며, 년차별 절감액에 아파트 비율을 곱해 아파트 수익을 구합니다.": "From year 2 the electricity price rises by the yearly increase you enter; apartment income = each year's savings × the apartment's share.",
  "건물주 추가투자비용 절감액 = LED 평균단가 × 교체횟수(8년 ÷ 교체주기, 소수점 버림) × 등수. 아파트 10년 누적 순수익에 합산됩니다.": "Owner's avoided replacement cost = average LED unit cost × replacements (8 yrs ÷ cycle, rounded down) × fixtures; added to the apartment's 10-year net benefit.",
  "CO₂ = 연간 절감 전력 × 배출계수 · 소나무 = CO₂ ÷ 1그루 연간 흡수량 · 숲 면적 = CO₂ ÷ 1ha 흡수량 (1ha ≈ 축구장 1.3개)": "CO₂ = annual electricity saved × emission factor · Pine trees = CO₂ ÷ absorption per tree · Forest area = CO₂ ÷ absorption per ha (1 ha ≈ 1.3 football fields)",
  "저장된 제안서를 열어 수정하거나 파일을 다시 받을 수 있습니다": "Open a saved proposal to edit it or download its files again",
  "단지명 검색": "Search by complex name",
  "전체 직원 제안서 보기": "Show all staff proposals",
  "단지명": "Complex",
  "아파트 10년 순수익": "Apt. 10-yr net benefit",
  "CO₂/년": "CO₂/yr",
  "수정일": "Updated",
  "작업": "Actions",
  "아직 저장된 제안서가 없습니다.": "No saved proposals yet.",
  "가입한 직원을 승인하거나 사용을 중지합니다": "Approve new staff or turn off access",
  "상태": "Status",
  "권한": "Role",
  "제안서 수": "Proposals",
  "가입일": "Joined",
  "도시의 빛을 바꾸면,": "Change the city's light,",
  "탄소": "carbon",
  "가 줄어듭니다": " goes down",
  "아파트 · 상업용 건물 LED ESCO 탄소절감 플랫폼": "LED ESCO carbon-reduction platform for apartments and commercial buildings",
  // 원본 산출서 레이아웃
  "고효율 LED 교체": "High-efficiency LED",
  "절감효과": "Savings",
  "산출서": "Report",
  "지하주차장 · 공동주택 공용부 조명 에너지 절감 시뮬레이션": "Lighting energy-savings simulation for underground parking and apartment common areas",
  "예상절감률": "Savings",
  "1년 · 10년 누적": "1 year · 10-year total",
  "전력 절감": "Power saved",
  "고효율 LED": "High-efficiency LED",
  "1년": "1 year",
  "비용": "Cost",
  "탄소배출 감소량": "CO₂ reduction",
  "CO₂ 환산": "CO₂ equivalent",
  "나무 심기 효과": "Tree-planting effect",
  "연도별 누적 절감액": "Cumulative savings by year",
  "단위: 백만원": "Unit: ₩1M",
  "1~10년 누적 전기요금 절감액 막대그래프": "Bar chart of cumulative bill savings, years 1–10",
  "기존": "Before",
  "기존 등기구 기준": "With existing fixtures",
  "제안서(엑셀·PPT) 설정": "Proposal (Excel · PowerPoint) settings",
  "파일에만 쓰이는 값 · 기본값 = INPUT_DATA 엑셀": "Values used only in the files · defaults = INPUT_DATA Excel",
  "아파트 10년 누적 순수익 (제안서 기준)": "Apartment 10-year net benefit (proposal basis)",
  "에너지 Saving Ratio (엑셀 수식)": "Energy Saving Ratio (Excel formula)",
  "연간 절감 전력 (제안서)": "Annual electricity saved (proposal)",
  "Saving Ratio가 100%를 넘습니다. 실제 사용량보다 많이 절감되는 것으로 계산되니 광효율·Smart IoT 값을 확인하세요.": "The Saving Ratio is over 100%, which means saving more than the building uses. Check the light efficiency and Smart IoT values.",
  "제안서 표지": "Proposal cover",
  "PPT 환산 계수": "PowerPoint conversion factors",
  "전력 배출계수 (PPT)": "Grid emission factor (PPT)",
  "제안서 설정 기본값으로": "Reset proposal settings",
  "M-Carbon Solutions 제품 특징": "M-Carbon Solutions features",
  "지능형 기술": "Intelligent technology",
  "(AI & IoT 디밍)": "(AI & IoT dimming)",
  "AI 딥러닝 기반": "AI deep-learning",
  "맞춤형 조도 조절": "adaptive brightness",
  "사람과 차량의 움직임을 스스로 감지하여 실시간으로 밝기를 최적화합니다.": "Detects people and vehicles on its own and optimizes brightness in real time.",
  "70% 이상의": "70%+ extra",
  "추가 에너지 절감": "energy savings",
  "스마트 연동 기술로 기존 조명 대비 불필요한 전력 소모를 완벽히 차단합니다.": "Smart control cuts out unnecessary power use compared with conventional lighting.",
  "IoT 실시간": "Real-time IoT",
  "통합 모니터링": "monitoring",
  "모바일 앱으로 언제 어디서나 전력 절감액과 장비 상태를 투명하게 확인합니다.": "Check savings and equipment status anytime in the mobile app.",
  "AI 칩과 상승 화살표 아이콘": "AI chip with rising arrow icon",
  "70% 배터리와 하강 화살표 아이콘": "70% battery with falling arrow icon",
  "모바일 모니터링 앱 아이콘": "Mobile monitoring app icon",
  "AI·IoT 센서로 차량과 보행자를 감지해 조명을 제어하는 지하주차장 일러스트": "Illustration of AI/IoT sensors detecting cars and people to control parking-garage lighting",
  "산출 기준 및 안내": "Basis and notes",
  "입력한 소비전력 · 수량 · 점등시간 · 전력단가를 기준으로 한 예상치이며, 10년 누적은 요금 인상·광속 저하를 반영하지 않은 단순 합산입니다.": "Estimates are based on the power, quantity, hours and electricity price entered; the 10-year total is a simple sum without price increases or lumen depreciation.",
  "탄소배출 감소량 = 절감 전력량 × 국가 전력 배출계수 0.4173 kgCO₂/kWh (2023년도 계수, 국가온실가스통계관리위원회 2025.12 확정). 나무 환산 = 연간 CO₂ 감축량 ÷ 30년생 소나무 1그루 연간 흡수량 6.6 kgCO₂ (산림청 기준)입니다.": "CO₂ reduction = electricity saved × national grid emission factor 0.4173 kgCO₂/kWh (2023 factor, confirmed Dec 2025). Tree equivalent = annual CO₂ reduction ÷ 6.6 kgCO₂ absorbed per 30-year-old pine per year (Korea Forest Service).",
  "실제 절감액은 점등 패턴, 디밍 제어, 요금 적용 항목, 현장 운영조건에 따라 달라지며, 정확한 금액은 현장 실측 및 전기요금 고지서 확인 후 확정합니다.": "Actual savings vary with lighting patterns, dimming, tariff items and site conditions; final amounts are confirmed after on-site measurement and a review of the electricity bill.",
  "엑셀·PPT 파일은 INPUT_DATA 엑셀 수식과 원본 제안서 양식으로 만들어지며, 화면의 산출 결과와 계산 방식이 다를 수 있습니다 (위 ‘제안서(엑셀·PPT) 설정’에서 확인).": "The Excel and PowerPoint files use the INPUT_DATA Excel formulas and the original proposal template, so they may differ from the results on this screen (see ‘Proposal settings’ above).",
  "엑셀·PPT 파일을 만들려면 모두 입력하세요": "Fill in all of these to create the Excel and PowerPoint files",
  "기본값으로 저장": "Save as defaults",
  "저장된 기본값 불러오기": "Load saved defaults",
  "INPUT_DATA 원래 값으로": "Reset to INPUT_DATA values",
  "제안서(엑셀·PPT) 기준 Saving Ratio가 100%를 넘습니다. 파일을 만들기 전에 관리자에게 확인하세요.": "The proposal (Excel · PowerPoint) Saving Ratio is over 100%. Check with your administrator before creating files.",
  "이 계정은 사용 권한이 없습니다. 등록된 마케팅 계정으로 로그인하세요.": "This account doesn't have access. Please log in with the registered marketing account.",
  "접근 권한 없음": "No access",
  "단지명 미입력": "No complex name yet",
  "빈 칸을 모두 채워주세요.": "Please fill in all the empty boxes.",
  "제안서(엑셀·PPT) 결과": "Proposal (Excel · PowerPoint) results",
  "INPUT_DATA 엑셀 수식과 고정값으로 자동 계산 · 입력 없음": "Calculated automatically from the INPUT_DATA Excel formulas and fixed values · no input needed",
  "엑셀 고정값: Smart IoT 추가 절감 25% · 전기요금 연 5% 상승 · 연간 운전일수 365일 · 추가시설비 25,000원 · 회수 계수 2 · LED 평균단가 30,000원 · 교체주기 3년 · 배출계수 0.4781 tCO₂eq/MWh": "Fixed Excel values: Smart IoT savings 25% · electricity price +5%/yr · 365 operating days · installation ₩25,000 · recovery factor 2 · LED unit cost ₩30,000 · replacement cycle 3 yrs · emission factor 0.4781 tCO₂eq/MWh",
  "성과공유 비율 (고정)": "Profit-sharing ratios (fixed)",
  "M-Carbon 등기구": "M-Carbon fixtures",
  "사용자 추가": "Add user",
  "임시 비밀번호": "Temporary password",
  "자동 생성": "Generate",
  "서버에 FIREBASE_SERVICE_ACCOUNT 설정이 없어 사용자를 추가할 수 없습니다. (README 참고)": "The server has no FIREBASE_SERVICE_ACCOUNT setting, so users can't be added. (See README.)",
  "비밀번호는 6자 이상이어야 합니다.": "Passwords need at least 6 characters.",
  // 안내·오류 문구
  "요청에 실패했습니다": "Request failed",
  "이메일 형식이 올바르지 않습니다.": "The email address is not valid.",
  "이메일 또는 비밀번호가 올바르지 않습니다.": "Incorrect email or password.",
  "이미 가입된 이메일입니다. 로그인하거나 비밀번호를 재설정하세요.": "This email is already registered. Log in or reset your password.",
  "비밀번호가 너무 약합니다.": "The password is too weak.",
  "시도가 너무 많습니다. 잠시 후 다시 시도하세요.": "Too many attempts. Please try again later.",
  "네트워크 오류입니다. 인터넷 연결을 확인하세요.": "Network error. Check your internet connection.",
  "사용이 중지된 계정입니다. 관리자에게 문의하세요.": "This account has been turned off. Contact your administrator.",
  "알 수 없는 오류가 발생했습니다.": "An unknown error occurred.",
  "비밀번호 찾기": "Reset password",
  "승인 대기": "Awaiting approval",
  "이메일을 정확히 입력하세요.": "Enter a valid email address.",
  "비밀번호를 입력하세요.": "Enter your password.",
  "이름을 입력하세요.": "Enter your name.",
  "허용된 회사 이메일로만 가입할 수 있습니다.": "Only approved company email addresses can sign up.",
  "비밀번호는 8자 이상이며 영문과 숫자를 모두 포함해야 합니다.": "Passwords need at least 8 characters, including letters and numbers.",
  "새 비밀번호는 8자 이상이며 영문과 숫자를 모두 포함해야 합니다.": "New passwords need at least 8 characters, including letters and numbers.",
  "비밀번호 확인이 일치하지 않습니다.": "The passwords don't match.",
  "개발 모드에서는 비밀번호가 없습니다.": "There are no passwords in development mode.",
  "입력한 이메일로 비밀번호 재설정 링크를 보냈습니다. 메일함(스팸함 포함)을 확인하세요.": "We sent a password reset link to that email. Check your inbox (and spam folder).",
  "인증 메일을 다시 보냈습니다.": "Verification email sent again.",
  "아직 승인 대기 중입니다.": "Still waiting for approval.",
  "새 제안서 (저장 전)": "New proposal (not saved)",
  "완료되었습니다.": "Done.",
  "저장 중…": "Saving…",
  "저장했습니다.": "Saved.",
  "엑셀 파일을 만드는 중…": "Creating the Excel file…",
  "저장 후 엑셀 파일을 받았습니다.": "Saved and downloaded the Excel file.",
  "PPT 파일을 만드는 중… (10초 정도 걸릴 수 있습니다)": "Creating the PowerPoint… (this can take about 10 seconds)",
  "저장 후 PPT 파일을 받았습니다.": "Saved and downloaded the PowerPoint.",
  "저장하지 않은 내용이 있습니다. 새 제안서를 시작할까요?": "You have unsaved changes. Start a new proposal anyway?",
  "저장하지 않은 내용이 있습니다. 다른 제안서를 열까요?": "You have unsaved changes. Open another proposal anyway?",
  "이 제안서를 삭제할까요? 되돌릴 수 없습니다.": "Delete this proposal? This can't be undone.",
  "열기": "Open",
  "삭제": "Delete",
  "사용 중": "Active",
  "중지됨": "Turned off",
  "승인": "Approve",
  "다시 사용": "Turn on",
  "거절": "Reject",
  "사용 중지": "Turn off",
  "관리자 해제": "Remove admin",
  "관리자 지정": "Make admin",
  "직원": "Staff",
  "본인": "You",
  "그루": "trees",
  "개발 모드: 아무 이메일로나 로그인됩니다 (테스트 전용).": "Development mode: any email can log in (testing only).",
  "서버에 FIREBASE_WEB_CONFIG 설정이 없습니다. 관리자에게 문의하세요.": "The server has no FIREBASE_WEB_CONFIG setting. Contact your administrator.",
  "로그인 모듈을 불러오지 못했습니다. 인터넷 연결을 확인하세요.": "Couldn't load the login module. Check your internet connection.",
  // 서버 메시지
  "로그인이 필요합니다.": "Please log in.",
  "로그인이 만료되었습니다. 다시 로그인하세요.": "Your login has expired. Please log in again.",
  "이메일 계정으로 로그인하세요.": "Please log in with an email account.",
  "허용된 회사 이메일만 사용할 수 있습니다.": "Only approved company email addresses can be used.",
  "관리자 승인 후 사용할 수 있습니다.": "You can use the service after administrator approval.",
  "관리자만 사용할 수 있습니다.": "Administrators only.",
  "제안서를 찾을 수 없습니다.": "Proposal not found.",
  "본인 계정은 변경할 수 없습니다.": "You can't change your own account.",
  "서버 오류가 발생했습니다. 잠시 후 다시 시도하세요.": "A server error occurred. Please try again shortly.",
};
for (let i = 1; i <= 10; i++) { EN[i + "년차"] = "Year " + i; EN[i + "년차 아파트 비율"] = "Year " + i + " apartment %"; EN[i + "년"] = "Y" + i; }
const ATTRS = ["placeholder", "aria-label", "title", "alt"];

let lang = "ko";
try { lang = localStorage.getItem("mc_lang") || ""; } catch (e) {}
if (lang !== "ko" && lang !== "en") lang = /^ko/i.test(navigator.language || "") ? "ko" : "en";

const done = new Map();      // text node -> original text
const doneAttr = new Map();  // element -> {attr: original}
let busy = false;

const key = (s) => s.replace(/\s+/g, " ").trim();
function trNode(n) {
  if (n.nodeType !== 3) return;
  const p = n.parentNode;
  if (!p || /^(SCRIPT|STYLE|TEXTAREA|OPTION)$/.test(p.nodeName) || p.closest("[data-noi18n]")) return;
  const k = key(n.nodeValue);
  if (!k || !(k in EN)) return;
  if (!done.has(n)) done.set(n, n.nodeValue);
  const lead = n.nodeValue.match(/^\s*/)[0], trail = n.nodeValue.match(/\s*$/)[0];
  n.nodeValue = lead + EN[k] + trail;
}
function trAttrs(el) {
  for (const a of ATTRS) {
    const v = el.getAttribute && el.getAttribute(a);
    if (v && key(v) in EN) {
      const m = doneAttr.get(el) || {}; if (!(a in m)) m[a] = v; doneAttr.set(el, m);
      el.setAttribute(a, EN[key(v)]);
    }
  }
}
function walk(root) {
  if (root.nodeType === 3) return trNode(root);
  if (root.nodeType !== 1) return;
  trAttrs(root);
  root.querySelectorAll("*").forEach(trAttrs);
  const tw = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let n; while ((n = tw.nextNode())) trNode(n);
}
function restore() {
  done.forEach((orig, n) => { if (n.isConnected) n.nodeValue = orig; });
  doneAttr.forEach((m, el) => { for (const a in m) el.setAttribute(a, m[a]); });
  done.clear(); doneAttr.clear();
}
const obs = new MutationObserver((list) => {
  if (busy || lang !== "en") return;
  busy = true;
  for (const m of list) {
    if (m.type === "childList") m.addedNodes.forEach(walk);
    else if (m.type === "characterData") { done.delete(m.target); trNode(m.target); }
    else if (m.type === "attributes") trAttrs(m.target);
  }
  obs.takeRecords(); // 방금 번역하며 생긴 변경은 무시
  busy = false;
});

function setLang(l) {
  lang = l === "en" ? "en" : "ko";
  try { localStorage.setItem("mc_lang", lang); } catch (e) {}
  document.documentElement.lang = lang;
  busy = true;
  obs.takeRecords();
  if (lang === "en") walk(document.body); else restore();
  obs.takeRecords();
  busy = false;
  document.querySelectorAll(".langsw button").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.l === lang)));
  document.title = lang === "en" ? "LED Proposal Generator" : "LED 제안서 자동 생성기";
  window.dispatchEvent(new CustomEvent("langchange", { detail: lang }));
}

window.I18N = { get lang() { return lang; }, t: (ko, en) => (lang === "en" ? en : ko), tr: (s) => (lang === "en" && key(String(s)) in EN ? EN[key(String(s))] : s), setLang };

function init() {
  const sw = document.createElement("div");
  sw.className = "langsw"; sw.setAttribute("data-noi18n", ""); sw.setAttribute("role", "group"); sw.setAttribute("aria-label", "Language / 언어");
  sw.innerHTML = '<button type="button" data-l="ko">한국어</button><button type="button" data-l="en">English</button>';
  sw.addEventListener("click", (e) => { const b = e.target.closest("button"); if (b && b.dataset.l !== lang) setLang(b.dataset.l); });
  document.body.prepend(sw);
  obs.observe(document.body, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ATTRS });
  setLang(lang);
}
if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})();

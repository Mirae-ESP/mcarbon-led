# M-Carbon 스마트 LED 제안서 자동 생성기 (서버 버전)

현장 데이터를 입력하면 **절감 산출 엑셀**과 **도입 제안 PPT(12장)** 를 서버에서 만들어 내려받는 사내용 웹 서비스입니다.

- 로그인 / 회원가입 / 비밀번호 찾기 (Firebase Authentication)
- 관리자 승인제: 가입한 직원은 관리자가 승인해야 사용 가능
- 제안서 저장·목록·검색·다시 열기·삭제, 파일 다운로드 기록
- 슬라이드 원본 이미지와 계산 파일 생성은 서버에서만 처리 (외부에 공개되지 않음)
- Railway, 회사 서버, AWS·GCP 등 Docker가 되는 곳이면 어디서나 실행

---

## 1. Firebase 준비 (로그인용, 무료)

1. https://console.firebase.google.com → **프로젝트 추가**
2. **Authentication → 시작하기 → 로그인 방법 → 이메일/비밀번호** 사용 설정
3. **프로젝트 설정(톱니바퀴) → 일반 → 내 앱 → 웹(</>) 앱 추가**
   - 표시되는 `firebaseConfig` 값을 복사해 둡니다 (apiKey, authDomain, projectId, appId)
4. (선택) **Authentication → 템플릿** 에서 비밀번호 재설정·인증 메일 언어를 한국어로 설정
5. 서버 주소가 정해지면 **Authentication → 설정 → 승인된 도메인** 에 추가
   (예: `led-proposal.up.railway.app`, 회사 도메인)

> `apiKey` 는 비밀번호가 아니라 공개용 식별값이라 웹페이지에 노출되어도 괜찮습니다.

## 2. Railway에 배포

1. 이 폴더를 GitHub 저장소에 올립니다.
2. https://railway.app → **New Project → Deploy from GitHub repo** → 저장소 선택
   (Dockerfile을 자동으로 인식합니다)
3. 같은 프로젝트에서 **+ New → Database → PostgreSQL** 추가
4. 앱 서비스의 **Variables** 에 아래 값 입력

   | 이름 | 값 |
   |---|---|
   | `DATABASE_URL` | `${{Postgres.DATABASE_URL}}` |
   | `FIREBASE_PROJECT_ID` | Firebase 프로젝트 ID |
   | `FIREBASE_WEB_CONFIG` | firebaseConfig를 한 줄 JSON으로 `{"apiKey":"…","authDomain":"…","projectId":"…","appId":"…"}` |
   | `ADMIN_EMAILS` | 관리자 이메일 (쉼표로 여러 명) |
   | `ALLOWED_DOMAINS` | (선택) 예: `mirae-esp.com` — 회사 메일만 허용 |
   | `AUTO_APPROVE_DOMAINS` | (선택) 예: `mirae-esp.com` — 이메일 인증한 회사 직원은 승인 없이 사용 |

5. **Settings → Networking → Generate Domain** 으로 주소 발급 → Firebase 승인된 도메인에 추가
6. **Settings → Deploy → Healthcheck Path** 를 `/healthz` 로 설정 (권장)

## 3. 처음 사용하기

1. `ADMIN_EMAILS` 에 넣은 이메일로 **회원가입**
2. 받은 **인증 메일의 링크**를 누른 뒤 화면에서 **상태 새로고침** → 관리자 권한으로 시작
3. 직원이 가입하면 **사용자 관리** 탭에 "승인 대기"로 표시 → **승인** 클릭

## 4. 회사 서버 / 다른 클라우드에서 실행

Docker가 설치된 서버에서:

```bash
cp .env.example .env      # 값 채우기 (DATABASE_URL은 docker-compose가 자동 설정)
docker compose up -d      # 앱 + PostgreSQL 함께 실행 → http://서버주소:3000
```

AWS(ECS/Lightsail), Google Cloud Run, Azure 등에서는 `Dockerfile` 로 이미지를 만들고
위 환경변수와 PostgreSQL만 연결하면 됩니다. 실제 운영 시에는 HTTPS(도메인 + 인증서)를 꼭 사용하세요.

## 5. 내 컴퓨터에서 테스트

```bash
npm install
DATABASE_URL=postgres://… ADMIN_EMAILS=admin@test.com npm run dev
```

`npm run dev` 는 **개발 모드**(비밀번호 없이 아무 이메일로 로그인)입니다. 테스트에만 쓰세요.
`NODE_ENV=production` 에서는 개발 모드가 실행되지 않도록 막혀 있습니다.

---

## 폴더 구조

```
server/
  index.js      API 서버 (제안서 저장·목록·파일 생성·관리자)
  auth.js       Firebase 로그인 토큰 확인, 승인/권한 처리
  db.js         PostgreSQL 연결, 테이블 자동 생성
  excel.js      절감 산출 엑셀 생성 (INPUT_DATA.xlsx 와 같은 배치, 수식 포함)
  pptx.js       제안서 PPT 생성 (12장)
  assets/slides 슬라이드 배경 이미지 (외부 비공개)
public/
  index.html, style.css, app.js   화면
  calc.js       계산식 (화면 미리보기와 서버가 같은 파일 사용)
```

## 계산식 바꾸기

계산은 `public/calc.js` 의 `compute()` 한 곳에만 있습니다. 여기를 고치면 화면·PPT가 같이 바뀌고,
엑셀 수식은 `server/excel.js` 에서 같은 식으로 맞춰 주면 됩니다.

> 참고: 현재 Saving Ratio 식 `(M-Carbon 효율 ÷ 현재 효율) − 1 + IoT 절감율` 은 INPUT_DATA 엑셀을 그대로 따른 것입니다.
> 같은 밝기 기준 실제 전력 절감율은 `1 − 현재 효율 ÷ M-Carbon 효율` (120→180 lm/W 이면 33%)이므로 검토를 권장합니다.

## API 요약

| 메서드 | 경로 | 설명 |
|---|---|---|
| GET | `/healthz` | 서버·DB 상태 |
| GET | `/api/me` | 내 정보 (승인 상태) |
| GET/POST | `/api/proposals` | 목록(`?q=검색`, 관리자 `?all=1`) / 새로 저장 |
| GET/PUT/DELETE | `/api/proposals/:id` | 조회 / 수정 / 삭제 |
| GET | `/api/proposals/:id/excel` · `/pptx` | 파일 다운로드 |
| GET | `/api/admin/users` | 사용자 목록 (관리자) |
| PATCH | `/api/admin/users/:uid` | `{status: active|disabled}`, `{role: admin|user}` |

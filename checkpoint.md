# Checkpoint — AI Company Chat
> Architect review · 2026-09-30 · agent:architect

---

## 1. 프로젝트 현황

### 배포 대상
- **URL**: https://chat.steady2vivid.kro.kr
- **Stack**: Next.js 16 (App Router) + 커스텀 Node.js 서버 + WebSocket 프록시
- **Process manager**: macOS LaunchAgent (`com.ai-company-chat`)
- **Reverse proxy**: Caddy (`deploy/chat.steady2vivid.kro.kr.caddy`)
- **Port**: 앱 3012 → Caddy → HTTPS

### 아키텍처 요약
```
브라우저 ──WS──▶ /api/gateway/ws
                    │
              gateway-proxy.js   ← 인증·Rate limit·Frame size 검사
                    │
              OpenClaw Gateway   (ws://localhost:<port>)
                    │
              CEO / Architect / Developer / Reviewer 에이전트
```

- `server/index.js` — Next.js prepare + HTTP(S) 서버 생성, WebSocket 업그레이드 라우팅
- `server/gateway-proxy.js` — 브라우저 ↔ OpenClaw Gateway 양방향 WS 프록시; 토큰 인젝션, rate limit (60 fps burst 120), 최대 프레임 256 KB
- `server/access-gate.js` — `STUDIO_ACCESS_TOKEN` 쿠키 기반 HTTP/WS 접근 제어, IP rate limit (10회/분)
- `server/network-policy.js` — 퍼블릭 호스트 바인딩 시 토큰 강제
- `server/studio-settings.js` — `~/.openclaw/claw3d/settings.json` 또는 `openclaw.json`에서 Gateway URL·토큰 로드
- `app/page.tsx` — CEO 세션 history를 읽기 전용 WebSocket으로 표시하고, 쓰기는 서버 API로 전달
- `app/api/company/send/route.ts` — 서버에서 로컬 `openclaw agent --agent ceo` 실행
- `app/api/company/approve/route.ts` — 승인 요청을 같은 CEO 세션으로 전달

### 현재 구현된 기능
| 기능 | 상태 |
|---|---|
| CEO 세션 대화 (WebSocket) | ✅ 구현됨 |
| Gateway history 로드 (80개) | ✅ 구현됨 |
| Approval brief UI + 승인 버튼 | ✅ 구현됨 |
| CEO 작업 요청/승인 | ✅ 서버 측 OpenClaw CLI로 전달 |
| 모바일 반응형 레이아웃 | ✅ (640px 이하 mobileNav) |
| 사이드바 (프로젝트·세션·에이전트) | ✅ 정적 UI (하드코딩) |
| Inspector 패널 (Agent pipeline, Activity, Artifacts) | ✅ 정적 UI |

---

## 2. 현재 요구사항 vs 구현 갭

### 운영상 확정된 흐름

브라우저는 Gateway에 읽기 전용으로 연결되고, 메시지 전송과 승인은 서버의 `/api/company/*`가 M1의 로컬 OpenClaw CLI를 호출한다. 따라서 브라우저에 Gateway write token을 넣지 않으며, M1만 실제 실행 주체다. M4는 런타임을 실행하지 않고 백업/복구용으로 유지한다.

실서비스는 `LaunchAgent com.ai-company-chat → 127.0.0.1:3012 → Caddy → https://chat.steady2vivid.kro.kr` 경로로 동작한다.

### 미구현 / 불완전 항목

#### [GAP-1] 과거 PM2 메모
```js
// 현재 (잘못됨)
script: "node_modules/next/dist/bin/next",
args: "start -p 3012",
```
`npm run start`는 `node server/index.js`를 실행하지만 PM2 설정은 Next.js binary를 직접 호출함.  
이 항목은 M1 LaunchAgent 설정으로 해결되었고, 아래 구현 목록은 과거 작업 지시로 보존한다.

#### [GAP-2] 과거 Caddy 메모
`gateway-proxy.js:isUpstreamAllowed()`는 production + 빈 allowlist → 연결 거부 + 경고만 출력.  
현재 M1 LaunchAgent에 `UPSTREAM_ALLOWLIST=127.0.0.1,localhost`가 설정되어 있다.

#### [GAP-3]~[GAP-8] 과거 구현 메모
```tsx
useEffect(() => { ... }, [sessionKey]);  // sessionKey가 바뀔 때 소켓 재생성
```
`agents.list` 응답으로 `sessionKey`가 업데이트되면 소켓이 닫히고 새로 열림.  
→ 연결 중 history 응답이 유실될 수 있음.

#### [GAP-4] `chat` 이벤트 sessionKey 비교 — 소켓 재연결 전 구 sessionKey로 필터링
```tsx
frame.payload?.sessionKey === sessionKey
```
클로저 캡처 문제. sessionKey ref로 교체해야 함.

#### [GAP-5] textarea Enter 키 핸들러 누락
`Shift + Enter` = 줄바꿈이라고 UI에 표시되어 있지만, `<textarea>` onKeyDown 핸들러가 없어서 Enter 키로 제출이 안 됨 (form의 submit은 버튼에만 연결).

#### [GAP-6] 히스토리 메시지 이름 하드코딩
```tsx
name: role === "user" ? "You" : "CEO"
```
Architect/Developer/Reviewer 세션으로 전환 시 항상 "CEO"로 표시됨.

#### [GAP-7] `app/company/` 디렉토리가 비어 있음 (라우팅 계획만 있음)
`app/company/` 경로로 이동하는 UI 요소가 없고 해당 페이지 파일도 없음.

#### [GAP-8] 공유(Share) 기능 없음
요구사항(모바일 공유 중심)에 핵심 기능인 결과 공유 흐름이 전혀 없음.

---

## 3. Developer 구현 작업 목록

### 과거 Developer 구현 목록

#### TASK-1: PM2 ecosystem 수정
**파일**: `deploy/ecosystem.config.cjs`  
**변경**:
```js
// Before
script: "node_modules/next/dist/bin/next",
args: "start -p 3012",

// After
script: "server/index.js",
interpreter: "node",
args: "",
env: {
  NODE_ENV: "production",
  PORT: "3012",
  HOST: "127.0.0.1",
  UPSTREAM_ALLOWLIST: "localhost",   // 또는 실제 gateway hostname
},
```
**검증**: `pm2 start deploy/ecosystem.config.cjs` 후 `curl -s http://localhost:3012` 응답, `curl --include --no-buffer -H "Connection: Upgrade" -H "Upgrade: websocket" http://localhost:3012/api/gateway/ws` 101 반환 확인.

#### TASK-2: `UPSTREAM_ALLOWLIST` 환경변수 문서화 및 기본값 처리
**파일**: `server/gateway-proxy.js` 상단 주석 + `deploy/ecosystem.config.cjs`  
production에서 allowlist가 비어 있으면 서버 시작 시 명시적 오류로 종료하거나, README에 필수 환경변수로 기재.

---

### 🟠 P1 — 기능 버그 (UX 깨짐)

#### TASK-3: WebSocket sessionKey 의존성 수정
**파일**: `app/page.tsx`  
`useEffect` deps에서 `sessionKey` 제거. 대신 `sessionKeyRef`를 사용해 최신값 추적.
```tsx
const sessionKeyRef = useRef("agent:ceo:company-survival-test");
// setter 시 ref도 동시 업데이트
const updateSessionKey = (key: string) => {
  sessionKeyRef.current = key;
  setSessionKey(key);
};
// useEffect deps: [] (마운트 once)
// chat 이벤트 비교: frame.payload?.sessionKey === sessionKeyRef.current
```
**검증**: 브라우저 Network 탭에서 WS 연결이 1회만 열리는지 확인.

#### TASK-4: Enter키 제출 핸들러 추가
**파일**: `app/page.tsx`  
```tsx
<textarea
  onKeyDown={(e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit(e as unknown as FormEvent);
    }
  }}
  ...
/>
```
**검증**: Enter → 메시지 전송, Shift+Enter → 줄바꿈.

#### TASK-5: 히스토리 발신자 이름 동적 처리
**파일**: `app/page.tsx`  
`name: role === "user" ? "You" : "CEO"` → sessionKey에서 에이전트 이름 추출.
```ts
const agentName = sessionKey.split(":")[1]?.replace(/^\w/, c => c.toUpperCase()) ?? "Agent";
name: role === "assistant" ? agentName : "You"
```

---

### 🟡 P2 — 요구사항 기능 (회사 생존 테스트 핵심)

#### TASK-6: 회사 생존 테스트 퀴즈 페이지 구현
**파일**: `app/company/quiz/page.tsx` (신규)  
- 6문항, 각 문항 4개 선택지
- 문항 데이터는 `app/company/quiz/questions.ts`에 분리 정의
- 선택 시 자동 다음 문항
- 진행 표시줄 (1/6 … 6/6)
- 결과는 4가지 유형 중 하나로 분기

**데이터 계약** (`questions.ts`):
```ts
export type Choice = { id: string; label: string; weight: Record<ResultType, number> };
export type Question = { id: string; text: string; choices: Choice[] };
export type ResultType = "pioneer" | "optimizer" | "connector" | "guardian";
export const QUESTIONS: Question[] = [ /* 6개 */ ];
export const RESULTS: Record<ResultType, { title: string; desc: string; emoji: string }> = { ... };
```

**검증**: 6문항 모두 선택 시 결과 페이지로 이동.

#### TASK-7: 결과 + 공유 페이지 구현
**파일**: `app/company/result/page.tsx` (신규)  
- URL 파라미터로 결과 유형 전달: `?type=pioneer`
- 결과 카드 (유형명, 설명, 이모지)
- **공유 버튼**: `navigator.share()` (모바일 native share sheet) → fallback `navigator.clipboard.writeText(window.location.href)`
- 재시도 버튼 → `/company/quiz`로

**검증**: 모바일 Chrome에서 공유 버튼 → OS 공유시트 표시.

#### TASK-8: 랜딩 페이지 → 퀴즈 진입 연결
**파일**: `app/page.tsx`  
사이드바 "오늘의 회사 생존 테스트" NavItem에 `/company/quiz` 링크 추가.  
또는 별도 랜딩: `app/company/page.tsx` (시작 버튼 → `/company/quiz`).

---

## 4. 검증 기준 (Reviewer handoff)

Reviewer는 아래 기준으로 Developer 산출물을 검증한다.

| # | 검증 항목 | 방법 |
|---|---|---|
| V-1 | `/api/gateway/ws` 101 Switching Protocols 반환 | `curl` 또는 브라우저 Network 탭 |
| V-2 | CEO 세션 기존 history 로드 | 페이지 새로고침 후 이전 메시지 표시 |
| V-3 | 메시지 전송 및 CEO 응답 수신 | `/api/company/send` 성공 후 CEO 세션 history에 반영 |
| V-4 | WS 연결이 페이지 생명주기 동안 1회만 열림 | Network 탭 WS row 개수 확인 |
| V-5 | Enter 제출, Shift+Enter 줄바꿈 | 직접 입력 테스트 |
| V-6 | 퀴즈 6문항 완주 → 결과 유형 표시 | 전체 선택 흐름 |
| V-7 | 모바일(375px)에서 공유 버튼 → 공유시트 | DevTools mobile emulation 또는 실기기 |
| V-8 | `npm run build` 오류 없음 | CI 또는 로컬 빌드 로그 |
| V-9 | LaunchAgent 기동 후 `/` 200 반환 | M1 서비스와 외부 HTTPS에서 확인 |

## 5. 2026-09-30 운영 검증

- `npm run build`: 통과
- `https://chat.steady2vivid.kro.kr/company`: 200
- `https://chat.steady2vivid.kro.kr/company/quiz`: 200
- `https://chat.steady2vivid.kro.kr/company/result?type=pioneer`: 200
- 잘못된 `/api/company/send`: 400 validation 응답
- 유효한 `/api/company/send`: 200 accepted, M1 CEO 세션 갱신 확인
- Gateway token은 브라우저에 노출하지 않고 M1 서버/CLI에서만 사용

---

## 5. 위험 요소

| 위험 | 설명 | 대응 |
|---|---|---|
| Gateway 토큰 없음 | `studio-settings.js`가 `openclaw.json` 또는 `.claw3d/settings.json`에서 토큰 로드 실패 시 WS 차단 | 배포 서버에 파일 or 환경변수 존재 여부 확인 필수 |
| `selfsigned` 패키지 미설치 | `--https` 모드 사용 시 런타임 오류 | production은 Caddy가 TLS 처리하므로 `--https` 플래그 사용 안 함 |
| `next build` 캐시 오염 | `.next/` 디렉토리가 backup 경로에 이미 존재 | 배포 전 `rm -rf .next && npm run build` |

---

## 6. Developer 지시 (handoff 메시지)

아래 순서로 구현하세요.

1. **TASK-1** — PM2 ecosystem 수정 (30분 내 가능, 배포 차단 해제)
2. **TASK-3** — sessionKey ref 리팩터 (기존 page.tsx 수정)
3. **TASK-4** — Enter 핸들러 추가
4. **TASK-6** — 퀴즈 페이지 + 데이터 계약
5. **TASK-7** — 결과 + 공유 페이지
6. **TASK-8** — 랜딩 → 퀴즈 연결
7. **TASK-5, TASK-2** — 히스토리 이름, 환경변수 문서화

각 TASK 완료 시 V-번호 기준으로 자체 검증 후 Reviewer에게 넘길 것.

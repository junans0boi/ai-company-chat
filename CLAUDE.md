# Claude handoff: AI Company Chat

이 문서는 Claude가 이 저장소에서 작업을 시작할 때 먼저 읽어야 하는 현재 상태와 작업 규칙이다.
이 프로젝트는 OpenClaw Gateway를 실제 백엔드로 사용하는 AI 채팅 웹앱이다. 더미 채팅 UI를 만드는 프로젝트가 아니다.

## 1. 프로젝트 목적

`AI Company Chat`은 ChatGPT/Codex와 비슷한 AI 전용 콘솔이다.

- 프로젝트별 여러 채팅 세션과 프로젝트 밖의 일반 세션을 보여준다.
- OpenClaw Gateway의 실제 세션, 모델, 스킬, 대화 기록을 사용한다.
- CEO → Architect → Developer → Reviewer 방식의 AI 회사 작업 흐름을 대화 안에서 지원한다.
- 사용자는 하나의 Gateway 연결로 세션을 계속 이어서 사용해야 한다.
- 현재 공개 서비스: https://chat.steady2vivid.kro.kr/

OpenClaw 본체를 이 저장소에 복사하거나 수정하지 않는다. OpenClaw runtime/source checkout은 이 앱과 별도로 관리한다.

## 2. 작업 전 반드시 확인할 것

```bash
git status --short
npm ci
npm run build
npx tsc --noEmit
```

현재 상태를 확인하기 전 기존 변경사항을 삭제하거나 reset하지 않는다. 사용자가 명시하지 않은 `git reset --hard`, `git clean`, 대량 삭제를 하지 않는다.

## 3. 기술 구조

- Next.js 16.3.7 / React 19 / TypeScript
- 커스텀 Node 서버: `server/index.js`
- same-origin WebSocket proxy: `/api/gateway/ws`
- WebSocket upstream 연결 구현: `server/gateway-proxy.js`
- OpenClaw Gateway 설정 로딩: `server/studio-settings.js`
- 접근/호스트 보안 정책: `server/access-gate.js`, `server/network-policy.js`
- 메인 클라이언트 콘솔: `app/page.tsx`
- 스타일: `app/CompanyConsole.module.css`, `app/CompanyConsoleMobile.module.css`, `app/LiveConsole.module.css`
- Gateway 연동 API: `app/api/openclaw/*`
- 회사 작업 API: `app/api/company/*`
- 배포 설정: `deploy/ecosystem.config.cjs`, `deploy/chat.steady2vivid.kro.kr.caddy`

앱 자체에는 DB가 없다. 프로젝트/세션/모델/스킬/대화 데이터의 source of truth는 M1 머신에서 실행 중인 OpenClaw와 그 로컬 상태다. 앱이 임의의 fake session/model을 만들어 정상 연결 상태처럼 보여주면 안 된다.

## 4. 현재 구현된 기능

### Gateway와 실제 데이터

- 브라우저는 같은 origin의 `wss://<host>/api/gateway/ws`에 연결한다.
- 서버가 OpenClaw Gateway로 WebSocket을 proxy하므로 브라우저가 Gateway token을 매번 직접 입력하지 않는다.
- 세션 목록/대화 기록/모델/스킬/프로젝트는 API를 통해 실제 OpenClaw 상태에서 불러온다.
- `sessionKeyRef`로 세션 전환과 WebSocket 재연결 race를 줄였다.
- Gateway 연결 상태는 온라인/오프라인으로 표시한다.

### 사이드바

- 프로젝트별 세션 그룹
- 프로젝트에 속하지 않은 일반 최근 세션
- 최신 세션 우선 정렬
- 프로젝트 생성/편집/삭제
- 프로젝트별 설정 디렉터리 지정
- Finder처럼 제한된 범위에서 디렉터리 탐색
- 프로젝트 메뉴: 고정, 편집, 섹션, Finder에서 보기, 채팅 보관, 프로젝트 제거
- 세션 hover 시 고정/보관 액션
- 데스크톱 사이드바 접기와 너비 조절
- 모바일 drawer와 backdrop

프로젝트 디렉터리 API는 `app/api/openclaw/directories/route.ts`에 있다. 홈/워크스페이스 범위를 벗어난 임의 경로 접근을 허용하지 않으며 숨김 디렉터리는 기본적으로 제외한다.

### Composer

왼쪽에서 오른쪽 순서:

1. 큰 `+` 버튼
2. 실행 권한
3. 모델 선택
4. 추론/생각 수준
5. 원형 컨텍스트 게이지
6. 전송 버튼

- Enter: 전송
- Shift+Enter: 줄바꿈
- 모바일에서도 여섯 컨트롤이 가로로 잘리지 않아야 한다.
- `+` 메뉴: 사진 촬영, 사진, 파일, Skills, 커넥터, 웹 검색, 플러그인 관리
- 권한 메뉴: 기본값, 읽기 전용, 보호 모드, 작업 공간, 전체 액세스
- 모델 메뉴는 `/api/openclaw/models`의 실제 모델 catalog와 OAuth 상태를 표시한다.
- `/` 입력 시 세션/모델/도구/스킬 명령어를 검색 가능한 목록으로 보여준다.
- `/skill` 검색 결과에는 스킬 이름, 제공자/source, 한글 설명을 함께 표시한다.

지원 대상으로 유지해야 하는 주요 OpenClaw 명령:

`/stop`, `/reset`, `/new`, `/compact`, `/name`, `/clear`, `/session`, `/think`, `/model`, `/verbose`, `/reasoning`, `/models`, `/trace`, `/elevated`, `/exec`, `/queue`, `/help`, `/status`, `/openclaw`, `/export-session`, `/export-trajectory`, `/tools`, `/skill`

### 컨텍스트와 토큰 표시

컨텍스트 버튼은 텍스트만 쓰지 않고 원형 게이지로 표시한다. 팝오버에는 다음을 보여준다.

- 현재 사용량 / 최대 컨텍스트
- 사용률
- 남은 컨텍스트 토큰
- 최근 실행의 입력 토큰, 출력 토큰, 예상 비용

중요한 의미 구분:

- `남은 컨텍스트 토큰`은 현재 대화가 모델의 context window에서 아직 사용할 수 있는 양이다.
- 이것은 OpenAI/OAuth/OmniRoute 계정의 결제 잔액이나 월간 API quota가 아니다.
- OmniRoute 현재 상태에서는 authoritative quota 데이터가 없을 수 있다. `omniroute quota --json`이 `No quota data`를 반환하거나 quota status가 `unknown`이면 UI에 숫자를 지어내지 말고 `알 수 없음`으로 표시한다.
- OpenClaw의 model status는 OAuth 연결/만료 상태를 제공할 수 있지만 남은 계정 토큰량을 제공하지 않는다.

관련 구현은 `app/api/openclaw/models/route.ts`와 `app/page.tsx`를 먼저 확인한다.

### 메시지 렌더링

- 같은 role의 연속 메시지는 읽기 좋은 하나의 그룹으로 표시한다.
- 메시지 안의 Markdown을 HTML UI로 변환한다.
- heading, 목록, 순서 목록, blockquote, 수평선, fenced code block, bold/italic, inline code, 안전한 HTTPS 링크를 지원한다.
- 기본 GFM 표도 렌더링한다.
- 모바일 표는 가로 스크롤한다.
- raw Markdown pipe 문자열을 그대로 노출하지 않는다.

## 5. 제품 요구사항의 기준

다음 요구사항을 임의로 되돌리지 않는다.

- AI 관련 화면만 유지한다.
- ChatGPT처럼 프로젝트별 여러 세션과 일반 세션을 모두 지원한다.
- 첫 메시지 전에는 프로젝트/로컬/branch 선택 UI를 보여주고, 대화가 시작되면 불필요한 선택 UI를 숨긴다.
- 새로고침이나 세션 전환 후에도 실제 대화 기록을 유지한다.
- Gateway token을 사용자에게 매번 다시 묻지 않는다.
- 모바일 우선이며 작은 화면에서 composer/sidebar/dialog가 잘리지 않아야 한다.
- 팝오버/dialog는 작고 화면의 다른 영역을 누르면 닫혀야 한다.
- 대화는 한 문장씩 난잡하게 쪼개지지 않고 role 단위와 Markdown 구조를 보존해 보여준다.
- 빛/어두운 테마를 지원하고 선택값은 브라우저에 저장한다.
- 실제 데이터가 없는 프로젝트/에이전트/세션은 임의로 생성해 표시하지 않는다.

역사적으로 CEO 승인 브리프, Grill with Docs, Agent 역할별 보고서, checkpoint/session 문서, 토큰 부족 시 재개 같은 요구가 있었다. 현재 이 웹앱은 실제 OpenClaw 세션을 표시하고 slash command/skill 진입점을 제공한다. 별도의 자동 CEO 오케스트레이터를 새로 만들 때는 먼저 현재 OpenClaw 세션/skill 흐름으로 해결 가능한지 확인하고, 사용자 승인 없이 범위를 확장하지 않는다.

## 6. 실행과 검증

개발 서버:

```bash
npm ci
npm run dev
```

기본 주소는 `http://localhost:3000`이다. 실행 중인 OpenClaw Gateway가 없으면 Gateway 연결 폼/오프라인 상태가 보이는 것이 정상이다.

검증:

```bash
npm run build
npx tsc --noEmit
npm run lint
git diff --check
```

Playwright를 사용할 수 있으면 다음 핵심 흐름을 확인한다.

1. 새 채팅 열기
2. Gateway 연결 후 새로고침해도 재연결/세션 기록이 유지되는지 확인
3. 프로젝트와 일반 세션을 각각 열기
4. 프로젝트 생성 dialog에서 디렉터리 탐색/선택
5. 프로젝트 더보기 메뉴의 각 액션
6. `/`와 `/skill` 명령 검색
7. 모델/권한/추론/컨텍스트 popover 외부 클릭 닫힘
8. Markdown 표, 코드 블록, 목록 렌더링
9. 라이트/다크 모드 저장 및 복원
10. 모바일 viewport에서 composer 여섯 컨트롤, sidebar, dialog overflow 없음

현재 기준 검증 결과:

- `npm run build`: 성공. Next.js dynamic filesystem route 관련 경고가 있을 수 있으나 빌드 실패는 아니다.
- `npx tsc --noEmit`: 성공
- `npx eslint app/page.tsx`: 오류 없음. 기존 warning 2개가 있을 수 있다.
- `git diff --check`: 성공

## 7. 배포

프로덕션은 별도의 M1 머신에서 이 저장소의 `main`을 checkout하고 Node 서버를 실행하며, Caddy가 공개 도메인으로 reverse proxy한다.

일반적인 배포 순서:

```bash
git pull --ff-only origin main
npm ci
npm run build
# 해당 머신의 기존 프로세스 매니저/LaunchAgent 절차로 앱 재시작
```

배포 호스트, SSH 키, Gateway token, OAuth token, 개인 경로와 같은 비밀/개인 환경 정보는 이 파일이나 Git에 기록하지 않는다. 그런 정보가 필요하면 사용자의 보안된 로컬 메모나 해당 머신의 환경 설정을 사용한다.

`deploy/ecosystem.config.cjs`와 `deploy/chat.steady2vivid.kro.kr.caddy`는 공개 가능한 프로세스/프록시 구조의 참고 설정이다. 실제 운영 절차는 대상 머신에서 먼저 현재 프로세스와 서비스 구성을 확인하고, 실행 중인 앱을 확인한 뒤 변경한다.

## 8. 작업 규칙

- 이 저장소의 앱만 수정한다. OpenClaw source code는 수정하지 않는다.
- 먼저 관련 API와 호출부를 모두 읽고 root cause를 고친다.
- 기존 helper, 타입, CSS 패턴을 재사용한다. 새 dependency/추상화를 쉽게 추가하지 않는다.
- 서버에서 온 실제 값과 UI fallback을 구분한다. fallback은 연결 장애 상태를 숨기면 안 된다.
- 파일 접근, 경로 탐색, 명령 실행, 외부 입력은 서버 경계에서 검증한다.
- token/quota/model 상태를 추측해서 하드코딩하지 않는다.
- UI 변경은 데스크톱과 모바일 모두 확인한다.
- 완료를 주장하기 전에 build, typecheck, 관련 lint와 가능한 브라우저 검증을 실행하고 결과를 보고한다.
- 변경이 크거나 동작 의미가 바뀌면 이 문서의 “현재 구현”과 “알려진 제한”도 함께 갱신한다.

## 9. 알려진 제한과 다음 후보

- OmniRoute/OpenClaw upstream에서 계정/API quota 숫자를 제공하지 않으면 실제 남은 계정 토큰량을 표시할 수 없다. 현재 앱은 컨텍스트 window 잔량과 최근 실행 usage를 정확히 구분한다.
- 카카오 공유 SDK와 OG 이미지 같은 소셜 공유 고도화는 현재 범위가 아니다.
- DB/로그인/관리자 통계는 현재 범위가 아니다.
- CEO가 Architect/Developer/Reviewer를 자동 호출하고 토큰 충전 후 자동 재개하는 완전한 오케스트레이션은 OpenClaw skill/automation 설계가 필요한 별도 작업이다.
- 새로운 기능보다 먼저 실제 Gateway session lifecycle과 모바일 회귀를 보존한다.

## 10. Claude 첫 작업 체크리스트

1. 이 문서와 `README.md`를 읽는다.
2. `git status --short`와 현재 commit을 확인한다.
3. `app/page.tsx`, `app/api/openclaw`, `server/gateway-proxy.js`, `server/studio-settings.js`를 읽는다.
4. 수정 전에 로컬 앱과 Gateway 연결 여부를 확인한다.
5. 사용자 요청이 실제 Gateway 기능인지 단순 UI인지 구분한다.
6. 구현 후 build/typecheck/lint와 관련 Playwright 흐름을 실행한다.
7. 실제 quota처럼 보이는 값, 개인 정보, secret을 커밋하지 않는다.
8. 최종 보고에는 변경 파일, 검증 명령과 결과, 남은 제한을 짧게 기록한다.

# 배포 플레이북

이 문서는 ai-company-chat의 인프라 구조와 배포 절차를 정리한다.
SSH 키, Gateway token, OAuth token 등 비밀값은 이 파일에 기록하지 않는다.

## 인프라 구조

```
M4 (개발)
 └─ 코드 수정 → git push origin main
       ↓
GitHub (junans0boi/ai-company-chat)
       ↓ git pull (M1에서)
M1 Mac (실제 앱 서버 + AI 런타임)
 ├─ /Users/junzzang/... ai-company-chat  ← Next.js 앱
 ├─ LaunchAgent: node server/index.js (포트 3012)
 ├─ OpenClaw Gateway — 127.0.0.1:18789
 ├─ OmniRoute — ~/.local/bin/omniroute serve
 ├─ CEO/Architect/Developer/Reviewer 에이전트
 └─ 세션/모델/스킬 상태 (source of truth)
       ↑ Tailscale (100.68.188.49:3012)
OCI 서버 (Caddy reverse proxy만)
 └─ Caddy: https://chat.steady2vivid.kro.kr/ → 100.68.188.49:3012
```

- **OCI는 Caddy reverse proxy만 담당한다. Next.js 앱은 OCI에서 실행되지 않는다.**
- 실제 앱(node server/index.js)은 M1의 3012 포트에서 실행된다.
- M1 LaunchAgent가 프로세스를 관리하며 죽으면 자동 재시작한다.
- Caddy는 공개 도메인 요청을 Tailscale 주소(100.68.188.49:3012)로 전달한다.

## OCI SSH 접속

접속 정보(호스트, 유저, 키 경로)는 `/Volumes/WorkSpace/Project/SecertBase/docs/deployment/LOCAL_DEV_AND_DEPLOY.md` 참조.

```bash
# 배포 디렉터리 확인
cd /home/ubuntu/ai-company-chat
git remote -v
git log --oneline -3
pm2 list
```

## M1 SSH 접속

```bash
ssh -i /Volumes/WorkSpace/Personal/Key/ssh-key-2026-07-06.key junzzang@100.68.188.49

# 접속 후 상태 확인
whoami && hostname && uname -m
~/.openclaw/bin/openclaw gateway status --deep
~/.local/bin/omniroute health
```

## M4 → GitHub → M1 배포 순서

### 1. M4: 로컬 검증 후 커밋/푸시

```bash
npm run build
npx tsc --noEmit
git diff --check

git status --short
git add <변경 파일>
git commit -m "<메시지>"
git push origin main
```

### 2. M1: 코드 받기 → 빌드 → LaunchAgent 재시작

```bash
ssh -i /Volumes/WorkSpace/Personal/Key/ssh-key-2026-07-06.key junzzang@100.68.188.49

# nvm PATH 설정 (비대화형 SSH에서는 npm을 직접 못 씀)
export PATH="$HOME/.nvm/versions/node/$(ls $HOME/.nvm/versions/node | tail -1)/bin:$PATH"

cd <ai-company-chat 경로>
git pull --ff-only origin main
npm ci
npm run build

# LaunchAgent가 자동 관리하므로 프로세스를 kill하면 자동 재시작됨
pkill -f "node server/index.js" || true
```

### 3. M1: 배포 확인

```bash
# 잠시 후 프로세스 재시작 확인
sleep 3
pgrep -fa "node server/index.js"

# 로컬 HTTP
curl -I http://127.0.0.1:3012

# commit hash 확인
git log --oneline -1
```

### 4. 공개 URL 최종 확인

```bash
# M4에서 실행
curl -I https://chat.steady2vivid.kro.kr/

# DOM에서 commit hash 확인 (브라우저 콘솔)
# document.querySelector('[data-build-id]')?.textContent
```

## 주의사항

- **OCI에 배포하지 않는다.** OCI는 Caddy만 실행 중이며 앱 코드가 없다.
- `npm`이 PATH에 없으면 → `export PATH="$HOME/.nvm/versions/node/$(ls $HOME/.nvm/versions/node | tail -1)/bin:$PATH"`
- `git pull --ff-only` 실패 시 → 충돌 원인 확인, rebase 또는 merge로 해결
- `npm ci` 실패 시 → `node_modules` 삭제 후 재시도
- LaunchAgent가 프로세스를 자동 재시작하므로 PM2를 따로 관리하지 않아도 된다.

## 배포 종료 보고 항목

- M1 SSH 접속 성공/실패
- M4 로컬 commit hash
- GitHub commit hash (`git ls-remote origin main`)
- M1 실제 commit hash (`git log --oneline -1`)
- 빌드 결과 (성공/실패)
- `curl -I http://127.0.0.1:3012` HTTP 응답 코드 (M1에서)
- `curl -I https://chat.steady2vivid.kro.kr/` HTTP 응답 코드
- M1 프로세스 재시작 확인 (`pgrep -fa "node server/index.js"`)
- 남은 문제 및 수동 조치 필요 항목

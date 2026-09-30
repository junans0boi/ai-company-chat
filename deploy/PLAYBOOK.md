# 배포 플레이북

이 문서는 ai-company-chat의 인프라 구조와 배포 절차를 정리한다.
SSH 키, Gateway token, OAuth token 등 비밀값은 이 파일에 기록하지 않는다.

## 인프라 구조

```
M4 (개발)
 └─ 코드 수정 → git push origin main
       ↓
GitHub (junans0boi/ai-company-chat)
       ↓ git pull
OCI 서버 (공개 웹서비스)
 ├─ /home/ubuntu/ai-company-chat  ← Next.js 앱
 ├─ PM2: ai-company-chat (포트 3012)
 └─ Caddy: https://chat.steady2vivid.kro.kr/

M1 Mac (AI 런타임)
 ├─ OpenClaw Gateway — 127.0.0.1:18789
 ├─ OmniRoute — ~/.local/bin/omniroute serve
 ├─ CEO/Architect/Developer/Reviewer 에이전트
 └─ 세션/모델/스킬 상태 (source of truth)
```

- M1 Gateway는 loopback 전용(127.0.0.1)이므로 OCI에서 직접 접근 불가
- OCI 앱이 M1 Gateway를 사용하려면 별도의 안전한 터널이 필요
- M1은 OpenClaw/OmniRoute 진단·세션 확인 용도

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

## M4 → GitHub → OCI 배포 순서

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

### 2. OCI: 코드 받기 → 빌드 → 재시작

```bash
cd /home/ubuntu/ai-company-chat

git pull --ff-only origin main
npm ci
npm run build

pm2 restart ai-company-chat
```

### 3. OCI: 배포 확인

```bash
# 로컬 HTTP
curl -I http://127.0.0.1:3012

# 공개 URL
curl -I https://chat.steady2vivid.kro.kr/

# PM2 상태
pm2 show ai-company-chat
```

## 주의사항

- `git pull --ff-only` 실패 시 → 충돌 원인 확인, rebase 또는 merge로 해결
- `npm ci` 실패 시 → `node_modules` 삭제 후 재시도
- PM2 재시작 후 status가 `errored` → `pm2 logs ai-company-chat --lines 50`으로 원인 확인
- OCI 앱이 Gateway 오프라인으로 표시되는 것은 정상 (M1 Gateway와 직접 연결 없음)
- M4 → SSH → M1 → SSH → OCI 2단계 경로는 기본 방식이 아님

## 배포 종료 보고 항목

- OCI SSH 접속 성공/실패
- OCI 실제 배포 경로
- 배포한 Git commit hash
- 빌드 결과 (성공/실패)
- `curl -I http://127.0.0.1:3012` HTTP 응답 코드
- `curl -I https://chat.steady2vivid.kro.kr/` HTTP 응답 코드
- PM2 status
- 남은 문제 및 수동 조치 필요 항목

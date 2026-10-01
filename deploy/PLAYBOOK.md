# 배포 플레이북

이 문서는 ai-company-chat의 인프라 구조와 배포 절차를 정리한다.
SSH 키, Gateway token, OAuth token 등 비밀값은 이 파일에 기록하지 않는다.

## 인프라 구조

```
사용자 브라우저
      ↓ HTTPS
OCI 서버 (Caddy reverse proxy만)
 └─ Caddy: https://chat.steady2vivid.kro.kr/ → 100.68.188.49:3012 (Tailscale)
      ↓ Tailscale
M1 Mac (실제 앱 서버 + AI 런타임)
 ├─ LaunchAgent: npm run start (포트 3012, HOST=0.0.0.0)
 ├─ OpenClaw Gateway — 127.0.0.1:18789
 ├─ OmniRoute — ~/.local/bin/omniroute serve
 ├─ CEO/Architect/Developer/Reviewer 에이전트
 └─ 세션/모델/스킬 상태 (source of truth)
```

핵심 사항:
- **앱(Next.js)은 M1에서 실행된다.** OCI는 Caddy proxy만 담당한다.
- Caddy는 공개 도메인 요청을 Tailscale 주소(100.68.188.49:3012)로 전달한다.
- OpenClaw Gateway는 M1 localhost에만 바인딩되므로 OCI에서 직접 접근 불가.
- OCI PM2에 ai-company-chat 프로세스가 있으나 Caddy가 라우팅하지 않음 — 사용 안 함.

## M1 SSH 접속

```bash
ssh -i /Volumes/WorkSpace/Personal/Key/ssh-key-2026-07-06.key junzzang@100.68.188.49
```

## 배포 절차 (M1에서 직접)

코드를 M1에서 바로 수정하거나, GitHub에 push된 코드를 M1에서 반영할 때:

```bash
# M1 SSH 접속 후
export PATH="$HOME/.nvm/versions/node/$(ls $HOME/.nvm/versions/node | tail -1)/bin:$PATH"
cd /Users/junzzang/backup/workspace/ai-company-chat

git pull --ff-only origin main
npm ci          # package.json 변경 시만
npm run build

# LaunchAgent가 KeepAlive로 관리하므로 kill하면 자동 재시작
pkill -f "node server/index.js" || true
```

## 배포 절차 (M4 → GitHub → M1)

M4(개발 머신)에서 작업 후 M1에 반영할 때:

```bash
# M4: 검증 후 커밋/푸시
npm run build
npx tsc --noEmit
git add <변경 파일>
git commit -m "<메시지>"
git push origin main

# M1: 위 배포 절차 실행
```

## 배포 확인

```bash
# M1에서
sleep 3
pgrep -fa "node server/index.js"
curl -I http://127.0.0.1:3012    # 401 Unauthorized = 정상 (access-gate)
git log --oneline -1

# 외부에서
curl -I https://chat.steady2vivid.kro.kr/
```

## 주의사항

- **OCI에는 앱을 배포하지 않는다.** Caddy 설정만 관리한다.
- npm이 PATH에 없으면 → `export PATH="$HOME/.nvm/versions/node/$(ls $HOME/.nvm/versions/node | tail -1)/bin:$PATH"`
- LaunchAgent가 자동 재시작하므로 PM2를 따로 관리하지 않아도 된다.
- M1의 Caddy 설정 파일 위치: OCI `/etc/caddy/sites/chat.steady2vivid.kro.kr.caddy`

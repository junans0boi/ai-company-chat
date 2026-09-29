# AI Company Chat

Standalone Next.js UI for a CEO-led AI company workflow.

## Run locally

```bash
npm ci
npm run dev
```

Open `http://localhost:3000`.

## Production

The app runs on port `3012` behind Caddy at
`https://chat.steady2vivid.kro.kr`.

```bash
npm ci
npm run build
pm2 start deploy/ecosystem.config.cjs
```

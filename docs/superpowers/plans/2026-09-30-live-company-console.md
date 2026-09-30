# Live Company Console Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the console's hardcoded sidebar, pipeline, activity, and artifact actions with live Gateway/session/file data.

**Architecture:** Keep the browser's read-only Gateway WebSocket as the source for agents, sessions, and chat history. Add one authenticated server route for a small allowlisted set of repository artifacts, and render loading, empty, error, and live states from those sources.

**Tech Stack:** Next.js App Router, React 19, TypeScript, WebSocket, Node `fs`.

**Spec:** User request: every visible console component must perform a real operation instead of showing dummy data.

## Global Constraints

- Browser must not receive a Gateway write token.
- Agent writes continue through `/api/company/send` and `/api/company/approve`.
- Artifact reads are restricted to the standalone `ai-company-chat` repository.
- No OpenClaw runtime source or secrets enter the repository.

## Review Focus

- Gateway unavailable: show offline/loading state and do not present fake online data.
- Empty session store: show an explicit empty state.
- Active/failed/done sessions: pipeline and activity reflect the latest real state.
- Invalid artifact path: return 400/404 without filesystem traversal.
- Artifact read failure: show an actionable error instead of a success toast.

### Task 1: Live Gateway data model

**Files:** Modify `app/page.tsx`.

- [ ] Request `agents.list` and `sessions.list` after Gateway connect.
- [ ] Poll `sessions.list` every 10 seconds and refresh on relevant chat events.
- [ ] Render agent labels/status from the response and sessions from actual `SessionRow` fields.
- [ ] Add loading, empty, and error states.
- [ ] Run `npm run build`.

### Task 2: Real artifact reader

**Files:** Create `app/api/company/artifacts/route.ts`; modify `app/page.tsx` and `app/CompanyConsole.module.css`.

- [ ] Expose only existing files under the standalone repository root.
- [ ] Validate relative paths and reject traversal/non-allowlisted files.
- [ ] Open artifact content in an in-app dialog with filename, metadata, and error state.
- [ ] Run `npm run build` and a 400/200 route check.

### Task 3: End-to-end verification

- [ ] Run `npm run build` and `git diff --check`.
- [ ] Verify the public page and quiz still return 200.
- [ ] Verify a real message still reaches the CEO API without exposing Gateway write credentials.
- [ ] Commit and push the standalone repository, then deploy/restart M1 and repeat HTTP checks.

import { spawn } from "node:child_process";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null) as { message?: unknown } | null;
  const message = typeof body?.message === "string" ? body.message.trim() : "";
  if (!message || message.length > 20_000) return NextResponse.json({ error: "메시지가 비어 있거나 너무 깁니다." }, { status: 400 });
  startAgent(`사용자 요청: ${message}\n\n이 요청을 CEO 세션에서 처리하고 필요한 경우 Architect→Developer→Reviewer 흐름으로 이어가세요.`, "company-chat-send");
  return NextResponse.json({ accepted: true });
}

function startAgent(message: string, idempotencyKey: string) {
  const child = spawn("openclaw", ["agent", "--agent", "ceo", "--session-key", "agent:ceo:company-survival-test", "--message", message, "--json", "--timeout", "600"], {
    detached: true,
    stdio: "ignore",
    env: { ...process.env, PATH: `${process.env.HOME}/.openclaw/tools/node-v24.19.0/bin:${process.env.HOME}/.local/bin:${process.env.PATH || ""}` },
  });
  child.unref();
  void idempotencyKey;
}

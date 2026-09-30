import { spawn } from "node:child_process";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null) as { message?: unknown; sessionKey?: unknown; model?: unknown; thinking?: unknown } | null;
  const message = typeof body?.message === "string" ? body.message.trim() : "";
  const sessionKey = typeof body?.sessionKey === "string" && /^agent:[a-z0-9_-]+:[a-z0-9:_-]+$/i.test(body.sessionKey) ? body.sessionKey : "agent:ceo:company-survival-test";
  if (!message || message.length > 20_000) return NextResponse.json({ error: "메시지가 비어 있거나 너무 깁니다." }, { status: 400 });
  const model = typeof body?.model === "string" && /^[a-z0-9._:@/-]+$/i.test(body.model) ? body.model : "";
  const thinking = typeof body?.thinking === "string" && ["off", "minimal", "low", "medium", "high", "xhigh", "adaptive", "max", "ultra"].includes(body.thinking) ? body.thinking : "";
  startAgent(message, sessionKey, "company-chat-send", model, thinking);
  return NextResponse.json({ accepted: true });
}

function startAgent(message: string, sessionKey: string, idempotencyKey: string, model: string, thinking: string) {
  const agent = sessionKey.split(":")[1] || "main";
  const args = ["agent", "--agent", agent, "--session-key", sessionKey, "--message", message, "--json", "--timeout", "600"];
  if (model) args.push("--model", model);
  if (thinking) args.push("--thinking", thinking);
  const child = spawn("openclaw", args, {
    detached: true,
    stdio: "ignore",
    env: { ...process.env, PATH: `${process.env.HOME}/.openclaw/tools/node-v24.19.0/bin:${process.env.HOME}/.local/bin:${process.env.PATH || ""}` },
  });
  child.unref();
  void idempotencyKey;
}

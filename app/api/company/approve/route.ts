import { spawn } from "node:child_process";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST() {
  const message = "CEO 승인 완료. 회사 생존 유형 테스트 작업을 재개하세요. Architect가 구조를 정리하고 Developer가 구현한 뒤 Reviewer가 검증하세요. Reviewer가 실패하면 Developer가 수정하고 다시 검증하세요. session.md와 checkpoint.md에 모든 단계와 결과를 기록하세요.";
  const child = spawn("openclaw", ["agent", "--agent", "ceo", "--session-key", "agent:ceo:company-survival-test", "--message", message, "--json", "--timeout", "600"], {
    detached: true,
    stdio: "ignore",
    env: { ...process.env, PATH: `${process.env.HOME}/.openclaw/tools/node-v24.19.0/bin:${process.env.HOME}/.local/bin:${process.env.PATH || ""}` },
  });
  child.unref();
  return NextResponse.json({ accepted: true });
}

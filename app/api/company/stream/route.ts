import { spawn } from "node:child_process";
import { join } from "node:path";

export const runtime = "nodejs";

const home = process.env.HOME || "/Users/junzzang";
const openclawHome = join(home, ".openclaw");

function esc(s: string) { return s.replace(/'/g, "''"); }

function dbQuery(dbPath: string, sql: string): Promise<Record<string, unknown>[]> {
  return new Promise((resolve) => {
    const child = spawn("sqlite3", ["-readonly", "-json", dbPath, sql]);
    let out = "";
    child.stdout.on("data", (d: Buffer) => { out += d; });
    child.on("close", () => { try { resolve(JSON.parse(out.trim() || "[]")); } catch { resolve([]); } });
    child.on("error", () => resolve([]));
  });
}

function sleep(ms: number) { return new Promise((r) => setTimeout(r, ms)); }

export async function POST(request: Request) {
  const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  const message = typeof body?.message === "string" ? body.message.trim() : "";
  const sessionKey = typeof body?.sessionKey === "string" && /^agent:[a-z0-9_-]+:[a-z0-9:_-]+$/i.test(body.sessionKey) ? body.sessionKey : "";
  if (!message || !sessionKey || message.length > 20_000) {
    return new Response(`data: ${JSON.stringify({ type: "error", error: "잘못된 요청입니다." })}\n\ndata: ${JSON.stringify({ type: "done" })}\n\n`, { headers: { "Content-Type": "text/event-stream" } });
  }
  const model = typeof body?.model === "string" && /^[a-z0-9._:@/-]+$/i.test(body.model) ? body.model : "";
  const thinking = typeof body?.thinking === "string" && ["off", "minimal", "low", "medium", "high", "xhigh", "adaptive", "max", "ultra"].includes(body.thinking) ? body.thinking : "";
  const attachments = Array.isArray(body?.attachments) ? (body.attachments as unknown[]).filter((x): x is string => typeof x === "string" && x.startsWith(`${home}/.openclaw/workspace/uploads/`)).slice(0, 10) : [];
  const agentId = sessionKey.split(":")[1] || "main";
  const dbPath = join(openclawHome, "agents", agentId, "agent", "openclaw-agent.sqlite");
  const enc = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: object) => { try { controller.enqueue(enc.encode(`data: ${JSON.stringify(data)}\n\n`)); } catch { /* closed */ } };

      try {
        // Launch openclaw (detached)
        const args = ["agent", "--agent", agentId, "--session-key", sessionKey, "--message",
          message + (attachments.length ? `\n\n첨부 파일:\n${attachments.map((p) => `- ${p}`).join("\n")}` : ""),
          "--json", "--timeout", "600"];
        if (model) args.push("--model", model);
        if (thinking) args.push("--thinking", thinking);
        spawn("openclaw", args, {
          detached: true, stdio: "ignore",
          env: { ...process.env, PATH: `${home}/.openclaw/tools/node-v24.19.0/bin:${home}/.local/bin:${process.env.PATH || ""}` },
        }).unref();

        // Wait for session to appear in SQLite (new sessions created by openclaw)
        let sessionId = "";
        for (let i = 0; i < 60 && !sessionId; i++) {
          await sleep(500);
          const rows = await dbQuery(dbPath, `select current_session_id from session_nodes where session_key='${esc(sessionKey)}' limit 1`) as { current_session_id?: string }[];
          sessionId = rows[0]?.current_session_id || "";
        }
        if (!sessionId) { send({ type: "error", error: "세션을 찾을 수 없습니다." }); send({ type: "done" }); controller.close(); return; }

        // Get current max seq
        const seqRows = await dbQuery(dbPath, `select coalesce(max(seq),0) as s from transcript_events where session_id='${esc(sessionId)}'`) as { s?: number }[];
        let lastSeq = Number(seqRows[0]?.s || 0);

        // Poll until agent finishes
        const deadline = Date.now() + 3 * 60 * 1000;
        let agentStarted = false;
        const toolCounts = new Map<string, number>();

        while (Date.now() < deadline) {
          await sleep(300);

          // Check session status
          const statusRows = await dbQuery(dbPath, `select status from session_nodes where session_key='${esc(sessionKey)}' limit 1`) as { status?: string }[];
          const status = statusRows[0]?.status;
          if (status === "running" || status === "active") agentStarted = true;

          // Get new transcript events
          const rows = await dbQuery(dbPath, `select seq, event_json from transcript_events where session_id='${esc(sessionId)}' and seq > ${lastSeq} order by seq asc limit 50`) as { seq: number; event_json: string }[];
          for (const row of rows) {
            lastSeq = row.seq;
            let evt: { message?: { role?: string; content?: unknown } };
            try { evt = JSON.parse(row.event_json); } catch { continue; }
            const msg = evt.message;
            if (!msg || msg.role !== "assistant") continue;
            if (!Array.isArray(msg.content)) continue;
            for (const part of msg.content as { type?: string; name?: string }[]) {
              if (part.type === "tool_use" && part.name) {
                const n = (toolCounts.get(part.name) || 0) + 1;
                toolCounts.set(part.name, n);
                send({ type: "tool_call", name: part.name, count: n });
              }
            }
          }

          // Done when agent finishes
          if (agentStarted && status !== "running" && status !== "active") {
            send({ type: "done" });
            controller.close();
            return;
          }
        }
        // Timeout
        send({ type: "done" });
        controller.close();
      } catch (err) {
        send({ type: "error", error: String(err) });
        send({ type: "done" });
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      "Connection": "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}

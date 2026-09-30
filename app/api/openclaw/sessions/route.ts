import { readdirSync } from "node:fs";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

const home = process.env.HOME || "/Users/junzzang";
const openclawHome = join(home, ".openclaw");
const safeKey = /^agent:([a-z0-9_-]+):[a-z0-9:_-]+$/i;

type Row = { session_key: string; current_session_id: string; project_id?: string; display_name?: string; label?: string; status?: string; updated_at?: number; last_activity_at?: number };

function dbs() {
  try {
    return readdirSync(join(openclawHome, "agents"), { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => ({ agentId: entry.name, path: join(openclawHome, "agents", entry.name, "agent", "openclaw-agent.sqlite") }));
  } catch { return []; }
}

function query<T>(path: string, sql: string): T[] {
  const result = spawnSync("sqlite3", ["-readonly", "-json", path, sql], { encoding: "utf8" });
  if (result.status !== 0 || !result.stdout.trim()) return [];
  try { return JSON.parse(result.stdout) as T[]; } catch { return []; }
}

function sqlText(value: string) { return `'${value.replaceAll("'", "''")}'`; }

export async function GET(request: Request) {
  const key = new URL(request.url).searchParams.get("sessionKey") || "";
  if (key) return history(key);
  const sessions = dbs().flatMap(({ agentId, path }) => query<Row>(path, "select session_key,current_session_id,project_id,display_name,label,status,updated_at,last_activity_at from session_nodes where archived_at is null order by coalesce(last_activity_at,updated_at) desc limit 200").map((row) => ({
    key: row.session_key,
    agentId,
    projectId: row.project_id || null,
    displayName: row.display_name || row.label || row.session_key,
    updatedAt: row.last_activity_at || row.updated_at || null,
    status: row.status || "idle",
    hasActiveRun: row.status === "running" || row.status === "active",
  })));
  sessions.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
  return NextResponse.json({ sessions });
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null) as { action?: unknown; sessionKey?: unknown; pinned?: unknown } | null;
  const action = String(body?.action || "");
  const requestedKey = typeof body?.sessionKey === "string" ? body.sessionKey : "";
  const key = requestedKey && safeKey.test(requestedKey) ? requestedKey : "";
  if (!key || !["archive", "pin"].includes(action)) return NextResponse.json({ error: "지원하지 않는 세션 작업입니다." }, { status: 400 });
  const agentId = safeKey.exec(key)?.[1];
  const found = dbs().find(({ agentId: id }) => id === agentId);
  if (!found) return NextResponse.json({ error: "세션을 찾을 수 없습니다." }, { status: 404 });
  const column = action === "archive" ? "archived_at" : "pinned_at";
  const value = action === "archive" || body?.pinned !== false ? Date.now() : "NULL";
  const result = spawnSync("sqlite3", [found.path, `update session_nodes set ${column}=${value} where session_key=${sqlText(key)}`], { encoding: "utf8" });
  if (result.status !== 0) return NextResponse.json({ error: "세션을 변경하지 못했습니다." }, { status: 500 });
  return NextResponse.json({ ok: true });
}

function history(key: string) {
  const match = safeKey.exec(key);
  if (!match) return NextResponse.json({ error: "유효하지 않은 세션입니다." }, { status: 400 });
  const found = dbs().find(({ agentId }) => agentId === match[1]);
  if (!found) return NextResponse.json({ messages: [] });
  const node = query<{ current_session_id: string }>(found.path, `select current_session_id from session_nodes where session_key=${sqlText(key)} limit 1`)[0];
  if (!node) return NextResponse.json({ messages: [] });
  const events = query<{ event_json: string }>(found.path, `select event_json from transcript_events where session_id=${sqlText(node.current_session_id)} order by seq asc`);
  const usage = { input: 0, output: 0, cost: 0 };
  let latestUsage: typeof usage | null = null;
  const messages = events.flatMap(({ event_json }) => {
    try {
      const event = JSON.parse(event_json);
      const message = event.message;
      const runUsage = message?.usage;
      if (runUsage) {
        const current = { input: Number(runUsage.input || 0), output: Number(runUsage.output || 0), cost: Number(runUsage.cost?.total || 0) };
        usage.input += current.input; usage.output += current.output; usage.cost += current.cost;
        if (message?.role === "assistant") latestUsage = current;
      }
      if (message?.role !== "user" && message?.role !== "assistant") return [];
      const content = typeof message.content === "string" ? message.content : Array.isArray(message.content) ? message.content.filter((part: { type?: string }) => part.type === "text").map((part: { text?: string }) => part.text || "").join("\n") : "";
      return content ? [{ role: message.role, content }] : [];
    } catch { return []; }
  });
  return NextResponse.json({ messages: messages.slice(-80), usage: latestUsage || usage });
}

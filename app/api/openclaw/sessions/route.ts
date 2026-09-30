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

function history(key: string) {
  const match = safeKey.exec(key);
  if (!match) return NextResponse.json({ error: "유효하지 않은 세션입니다." }, { status: 400 });
  const found = dbs().find(({ agentId }) => agentId === match[1]);
  if (!found) return NextResponse.json({ messages: [] });
  const node = query<{ current_session_id: string }>(found.path, `select current_session_id from session_nodes where session_key=${sqlText(key)} limit 1`)[0];
  if (!node) return NextResponse.json({ messages: [] });
  const events = query<{ event_json: string }>(found.path, `select event_json from transcript_events where session_id=${sqlText(node.current_session_id)} order by seq asc`);
  const usage = { input: 0, output: 0, cost: 0 };
  const messages = events.flatMap(({ event_json }) => {
    try {
      const event = JSON.parse(event_json);
      const message = event.message;
      const runUsage = message?.usage;
      if (runUsage) { usage.input += Number(runUsage.input || 0); usage.output += Number(runUsage.output || 0); usage.cost += Number(runUsage.cost?.total || 0); }
      if (message?.role !== "user" && message?.role !== "assistant") return [];
      const content = typeof message.content === "string" ? message.content : Array.isArray(message.content) ? message.content.filter((part: { type?: string }) => part.type === "text").map((part: { text?: string }) => part.text || "").join("\n") : "";
      return content ? [{ role: message.role, content }] : [];
    } catch { return []; }
  });
  return NextResponse.json({ messages: messages.slice(-80), usage });
}

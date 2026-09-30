import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

const home = process.env.HOME || "/Users/junzzang";
const openclawHome = join(home, ".openclaw");
const nodePath = join(openclawHome, "tools/node-v24.19.0/bin/node");
const cliPath = join(openclawHome, "tools/node-v24.19.0/lib/node_modules/openclaw/dist/index.js");

function runJson(args: string[]) {
  const result = spawnSync(nodePath, [cliPath, ...args], {
    encoding: "utf8",
    timeout: 12_000,
    env: { ...process.env, PATH: `${join(openclawHome, "tools/node-v24.19.0/bin")}:${process.env.PATH || ""}` },
  });
  if (result.status !== 0 || !result.stdout.trim()) return null;
  try { return JSON.parse(result.stdout); } catch { return null; }
}

function sessionUsage(sessionKey: string) {
  const match = /^agent:([a-z0-9_-]+):[a-z0-9:_-]+$/i.exec(sessionKey);
  if (!match) return null;
  const db = join(openclawHome, "agents", match[1], "agent", "openclaw-agent.sqlite");
  try {
    const sqlite = spawnSync("sqlite3", ["-readonly", "-json", db, "select current_session_id,entry_json from session_nodes where session_key='" + sessionKey.replaceAll("'", "''") + "' limit 1"], { encoding: "utf8" });
    const node = sqlite.status === 0 && sqlite.stdout.trim() ? JSON.parse(sqlite.stdout)[0] : null;
    if (!node) return null;
    const events = spawnSync("sqlite3", ["-readonly", "-json", db, `select event_json from transcript_events where session_id='${String(node.current_session_id).replaceAll("'", "''")}' order by seq desc limit 40`], { encoding: "utf8" });
    const rows = events.status === 0 && events.stdout.trim() ? JSON.parse(events.stdout) : [];
    const latest = rows.map((row: { event_json: string }) => { try { return JSON.parse(row.event_json).message; } catch { return null; } }).find((message: { role?: string; usage?: Record<string, unknown>; model?: string; provider?: string } | null) => message?.role === "assistant" && message.usage);
    const entry = JSON.parse(node.entry_json || "{}");
    return { model: latest?.model || entry.model || null, provider: latest?.provider || entry.modelProvider || null, usage: latest?.usage || null };
  } catch { return null; }
}

export async function GET(request: Request) {
  const sessionKey = new URL(request.url).searchParams.get("sessionKey") || "";
  const catalog = runJson(["models", "list", "--all", "--json"]);
  const models = (Array.isArray(catalog) ? catalog : catalog?.models || []).map((item: Record<string, unknown>) => ({
    id: String(item.key || item.id || item.name),
    name: String(item.name || item.id || item.key),
    provider: String(item.provider || String(item.key || "").split("/")[0] || "unknown"),
    contextWindow: Number(item.contextWindow || 0),
    available: item.available !== false,
    reasoning: Boolean(item.reasoning),
    input: item.input || "text",
  })).filter((item: { id: string }) => item.id && item.id !== "undefined");
  let oauth: unknown[] = [];
  const status = runJson(["models", "status", "--json"]);
  if (Array.isArray(status?.auth?.oauth?.profiles)) oauth = status.auth.oauth.profiles.map((profile: Record<string, unknown>) => ({ provider: profile.provider, type: profile.type, status: profile.status, label: profile.label }));
  const current = sessionKey ? sessionUsage(sessionKey) : null;
  const selected = models.find((item: { id: string; name: string }) => item.id === current?.model || item.name === current?.model) || models[0] || null;
  const rawUsage = current?.usage as Record<string, unknown> | null;
  const usageParts = ["input", "output", "cacheRead", "cacheWrite"].reduce((total, key) => total + Number(rawUsage?.[key] || 0), 0);
  const usedTokens = Number(rawUsage?.totalTokens || usageParts);
  const maxTokens = Number(selected?.contextWindow || 0);
  return NextResponse.json({ models, oauth, selectedModel: current?.model || selected?.id || null, provider: current?.provider || selected?.provider || null, usage: { input: Number(rawUsage?.input || 0), output: Number(rawUsage?.output || 0), cost: Number((rawUsage?.cost as Record<string, unknown> | undefined)?.total || 0) }, context: { usedTokens, maxTokens, remainingTokens: Math.max(0, maxTokens - usedTokens), percent: maxTokens ? Math.min(100, Math.round((usedTokens / maxTokens) * 100)) : 0 } });
}

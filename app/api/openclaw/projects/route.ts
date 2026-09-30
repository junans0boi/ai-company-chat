import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { isAbsolute, join, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export type Project = { id: string; name: string; directory: string; pinned: boolean; section: string; sessionKeys: string[] };
const home = process.env.HOME || "/Users/junzzang";
const store = join(process.env.AI_COMPANY_CHAT_STATE_DIR || join(home, ".openclaw", "claw3d", "ai-company-chat"), "projects.json");

function readProjects(): Project[] {
  try { return JSON.parse(readFileSync(store, "utf8")) as Project[]; } catch (error) { if ((error as NodeJS.ErrnoException).code === "ENOENT") return []; throw error; }
}
function saveProjects(projects: Project[]) {
  mkdirSync(join(store, ".."), { recursive: true, mode: 0o700 });
  writeFileSync(store, JSON.stringify(projects, null, 2), { mode: 0o600 });
}

export async function GET() { return NextResponse.json({ projects: readProjects(), workspace: process.env.AI_COMPANY_CHAT_WORKSPACE || process.cwd() }); }

export async function POST(request: Request) {
  const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  const action = String(body?.action || "");
  const projects = readProjects();
  const id = typeof body?.id === "string" ? body.id : "";
  const index = projects.findIndex((project) => project.id === id);
  if (action === "create" || action === "update") {
    const name = typeof body?.name === "string" ? body.name.trim().slice(0, 80) : "";
    const rawDirectory = typeof body?.directory === "string" ? body.directory.trim() : "";
    if (!name || !isAbsolute(rawDirectory)) return NextResponse.json({ error: "프로젝트 이름과 현재 M1에 존재하는 절대 경로를 입력하세요." }, { status: 400 });
    const directory = resolve(rawDirectory);
    if (!existsSync(directory)) return NextResponse.json({ error: "현재 M1 Mac에서 해당 디렉터리를 찾을 수 없습니다." }, { status: 400 });
    const { statSync } = await import("node:fs");
    if (!statSync(directory).isDirectory()) return NextResponse.json({ error: "설정 디렉터리는 폴더여야 합니다." }, { status: 400 });
    if (action === "create") projects.unshift({ id: crypto.randomUUID(), name, directory, pinned: false, section: "프로젝트", sessionKeys: [] });
    else if (index >= 0) projects[index] = { ...projects[index], name, directory };
    else return NextResponse.json({ error: "프로젝트를 찾을 수 없습니다." }, { status: 404 });
  } else if (index < 0) return NextResponse.json({ error: "프로젝트를 찾을 수 없습니다." }, { status: 404 });
  else if (action === "pin") projects[index].pinned = body?.pinned === true;
  else if (action === "section") projects[index].section = body?.section === "보관된 프로젝트" ? "보관된 프로젝트" : "프로젝트";
  else if (action === "linkSession") {
    const key = typeof body?.sessionKey === "string" ? body.sessionKey : "";
    if (!/^agent:[a-z0-9_-]+:[a-z0-9:_-]+$/i.test(key)) return NextResponse.json({ error: "유효하지 않은 세션입니다." }, { status: 400 });
    if (!projects[index].sessionKeys.includes(key)) projects[index].sessionKeys.push(key);
  } else if (action === "archive") {
    for (const key of projects[index].sessionKeys) {
      const agent = /^agent:([a-z0-9_-]+):/i.exec(key)?.[1];
      const db = agent && join(home, ".openclaw", "agents", agent, "agent", "openclaw-agent.sqlite");
      if (!db || !existsSync(db)) return NextResponse.json({ error: `세션 데이터베이스를 찾을 수 없습니다: ${agent || "unknown"}` }, { status: 500 });
      const result = spawnSync("sqlite3", ["-bail", db, `update session_nodes set archived_at=${Date.now()} where session_key='${key.replaceAll("'", "''")}'`], { encoding: "utf8" });
      if (result.status !== 0) return NextResponse.json({ error: result.stderr.trim() || "프로젝트 대화를 보관하지 못했습니다." }, { status: 500 });
    }
  } else if (action === "reveal") {
    if (process.platform !== "darwin") return NextResponse.json({ error: "Finder는 M1 Mac에서만 열 수 있습니다." }, { status: 400 });
    const result = spawnSync("open", ["-R", projects[index].directory]);
    if (result.status !== 0) return NextResponse.json({ error: "Finder에서 폴더를 열지 못했습니다." }, { status: 500 });
  } else if (action === "remove") projects.splice(index, 1);
  else return NextResponse.json({ error: "지원하지 않는 프로젝트 작업입니다." }, { status: 400 });
  saveProjects(projects);
  return NextResponse.json({ ok: true, projects });
}

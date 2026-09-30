import { readdirSync, statSync } from "node:fs";
import { dirname, join, relative, resolve, sep } from "node:path";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

const home = resolve(process.env.HOME || "/Users/junzzang");
const workspace = resolve(process.env.AI_COMPANY_CHAT_WORKSPACE || process.cwd());
const allowedRoots = Array.from(new Set([home, workspace]));

function isAllowed(path: string) {
  return allowedRoots.some((root) => path === root || path.startsWith(`${root}${sep}`));
}

export async function GET(request: Request) {
  const requested = new URL(request.url).searchParams.get("path") || workspace;
  const directory = resolve(requested);
  if (!isAllowed(directory)) return NextResponse.json({ error: "홈 디렉터리 안에서만 탐색할 수 있습니다." }, { status: 403 });
  try {
    if (!statSync(directory).isDirectory()) return NextResponse.json({ error: "폴더가 아닙니다." }, { status: 400 });
    const entries = readdirSync(directory, { withFileTypes: true })
      .filter((entry) => entry.isDirectory() && !entry.name.startsWith("."))
      .map((entry) => ({ name: entry.name, path: join(directory, entry.name) }))
      .sort((a, b) => a.name.localeCompare(b.name, "ko"));
    const parent = directory === home ? null : isAllowed(dirname(directory)) ? dirname(directory) : null;
    return NextResponse.json({ path: directory, parent, entries, relativePath: relative(home, directory) || "~" });
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;
    return NextResponse.json({ error: code === "EACCES" ? "이 폴더를 읽을 권한이 없습니다." : "폴더를 읽지 못했습니다." }, { status: 400 });
  }
}

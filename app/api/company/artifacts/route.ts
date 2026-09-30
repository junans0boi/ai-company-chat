import { readFile, readdir, stat } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

const root = path.resolve(process.cwd());
const allowedRoots = ["app", "deploy", "server"];
const allowedFiles = new Set(["checkpoint.md", "README.md", "package.json"]);

function resolveArtifact(input: string) {
  const relative = input.replace(/^\/+/, "");
  const target = path.resolve(root, relative);
  const insideRoot = target === root || target.startsWith(`${root}${path.sep}`);
  const allowed = allowedFiles.has(relative) || allowedRoots.some((prefix) => relative === prefix || relative.startsWith(`${prefix}/`));
  return insideRoot && allowed ? target : null;
}

export async function GET(request: Request) {
  const requested = new URL(request.url).searchParams.get("path");
  if (requested) {
    const target = resolveArtifact(requested);
    if (!target) return NextResponse.json({ error: "허용되지 않은 파일 경로입니다." }, { status: 400 });
    try {
      const info = await stat(target);
      if (!info.isFile() || info.size > 512_000) return NextResponse.json({ error: "파일을 읽을 수 없습니다." }, { status: 400 });
      return NextResponse.json({ path: path.relative(root, target), content: await readFile(target, "utf8"), size: info.size, updatedAt: info.mtimeMs });
    } catch {
      return NextResponse.json({ error: "파일이 존재하지 않습니다." }, { status: 404 });
    }
  }

  const candidates = ["checkpoint.md", "README.md", "package.json", "app/page.tsx", "server/index.js", "deploy/chat.steady2vivid.kro.kr.caddy"];
  const artifacts = [];
  for (const relative of candidates) {
    const target = resolveArtifact(relative);
    if (!target) continue;
    try {
      const info = await stat(target);
      if (info.isFile()) artifacts.push({ path: relative, size: info.size, updatedAt: info.mtimeMs });
    } catch {}
  }
  return NextResponse.json({ artifacts });
}

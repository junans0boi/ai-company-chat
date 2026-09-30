import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const form = await request.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File) || !file.name) return NextResponse.json({ error: "파일이 없습니다." }, { status: 400 });
  if (file.size > 25 * 1024 * 1024) return NextResponse.json({ error: "파일은 25MB 이하만 첨부할 수 있습니다." }, { status: 413 });
  const directory = join(process.env.HOME || "/Users/junzzang", ".openclaw", "workspace", "uploads");
  const extension = file.name.includes(".") ? `.${file.name.split(".").pop()!.toLowerCase().replace(/[^a-z0-9]/g, "")}` : "";
  const path = join(directory, `${randomUUID()}${extension}`);
  await mkdir(directory, { recursive: true });
  await writeFile(path, Buffer.from(await file.arrayBuffer()));
  return NextResponse.json({ path, name: file.name, size: file.size });
}

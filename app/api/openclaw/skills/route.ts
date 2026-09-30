import { readdirSync } from "node:fs";
import { join } from "node:path";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET() {
  const home = process.env.HOME || "/Users/junzzang";
  const roots = [join(home, ".openclaw", "skills"), join(home, ".openclaw", "plugin-skills"), join(home, ".agents", "skills")];
  const names = new Set<string>();
  for (const root of roots) {
    try { for (const entry of readdirSync(root, { withFileTypes: true })) if (entry.isDirectory()) names.add(entry.name); } catch {}
  }
  return NextResponse.json({ skills: [...names].sort() });
}

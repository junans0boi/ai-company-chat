import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

type Skill = { name: string; source: string; description: string; descriptionKo: string };

const koreanDescriptions: Record<string, string> = {
  grill_me: "계획이나 디자인을 날카롭게 다듬는 심층 인터뷰",
  grill_with_docs: "계획을 검증하면서 ADR과 용어집까지 함께 작성하는 인터뷰",
  grilling: "계획이나 디자인의 약점을 집요하게 검증하는 인터뷰",
  improve_codebase_architecture: "코드베이스를 분석해 구조 개선 기회를 찾는 리포트",
  triage: "이슈와 PR을 분류하고 검증하는 트리아지 워크플로",
};

export async function GET() {
  const home = process.env.HOME || "/Users/junzzang";
  const roots = [
    [join(home, ".openclaw", "skills"), "OpenClaw"],
    [join(home, ".openclaw", "plugin-skills"), "OpenClaw 플러그인"],
    [join(home, ".openclaw", "tools", "node-v24.19.0", "lib", "node_modules", "openclaw", "skills"), "OpenClaw 기본 스킬"],
    [join(home, ".agents", "skills"), "로컬 Agents 스킬"],
  ] as const;
  const skills = new Map<string, Skill>();
  for (const [root, source] of roots) {
    try {
      for (const entry of readdirSync(root, { withFileTypes: true })) {
        if (!entry.isDirectory() || skills.has(entry.name)) continue;
        const description = readDescription(join(root, entry.name, "SKILL.md"));
        skills.set(entry.name, { name: entry.name, source, description, descriptionKo: koreanDescriptions[entry.name] || description });
      }
    } catch {}
  }
  return NextResponse.json({ skills: [...skills.values()].sort((a, b) => a.name.localeCompare(b.name)) });
}

function readDescription(path: string) {
  try {
    const text = readFileSync(path, "utf8");
    return text.match(/^description:\s*["']?(.+?)["']?\s*$/m)?.[1]?.trim() || "설명이 등록되지 않은 스킬";
  } catch { return "설명이 등록되지 않은 스킬"; }
}

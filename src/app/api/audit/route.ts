import { NextResponse } from "next/server";
import { runJudgmentChecks } from "@/lib/llm/judgmentAudit";

export async function POST(req: Request) {
  try {
    const { content } = await req.json();
    if (!content) {
      return NextResponse.json({ error: "Content is required" }, { status: 400 });
    }

    const { defaultBrandConfig } = await import("@/lib/analysis/config");

    const issues = await runJudgmentChecks(content, defaultBrandConfig);
    return NextResponse.json(issues);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

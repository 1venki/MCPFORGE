import { parseSpec } from "@mcpforge/core";
import { NextResponse } from "next/server";

function detectFormat(specText: string): "yaml" | "json" {
  const trimmed = specText.trim();
  if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
    return "json";
  }
  return "yaml";
}

export async function POST(request: Request): Promise<Response> {
  try {
    const body = (await request.json()) as { specText?: string };
    if (!body.specText || body.specText.trim() === "") {
      return NextResponse.json({ ok: false, error: "specText is required" }, { status: 400 });
    }

    const ir = parseSpec(body.specText, detectFormat(body.specText));

    return NextResponse.json({
      ok: true,
      message: `Valid. ${ir.tools.length} tools detected.`,
      tools: ir.tools.map((tool) => ({
        name: tool.name,
        description: tool.description,
        method: tool.implementation.method,
        url: tool.implementation.url,
        parameters: tool.parameters.length
      }))
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}

import { generateProject, parseSpec } from "@mcpforge/core";
import JSZip from "jszip";
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
    const body = (await request.json()) as { specText?: string; previewOnly?: boolean };
    if (!body.specText || body.specText.trim() === "") {
      return NextResponse.json({ ok: false, error: "specText is required" }, { status: 400 });
    }

    const ir = parseSpec(body.specText, detectFormat(body.specText));
    const generated = generateProject(ir);

    if (body.previewOnly) {
      return NextResponse.json({ ok: true, files: generated.files });
    }

    const serverName = ir.server.name || "mcp-server";
    const zip = new JSZip();
    for (const [filePath, content] of Object.entries(generated.files)) {
      zip.file(filePath, content);
    }

    const zipBuffer = await zip.generateAsync({ type: "arraybuffer" });

    return new NextResponse(zipBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename=${serverName}.zip`,
        "X-Server-Name": serverName
      }
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}

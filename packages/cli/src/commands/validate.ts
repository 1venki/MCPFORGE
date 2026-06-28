import { readFile } from "node:fs/promises";
import path from "node:path";
import { parseSpec } from "@mcpforge/core";

function inferFormat(filePath: string): "yaml" | "json" {
  const ext = path.extname(filePath).toLowerCase();
  return ext === ".json" ? "json" : "yaml";
}

export async function validateCommand(options: { from: string }): Promise<void> {
  const absoluteInput = path.resolve(process.cwd(), options.from);
  const content = await readFile(absoluteInput, "utf-8");
  const ir = parseSpec(content, inferFormat(absoluteInput));
  console.log(`Valid. ${ir.tools.length} tools detected.`);
}

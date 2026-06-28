import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { generateProject, parseSpec } from "@mcpforge/core";

function inferFormat(filePath: string): "yaml" | "json" {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === ".json") {
    return "json";
  }
  return "yaml";
}

export interface GenerateOptions {
  from: string;
  output: string;
}

export async function generateCommand(options: GenerateOptions): Promise<void> {
  const absoluteInput = path.resolve(process.cwd(), options.from);
  const absoluteOutput = path.resolve(process.cwd(), options.output);

  const content = await readFile(absoluteInput, "utf-8");
  const ir = parseSpec(content, inferFormat(absoluteInput));
  const generated = generateProject(ir);

  for (const [relativePath, fileContent] of Object.entries(generated.files)) {
    const targetPath = path.join(absoluteOutput, relativePath);
    await mkdir(path.dirname(targetPath), { recursive: true });
    await writeFile(targetPath, fileContent, "utf-8");
  }

  const root = fileURLToPath(new URL("../../..", import.meta.url));
  void root;
  console.log(`Generated project at ${absoluteOutput}`);
}

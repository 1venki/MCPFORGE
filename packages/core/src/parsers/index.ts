import { parseYamlSpec } from "./yaml-parser.js";
import type { McpForgeIR } from "../ir/types.js";

export type SupportedInputFormat = "yaml" | "json";

export function parseSpec(content: string, format: SupportedInputFormat): McpForgeIR {
  if (format === "yaml") {
    return parseYamlSpec(content);
  }

  const parsed = JSON.parse(content) as unknown;
  return parseYamlSpec(JSON.stringify(parsed));
}

export { parseYamlSpec };

import { parse } from "yaml";
import { z } from "zod";
import type { McpForgeIR } from "../ir/types.js";

const parameterSchema = z.object({
  name: z.string().min(1),
  type: z.enum(["string", "number", "boolean", "object", "array"]),
  required: z.boolean().default(false),
  description: z.string().optional(),
  defaultValue: z.unknown().optional(),
  enum: z.array(z.string()).optional()
});

const httpImplementationSchema = z.object({
  type: z.literal("http"),
  method: z.enum(["GET", "POST", "PUT", "PATCH", "DELETE"]),
  url: z.string().min(1),
  headers: z.record(z.string(), z.string()).optional(),
  queryParams: z.record(z.string(), z.string()).optional(),
  body: z.union([z.record(z.string(), z.unknown()), z.string()]).optional()
});

const functionImplementationSchema = z.object({
  type: z.literal("function"),
  code: z.string().min(1)
});

const scriptImplementationSchema = z.object({
  type: z.literal("script"),
  command: z.string().min(1),
  shell: z.string().optional(),
  timeout: z.number().int().positive().optional()
});

// For backward compatibility: if no "type" field, treat as HTTP
const legacyHttpSchema = z.object({
  method: z.enum(["GET", "POST", "PUT", "PATCH", "DELETE"]),
  url: z.string().min(1),
  headers: z.record(z.string(), z.string()).optional(),
  queryParams: z.record(z.string(), z.string()).optional(),
  body: z.union([z.record(z.string(), z.unknown()), z.string()]).optional()
});

const implementationSchema = z.union([
  httpImplementationSchema,
  functionImplementationSchema,
  scriptImplementationSchema,
  legacyHttpSchema.transform((val) => ({ ...val, type: "http" as const }))
]);

const specSchema = z.object({
  server: z.object({
    name: z.string().min(1),
    version: z.string().min(1),
    description: z.string().optional(),
    auth: z
      .object({
        type: z.enum(["bearer", "api-key", "basic", "oauth2"]),
        headerName: z.string().optional(),
        envVariable: z.string().min(1),
        prefix: z.string().optional()
      })
      .optional(),
    baseUrl: z.string().url().optional(),
    defaultHeaders: z.record(z.string(), z.string()).optional(),
    defaultTimeout: z.number().int().positive().optional()
  }),
  tools: z.array(
    z.object({
      name: z.string().min(1),
      description: z.string().min(1),
      parameters: z.array(parameterSchema).default([]),
      implementation: implementationSchema
    })
  )
});

export function parseYamlSpec(raw: string): McpForgeIR {
  const parsed = parse(raw);
  const result = specSchema.safeParse(parsed);

  if (!result.success) {
    const issues = result.error.issues
      .map((issue) => `${issue.path.join(".") || "root"}: ${issue.message}`)
      .join("\n");
    throw new Error(`Invalid mcpforge spec:\n${issues}`);
  }

  const ir = result.data as McpForgeIR;
  const duplicateNames = new Set<string>();
  const seen = new Set<string>();

  for (const tool of ir.tools) {
    if (seen.has(tool.name)) {
      duplicateNames.add(tool.name);
    }
    seen.add(tool.name);
  }

  if (duplicateNames.size > 0) {
    throw new Error(`Duplicate tool names found: ${[...duplicateNames].join(", ")}`);
  }

  return ir;
}

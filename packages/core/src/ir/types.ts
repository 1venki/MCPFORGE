export type ParamType = "string" | "number" | "boolean" | "object" | "array";

export interface ServerAuth {
  type: "bearer" | "api-key" | "basic" | "oauth2";
  headerName?: string;
  envVariable: string;
  prefix?: string;
}

export interface ServerConfig {
  name: string;
  version: string;
  description?: string;
  auth?: ServerAuth;
  baseUrl?: string;
  defaultHeaders?: Record<string, string>;
  defaultTimeout?: number;
}

export interface ToolParameter {
  name: string;
  type: ParamType;
  required: boolean;
  description?: string;
  defaultValue?: unknown;
  enum?: string[];
}

export interface HttpImplementation {
  type: "http";
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  url: string;
  headers?: Record<string, string>;
  queryParams?: Record<string, string>;
  body?: Record<string, unknown> | string;
}

export interface FunctionImplementation {
  type: "function";
  code: string;
}

export interface ScriptImplementation {
  type: "script";
  command: string;
  shell?: string;
  timeout?: number;
}

export type ToolImplementation = HttpImplementation | FunctionImplementation | ScriptImplementation;

export interface ToolDefinition {
  name: string;
  description: string;
  parameters: ToolParameter[];
  implementation: ToolImplementation;
}

export interface McpForgeIR {
  server: ServerConfig;
  tools: ToolDefinition[];
}

export interface GeneratedProject {
  files: Record<string, string>;
}

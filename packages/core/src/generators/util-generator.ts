import type { McpForgeIR } from "../ir/types.js";

export function generateHttpClientFile(ir: McpForgeIR): string {
  const authBlock = ir.server.auth
    ? `if (env.${ir.server.auth.envVariable}) {
    headers[${JSON.stringify(ir.server.auth.headerName ?? "Authorization")}] = ${JSON.stringify(
        ir.server.auth.prefix ?? "Bearer"
      )} + " " + env.${ir.server.auth.envVariable};
  }`
    : "";

  return `import { loadEnv } from "./env.js";

interface HttpRequest {
  method: string;
  url: string;
  headers?: Record<string, string>;
  queryParams?: Record<string, string>;
  body?: unknown;
}

const env = loadEnv();

function applyTemplate(value: string, params: Record<string, unknown>): string {
  return value.replace(/\\{\\{\\s*([a-zA-Z0-9_]+)\\s*\\}\\}/g, (_, key: string) => {
    const found = params[key];
    return found === undefined || found === null ? "" : String(found);
  });
}

function materializeObject(input: unknown, params: Record<string, unknown>): unknown {
  if (typeof input === "string") {
    return applyTemplate(input, params);
  }
  if (Array.isArray(input)) {
    return input.map((item) => materializeObject(item, params));
  }
  if (input && typeof input === "object") {
    const output: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(input as Record<string, unknown>)) {
      output[key] = materializeObject(value, params);
    }
    return output;
  }
  return input;
}

export async function httpClient(request: HttpRequest, params: Record<string, unknown>): Promise<unknown> {
  const url = new URL(applyTemplate(request.url, params));

  if (request.queryParams) {
    for (const [key, value] of Object.entries(request.queryParams)) {
      const resolved = applyTemplate(value, params);
      if (resolved !== "") {
        url.searchParams.set(key, resolved);
      }
    }
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...request.headers
  };

  ${authBlock}

  const resolvedBody = request.body ? materializeObject(request.body, params) : undefined;

  const response = await fetch(url.toString(), {
    method: request.method,
    headers,
    body: resolvedBody ? JSON.stringify(resolvedBody) : undefined,
    signal: AbortSignal.timeout(${ir.server.defaultTimeout ?? 30_000})
  });

  const text = await response.text();
  if (!response.ok) {
    throw new Error(\`HTTP \${response.status}: \${text.slice(0, 500)}\`);
  }

  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}
`;
}

export function generateEnvFile(ir: McpForgeIR): string {
  const envVar = ir.server.auth?.envVariable;
  const entries = envVar ? `${envVar}: process.env.${envVar}` : "";

  return `export function loadEnv(): Record<string, string | undefined> {
  return {
    ${entries}
  };
}
`;
}

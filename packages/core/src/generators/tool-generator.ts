import { Project } from "ts-morph";
import type { ToolDefinition, HttpImplementation, FunctionImplementation, ScriptImplementation } from "../ir/types.js";
import { toKebabCase, toPascalCase, toSnakeCase } from "../utils/naming.js";

function generateHttpStatements(impl: HttpImplementation): string[] {
  return [
    "try {",
    "  const response = await httpClient({",
    `    method: ${JSON.stringify(impl.method)},`,
    `    url: ${JSON.stringify(impl.url)},`,
    `    headers: ${JSON.stringify(impl.headers ?? {})},`,
    `    queryParams: ${JSON.stringify(impl.queryParams ?? {})},`,
    `    body: ${JSON.stringify(impl.body ?? null)}`,
    "  }, params);",
    "",
    "  return {",
    "    content: [{ type: 'text', text: JSON.stringify(response, null, 2) }]",
    "  };",
    "} catch (error) {",
    "  const message = error instanceof Error ? error.message : String(error);",
    "  return {",
    "    content: [{ type: 'text', text: `Error: ${message}` }],",
    "    isError: true",
    "  };",
    "}"
  ];
}

function generateFunctionStatements(impl: FunctionImplementation): string[] {
  return [
    "try {",
    `  ${impl.code}`,
    "} catch (error) {",
    "  const message = error instanceof Error ? error.message : String(error);",
    "  return {",
    "    content: [{ type: 'text', text: `Error: ${message}` }],",
    "    isError: true",
    "  };",
    "}"
  ];
}

function generateScriptStatements(impl: ScriptImplementation): string[] {
  const timeout = impl.timeout ?? 30000;
  const shell = impl.shell ?? "/bin/bash";
  return [
    "try {",
    `  const command = \`${impl.command}\`;`,
    "  const resolvedCmd = command.replace(/\\{\\{\\s*([a-zA-Z0-9_]+)\\s*\\}\\}/g, (_, key) => {",
    "    const val = (params as Record<string, unknown>)[key];",
    "    return val === undefined || val === null ? '' : String(val);",
    "  });",
    "",
    "  const { stdout, stderr } = await new Promise<{ stdout: string; stderr: string }>((resolve, reject) => {",
    `    exec(resolvedCmd, { timeout: ${timeout}, shell: ${JSON.stringify(shell)} }, (error, stdout, stderr) => {`,
    "      if (error) { reject(error); return; }",
    "      resolve({ stdout, stderr });",
    "    });",
    "  });",
    "",
    "  const output = stdout || stderr;",
    "  return {",
    "    content: [{ type: 'text', text: output }]",
    "  };",
    "} catch (error) {",
    "  const message = error instanceof Error ? error.message : String(error);",
    "  return {",
    "    content: [{ type: 'text', text: `Error: ${message}` }],",
    "    isError: true",
    "  };",
    "}"
  ];
}

export function generateToolFile(project: Project, tool: ToolDefinition): void {
  const kebab = toKebabCase(tool.name);
  const pascal = toPascalCase(tool.name);
  const fnName = `handle_${toSnakeCase(tool.name)}`;
  const impl = tool.implementation;

  const file = project.createSourceFile(`src/tools/${kebab}.ts`, "", { overwrite: true });

  file.addImportDeclaration({
    moduleSpecifier: "@modelcontextprotocol/sdk/types.js",
    namedImports: ["CallToolResult"],
    isTypeOnly: true
  });

  file.addImportDeclaration({
    moduleSpecifier: `../schemas/${kebab}.schema.js`,
    namedImports: [`${pascal}Params`],
    isTypeOnly: true
  });

  if (impl.type === "http") {
    file.addImportDeclaration({
      moduleSpecifier: "../utils/http-client.js",
      namedImports: ["httpClient"]
    });
  }

  if (impl.type === "script") {
    file.addImportDeclaration({
      moduleSpecifier: "child_process",
      namedImports: ["exec"]
    });
  }

  let statements: string[];
  switch (impl.type) {
    case "http":
      statements = generateHttpStatements(impl);
      break;
    case "function":
      statements = generateFunctionStatements(impl);
      break;
    case "script":
      statements = generateScriptStatements(impl);
      break;
  }

  file.addFunction({
    name: fnName,
    isAsync: true,
    isExported: true,
    parameters: [{ name: "params", type: `${pascal}Params` }],
    returnType: "Promise<CallToolResult>",
    statements
  });
}

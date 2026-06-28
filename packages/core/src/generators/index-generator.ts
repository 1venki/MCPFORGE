import { Project } from "ts-morph";
import type { McpForgeIR } from "../ir/types.js";
import { toKebabCase, toPascalCase, toSnakeCase } from "../utils/naming.js";

export function generateIndexFile(project: Project, ir: McpForgeIR): void {
  const file = project.createSourceFile("src/index.ts", "", { overwrite: true });

  file.addImportDeclaration({
    moduleSpecifier: "@modelcontextprotocol/sdk/server/mcp.js",
    namedImports: ["McpServer"]
  });

  file.addImportDeclaration({
    moduleSpecifier: "@modelcontextprotocol/sdk/server/stdio.js",
    namedImports: ["StdioServerTransport"]
  });

  file.addImportDeclaration({ moduleSpecifier: "dotenv/config" });

  for (const tool of ir.tools) {
    const kebab = toKebabCase(tool.name);
    const pascal = toPascalCase(tool.name);
    file.addImportDeclaration({
      moduleSpecifier: `./tools/${kebab}.js`,
      namedImports: [`handle_${toSnakeCase(tool.name)}`]
    });
    file.addImportDeclaration({
      moduleSpecifier: `./schemas/${kebab}.schema.js`,
      namedImports: [`${pascal}Schema`]
    });
  }

  file.addStatements([
    `const server = new McpServer({\n  name: ${JSON.stringify(ir.server.name)},\n  version: ${JSON.stringify(ir.server.version)}\n});`
  ]);

  for (const tool of ir.tools) {
    const snake = toSnakeCase(tool.name);
    const pascal = toPascalCase(tool.name);
    file.addStatements([
      `server.tool(${JSON.stringify(snake)}, ${JSON.stringify(tool.description)}, ${pascal}Schema.shape, async (params) => handle_${snake}(params));`
    ]);
  }

  file.addStatements([
    "async function main(): Promise<void> {",
    "  const transport = new StdioServerTransport();",
    "  await server.connect(transport);",
    `  console.error(${JSON.stringify(`${ir.server.name} MCP server running on stdio`)});`,
    "}",
    "",
    "main().catch((error) => {",
    "  console.error(error);",
    "  process.exit(1);",
    "});"
  ]);
}

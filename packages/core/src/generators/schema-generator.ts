import { Project } from "ts-morph";
import type { ToolDefinition, ToolParameter } from "../ir/types.js";
import { toKebabCase, toPascalCase } from "../utils/naming.js";

function zodExpr(param: ToolParameter): string {
  let base = "z.any()";

  switch (param.type) {
    case "string":
      base = "z.string()";
      break;
    case "number":
      base = "z.number()";
      break;
    case "boolean":
      base = "z.boolean()";
      break;
    case "object":
      base = "z.record(z.string(), z.unknown())";
      break;
    case "array":
      base = "z.array(z.unknown())";
      break;
  }

  if (param.enum && param.enum.length > 0) {
    const enumValues = JSON.stringify(param.enum);
    base = `z.enum(${enumValues} as [string, ...string[]])`;
  }

  if (param.description) {
    base = `${base}.describe(${JSON.stringify(param.description)})`;
  }

  if (!param.required) {
    base = `${base}.optional()`;
  }

  return base;
}

export function generateSchemaFile(project: Project, tool: ToolDefinition): void {
  const kebab = toKebabCase(tool.name);
  const pascal = toPascalCase(tool.name);
  const schemaName = `${pascal}Schema`;

  const file = project.createSourceFile(`src/schemas/${kebab}.schema.ts`, "", {
    overwrite: true
  });

  file.addImportDeclaration({
    moduleSpecifier: "zod",
    namedImports: ["z"]
  });

  const fields = tool.parameters
    .map((param) => `${JSON.stringify(param.name)}: ${zodExpr(param)}`)
    .join(",\n");

  file.addStatements([
    `export const ${schemaName} = z.object({\n${fields}\n});`,
    `export type ${pascal}Params = z.infer<typeof ${schemaName}>;`
  ]);
}

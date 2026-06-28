import { Project } from "ts-morph";
import type { GeneratedProject, McpForgeIR } from "../ir/types.js";
import { generateIndexFile } from "./index-generator.js";
import { generateSchemaFile } from "./schema-generator.js";
import { generateToolFile } from "./tool-generator.js";
import {
  generateDockerfile,
  generateEnvExample,
  generatePackageJson,
  generateReadme,
  generateTsconfig
} from "./config-generator.js";
import { generateEnvFile, generateHttpClientFile } from "./util-generator.js";

export function generateProject(ir: McpForgeIR): GeneratedProject {
  const project = new Project({ useInMemoryFileSystem: true });

  generateIndexFile(project, ir);
  for (const tool of ir.tools) {
    generateSchemaFile(project, tool);
    generateToolFile(project, tool);
  }

  const hasHttpTools = ir.tools.some((t) => t.implementation.type === "http");

  if (hasHttpTools) {
    project.createSourceFile("src/utils/http-client.ts", generateHttpClientFile(ir), {
      overwrite: true
    });
  }

  project.createSourceFile("src/utils/env.ts", generateEnvFile(ir), { overwrite: true });

  const files: Record<string, string> = {};

  for (const sourceFile of project.getSourceFiles()) {
    files[sourceFile.getFilePath().replace(/^\//, "")] = sourceFile.getFullText();
  }

  files["package.json"] = generatePackageJson(ir);
  files["tsconfig.json"] = generateTsconfig();
  files["README.md"] = generateReadme(ir);
  files["Dockerfile"] = generateDockerfile();
  files[".env.example"] = generateEnvExample(ir);

  return { files };
}

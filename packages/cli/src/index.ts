#!/usr/bin/env node
import { Command } from "commander";
import { generateCommand } from "./commands/generate.js";
import { initCommand } from "./commands/init.js";
import { validateCommand } from "./commands/validate.js";

const program = new Command();
program.name("mcpforge").description("Generate MCP servers from YAML/JSON specs").version("0.1.0");

program
  .command("generate")
  .requiredOption("--from <path>", "Path to YAML/JSON spec")
  .option("--output <dir>", "Output directory", "./mcp-server")
  .action(async (options) => {
    await generateCommand(options);
  });

program
  .command("validate")
  .requiredOption("--from <path>", "Path to YAML/JSON spec")
  .action(async (options) => {
    await validateCommand(options);
  });

program.command("init").action(async () => {
  await initCommand();
});

program.parseAsync(process.argv).catch((error) => {
  console.error(error);
  process.exit(1);
});

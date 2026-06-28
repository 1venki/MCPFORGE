import { input, select } from "@inquirer/prompts";
import { writeFile } from "node:fs/promises";

export async function initCommand(): Promise<void> {
  const name = await input({ message: "Server name", default: "my-mcp" });
  const version = await input({ message: "Version", default: "1.0.0" });
  const toolName = await input({ message: "First tool name", default: "hello_world" });
  const method = await select({
    message: "HTTP method",
    choices: ["GET", "POST", "PUT", "PATCH", "DELETE"].map((value) => ({ value, name: value }))
  });
  const url = await input({ message: "Tool URL", default: "https://api.example.com/hello" });

  const spec = `server:\n  name: ${name}\n  version: ${version}\ntools:\n  - name: ${toolName}\n    description: Auto-generated initial tool\n    parameters: []\n    implementation:\n      method: ${method}\n      url: \"${url}\"\n`;

  await writeFile("mcpforge.yaml", spec, "utf-8");
  console.log("Created mcpforge.yaml");
}

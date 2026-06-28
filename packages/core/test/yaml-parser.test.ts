import { describe, expect, it } from "vitest";
import { parseYamlSpec } from "../src/parsers/yaml-parser.js";

describe("parseYamlSpec", () => {
  it("parses a valid spec", () => {
    const ir = parseYamlSpec(`server:\n  name: test\n  version: 1.0.0\ntools:\n  - name: ping\n    description: ping\n    parameters: []\n    implementation:\n      method: GET\n      url: \"https://example.com/ping\"\n`);

    expect(ir.server.name).toBe("test");
    expect(ir.tools).toHaveLength(1);
  });
});

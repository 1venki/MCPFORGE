"use client";

import { useState } from "react";

type ToolDraft = {
  name: string;
  description: string;
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  url: string;
};

export function ToolBuilder({ onSpecReady }: { onSpecReady: (specText: string) => void }): React.ReactElement {
  const [serverName, setServerName] = useState("my-mcp-server");
  const [version, setVersion] = useState("1.0.0");
  const [tools, setTools] = useState<ToolDraft[]>([]);
  const [draft, setDraft] = useState<ToolDraft>({
    name: "",
    description: "",
    method: "GET",
    url: ""
  });

  function addTool(): void {
    if (!draft.name || !draft.description || !draft.url) {
      return;
    }
    setTools((prev) => [...prev, draft]);
    setDraft({ name: "", description: "", method: "GET", url: "" });
  }

  function buildSpec(): void {
    const toolBlock = tools
      .map(
        (tool) => `  - name: ${tool.name}\n    description: ${tool.description}\n    parameters: []\n    implementation:\n      method: ${tool.method}\n      url: "${tool.url}"`
      )
      .join("\n\n");

    const spec = `server:\n  name: ${serverName}\n  version: ${version}\n\ntools:\n${toolBlock || "  []"}\n`;
    onSpecReady(spec);
  }

  return (
    <div className="panel grid" style={{ gap: 12 }}>
      <h3 style={{ margin: 0 }}>Interactive Builder</h3>
      <label>
        Server name
        <input value={serverName} onChange={(e) => setServerName(e.target.value)} />
      </label>
      <label>
        Version
        <input value={version} onChange={(e) => setVersion(e.target.value)} />
      </label>
      <hr style={{ borderColor: "#27272a", width: "100%" }} />
      <label>
        Tool name
        <input value={draft.name} onChange={(e) => setDraft((prev) => ({ ...prev, name: e.target.value }))} />
      </label>
      <label>
        Tool description
        <input value={draft.description} onChange={(e) => setDraft((prev) => ({ ...prev, description: e.target.value }))} />
      </label>
      <label>
        HTTP method
        <select value={draft.method} onChange={(e) => setDraft((prev) => ({ ...prev, method: e.target.value as ToolDraft["method"] }))}>
          <option>GET</option>
          <option>POST</option>
          <option>PUT</option>
          <option>PATCH</option>
          <option>DELETE</option>
        </select>
      </label>
      <label>
        URL
        <input value={draft.url} onChange={(e) => setDraft((prev) => ({ ...prev, url: e.target.value }))} />
      </label>
      <div style={{ display: "flex", gap: 8 }}>
        <button onClick={addTool}>Add tool</button>
        <button className="primary" onClick={buildSpec}>
          Use this spec
        </button>
      </div>
      {tools.length > 0 && (
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Method</th>
              <th>URL</th>
            </tr>
          </thead>
          <tbody>
            {tools.map((tool) => (
              <tr key={`${tool.name}-${tool.url}`}>
                <td>{tool.name}</td>
                <td>{tool.method}</td>
                <td>{tool.url}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

"use client";

import { useState } from "react";

function extractServerName(specText: string): string {
  const trimmed = specText.trim();
  if (trimmed.startsWith("{")) {
    try {
      const parsed = JSON.parse(trimmed);
      return parsed.server?.name || "mcp-server";
    } catch {
      return "mcp-server";
    }
  }
  const match = specText.match(/name:\s*["']?([^\s"'\n]+)/);
  return match?.[1] || "mcp-server";
}

export default function Home(): React.ReactElement {
  const [specText, setSpecText] = useState("");
  const [fileName, setFileName] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);

  const hasSpec = specText.trim().length > 0;

  function handleUpload(event: React.ChangeEvent<HTMLInputElement>): void {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setSpecText(reader.result as string);
      setFileName(file.name);
      setStatus("");
    };
    reader.readAsText(file);
  }

  function handleValidate(event: React.MouseEvent): void {
    event.preventDefault();
    event.stopPropagation();
    setLoading(true);
    setStatus("");

    fetch("/api/validate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ specText })
    })
      .then((res) => res.json())
      .then((payload: { ok: boolean; message?: string; error?: string }) => {
        if (payload.ok) {
          setStatus(payload.message ?? "Valid spec!");
        } else {
          setStatus(payload.error ?? "Validation failed");
        }
      })
      .catch(() => setStatus("Validation request failed"))
      .finally(() => setLoading(false));
  }

  function handleDownload(event: React.MouseEvent): void {
    event.preventDefault();
    event.stopPropagation();
    setLoading(true);
    setStatus("");

    fetch("/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ specText, previewOnly: false })
    })
      .then((res) => {
        if (!res.ok) {
          return res.json().then((p: { error?: string }) => {
            throw new Error(p.error || "Generation failed");
          });
        }
        return res.blob();
      })
      .then((blob) => {
        const serverName = extractServerName(specText);
        const zipName = `${serverName}.zip`;
        const blobUrl = window.URL.createObjectURL(blob as Blob);
        const link = document.createElement("a");
        link.style.display = "none";
        link.href = blobUrl;
        link.download = zipName;
        link.target = "_self";
        document.body.appendChild(link);
        setTimeout(() => {
          link.click();
          setTimeout(() => {
            document.body.removeChild(link);
            window.URL.revokeObjectURL(blobUrl);
          }, 200);
        }, 0);
        setStatus(`Downloaded ${zipName}`);
      })
      .catch((err: Error) => setStatus(err.message))
      .finally(() => setLoading(false));
  }

  return (
    <main className="page">
      <header className="hero">
        <h1>mcpforge</h1>
        <p className="subtitle">Generate MCP servers from YAML or JSON.</p>
      </header>

      <section className="card">
        <label className="uploadLabel">Upload YAML/JSON</label>
        <div className="uploadRow">
          <label htmlFor="specFile" className="btn btnOutline">
            Choose file
          </label>
          <input
            id="specFile"
            type="file"
            accept=".yaml,.yml,.json"
            onChange={handleUpload}
            hidden
          />
          <span className="fileName">{fileName || "No file chosen"}</span>
        </div>

        <div className="actions">
          <button
            type="button"
            className="btn btnOutline"
            disabled={!hasSpec || loading}
            onClick={handleValidate}
          >
            Validate
          </button>
          <button
            type="button"
            className="btn btnPrimary"
            disabled={!hasSpec || loading}
            onClick={handleDownload}
          >
            Download ZIP
          </button>
        </div>

        {status && <p className="status">{status}</p>}
      </section>
    </main>
  );
}

import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "mcpforge playground",
  description: "Generate MCP servers from YAML/JSON specs"
};

export default function RootLayout({ children }: { children: React.ReactNode }): React.ReactElement {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

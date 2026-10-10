import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";

// The link preview shown when any page is shared (WhatsApp, LinkedIn, X, Slack). Built once at build time.
export const alt = "TechJest, a software development company for growing businesses";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Literal paths, so the bundler includes just these three files.
const [serif, sans, logo] = await Promise.all([
  readFile(join(process.cwd(), "src/app/_og/source-serif-4-semibold.ttf")),
  readFile(join(process.cwd(), "src/app/_og/manrope-bold.ttf")),
  readFile(join(process.cwd(), "public/images/techjest-brand.png")),
]);

export default function OpengraphImage() {
  return new ImageResponse(
    <div
      style={{
        display: "flex",
        width: "100%",
        height: "100%",
        padding: "0 72px",
        alignItems: "center",
        background: "#1b1e4a",
        borderTop: "10px solid #d21319",
        fontFamily: "Manrope",
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", width: 620 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            color: "#afaea2",
            fontSize: 20,
            letterSpacing: 5,
            textTransform: "uppercase",
          }}
        >
          <div style={{ width: 44, height: 3, marginRight: 18, background: "#d21319" }} />
          Software development company
        </div>
        <div style={{ marginTop: 30, color: "#fff", fontFamily: "Source Serif 4", fontSize: 66, lineHeight: 1.08 }}>
          Build software that moves your business forward.
        </div>
        <div style={{ marginTop: 34, color: "#c9c8be", fontSize: 22 }}>
          Web · Mobile · AI / ML · Cloud · Design · Consulting
        </div>
      </div>
      <div style={{ display: "flex", flex: 1, justifyContent: "flex-end" }}>
        <img src={`data:image/png;base64,${logo.toString("base64")}`} width={420} height={280} alt="" />
      </div>
    </div>,
    {
      ...size,
      fonts: [
        { name: "Source Serif 4", data: serif, weight: 600, style: "normal" },
        { name: "Manrope", data: sans, weight: 700, style: "normal" },
      ],
    },
  );
}

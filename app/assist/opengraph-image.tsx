import { ImageResponse } from "next/og";

export const alt = "Lane Assist by BotLane: support that knows when to hand over.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// ImageResponse can't read CSS variables, so these mirror the tokens in globals.css.
const PAPER = "#faf8f5";
const INK = "#111111";
const INK_2 = "#5c5c5c";
const ORANGE = "#ff5b1f";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: PAPER,
          padding: 80,
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: 16,
              background: INK,
              display: "flex",
              alignItems: "center",
              padding: "0 12px",
            }}
          >
            <div
              style={{
                width: 40,
                height: 14,
                borderRadius: 7,
                background: PAPER,
                display: "flex",
                alignItems: "center",
                paddingLeft: 4,
              }}
            >
              <div style={{ width: 9, height: 9, borderRadius: 9, background: ORANGE }} />
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <span style={{ color: INK, fontSize: 36, fontWeight: 700, lineHeight: 1 }}>Lane Assist</span>
            <span style={{ color: INK_2, fontSize: 22, lineHeight: 1 }}>by BotLane</span>
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div style={{ fontSize: 88, fontWeight: 700, color: INK, lineHeight: 1, letterSpacing: -3 }}>
            Support that knows when to hand over.
          </div>
          <div style={{ fontSize: 30, color: INK_2 }}>Managed WhatsApp support for Indian online stores.</div>
        </div>
      </div>
    ),
    size,
  );
}

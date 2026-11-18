import { ImageResponse } from "next/og";

export const alt = "Vendaz — perfis, câmbio, design e produtos digitais em Angola";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const CHIPS = [
  { label: "Perfis de streaming", color: "#f43f5e" },
  { label: "Câmbio", color: "#10b981" },
  { label: "Design", color: "#8b5cf6" },
  { label: "Digitais", color: "#0ea5e9" },
];

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          gap: 36,
          background: "#0a0a0a",
          padding: "72px",
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            right: -180,
            top: -220,
            width: 700,
            height: 700,
            borderRadius: 700,
            background: "linear-gradient(135deg,#e11d48,#8b5cf6,#0ea5e9)",
            opacity: 0.35,
          }}
        />

        <div style={{ display: "flex", fontSize: 84, fontWeight: 700, color: "#ffffff" }}>
          Vendaz
        </div>

        <div
          style={{
            display: "flex",
            fontSize: 46,
            lineHeight: 1.15,
            color: "#ffffff",
            maxWidth: 780,
          }}
        >
          Perfis, câmbio e design. Resolvido em minutos.
        </div>

        <div style={{ display: "flex", gap: 16 }}>
          {CHIPS.map((chip) => (
            <div
              key={chip.label}
              style={{
                display: "flex",
                fontSize: 24,
                color: "#ffffff",
                border: `2px solid ${chip.color}`,
                borderRadius: 999,
                padding: "10px 22px",
              }}
            >
              {chip.label}
            </div>
          ))}
        </div>
      </div>
    ),
    { ...size },
  );
}

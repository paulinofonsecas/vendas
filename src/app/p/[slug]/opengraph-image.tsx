import { createClient } from "@supabase/supabase-js";
import { ImageResponse } from "next/og";

import { TYPE_META } from "@/lib/catalog";
import { TYPE_GRADIENT_CSS } from "@/lib/seo";

export const alt = "Produto na Vendaz";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

type Row = {
  name: string;
  description: string;
  price: number;
  type: "profile" | "fx" | "design" | "digital";
};

function money(value: number): string {
  return `${new Intl.NumberFormat("pt-PT").format(value)} AOA`;
}

export default async function OpengraphImage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false } },
  );

  const { data } = await supabase
    .from("catalog")
    .select("name, description, price, type")
    .eq("slug", slug)
    .maybeSingle();

  const product = (data ?? null) as Row | null;
  const name = product?.name ?? "Catálogo Vendaz";
  const type = product?.type ?? "profile";
  const theme = TYPE_META[type];
  const price =
    !product || product.type === "fx"
      ? "Taxa do dia"
      : Number(product.price) > 0
        ? money(Number(product.price))
        : "Sob consulta";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#0a0a0a",
          padding: "64px 72px",
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            right: -160,
            top: -160,
            width: 620,
            height: 620,
            borderRadius: 620,
            background: TYPE_GRADIENT_CSS[type],
            opacity: 0.35,
          }}
        />
        <div
          style={{
            position: "absolute",
            left: 0,
            bottom: 0,
            width: 1200,
            height: 12,
            background: TYPE_GRADIENT_CSS[type],
          }}
        />

        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ display: "flex", fontSize: 34, fontWeight: 700, color: "#fafafa" }}>
            Vendaz
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 22,
              color: "#fafafa",
              border: "1px solid rgba(250,250,250,0.35)",
              borderRadius: 999,
              padding: "6px 18px",
            }}
          >
            {theme.label}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 20, maxWidth: 820 }}>
          <div
            style={{
              display: "flex",
              fontSize: name.length > 42 ? 64 : 76,
              lineHeight: 1.05,
              fontWeight: 700,
              color: "#ffffff",
            }}
          >
            {name.length > 78 ? `${name.slice(0, 78)}…` : name}
          </div>
          <div style={{ display: "flex", fontSize: 30, color: "rgba(255,255,255,0.65)" }}>
            {theme.plural} · confirmação por WhatsApp
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
          <div
            style={{
              display: "flex",
              fontSize: 54,
              fontWeight: 700,
              color: "#ffffff",
              background: TYPE_GRADIENT_CSS[type],
              padding: "12px 28px",
              borderRadius: 18,
            }}
          >
            {price}
          </div>
          <div style={{ display: "flex", fontSize: 26, color: "rgba(255,255,255,0.55)" }}>
            pedido em 2 minutos · pagamento em AOA
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}

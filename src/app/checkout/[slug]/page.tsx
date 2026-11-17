import Link from "next/link";
import { notFound } from "next/navigation";

import { CheckoutForm } from "@/app/checkout/[slug]/checkout-form";
import { BottomNav } from "@/components/store/bottom-nav";
import { SiteFooter, SiteHeader } from "@/components/site-chrome";
import { getPublicSettings } from "@/lib/settings";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { CatalogRow, Json } from "@/types/database";

export const dynamic = "force-dynamic";

export default async function CheckoutPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createClient();

  const [{ data: product }, { store, payment }] = await Promise.all([
    supabase.from("catalog").select("*").eq("slug", slug).maybeSingle(),
    getPublicSettings(),
  ]);

  if (!product) notFound();

  const item = product as CatalogRow;
  const config = (item.config ?? {}) as Record<string, Json | undefined>;
  let availableStock: number | null = null;
  let fxRate: { buy: number; sell: number } | null = null;

  if (item.type === "fx") {
    const { data: rate } = await supabase
      .from("fx_rates")
      .select("buy, sell")
      .eq("base", (config.base as string) || "USD")
      .eq("quote", (config.quote as string) || "AOA")
      .eq("active", true)
      .maybeSingle();

    if (rate) fxRate = { buy: Number(rate.buy), sell: Number(rate.sell) };
  }

  if (item.type === "profile") {
    // Stock não é público: conta-se no servidor com a secret key.
    const admin = createAdminClient();
    const { count } = await admin
      .from("inventory_items")
      .select("id", { count: "exact", head: true })
      .eq("product_id", item.id)
      .eq("status", "available");
    availableStock = count ?? 0;
  }

  return (
    <>
      <SiteHeader store={store} />

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-10 pb-20 sm:pb-10">
        <Link href={`/p/${item.slug}`} className="text-muted-foreground text-sm hover:underline">
          ← {item.name}
        </Link>

        <h1 className="mt-4 text-2xl font-semibold tracking-tight">Finalizar pedido</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Preenche os dados. Confirmamos por WhatsApp e combinamos o pagamento.
        </p>

        <CheckoutForm
          product={{
            id: item.id,
            type: item.type,
            name: item.name,
            price: Number(item.price),
            config: (item.config ?? {}) as Record<string, Json | undefined>,
          }}
          availableStock={availableStock}
          fxRate={fxRate}
          transfer={payment.transfer}
          cash={payment.cash}
        />
      </main>

      <SiteFooter store={store} />
      <BottomNav whatsapp={store.whatsapp} />
    </>
  );
}

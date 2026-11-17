import Link from "next/link";
import { notFound } from "next/navigation";

import { SiteFooter, SiteHeader } from "@/components/site-chrome";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatAOA } from "@/lib/money";
import { getPublicSettings } from "@/lib/settings";
import { createClient } from "@/lib/supabase/server";
import type { CatalogRow, Json } from "@/types/database";

export const dynamic = "force-dynamic";

function highlights(product: CatalogRow): string[] {
  const config = (product.config ?? {}) as Record<string, Json | undefined>;
  const out: string[] = [];

  if (product.type === "profile") {
    if (config.duration_days) out.push(`Validade de ${config.duration_days} dias`);
    if (config.screens) out.push(`${config.screens} ecrã(s) simultâneo(s)`);
    if (config.warranty_days) out.push(`Garantia de substituição: ${config.warranty_days} dias`);
  }
  if (product.type === "fx") {
    if (config.base) out.push(`Par ${config.base as string} → ${config.quote as string}`);
    if (config.min_amount) out.push(`Montante mínimo: ${config.min_amount} ${config.base}`);
    out.push("Cotação fixada no momento do pedido");
  }
  if (product.type === "design") {
    if (config.delivery_hours) out.push(`Entrega em até ${config.delivery_hours}h após confirmação`);
    if (config.revisions) out.push(`${config.revisions} revisões incluídas`);
  }
  if (product.type === "digital") {
    out.push("Acesso enviado após confirmação do pagamento");
  }

  return out;
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createClient();

  const [{ data: product }, { store, payment }] = await Promise.all([
    supabase.from("catalog").select("*").eq("slug", slug).maybeSingle(),
    getPublicSettings(),
  ]);

  if (!product) notFound();

  const item = product as CatalogRow;
  const bullets = highlights(item);

  return (
    <>
      <SiteHeader store={store} />

      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-12">
        <Link href="/" className="text-muted-foreground text-sm hover:underline">
          ← Voltar ao catálogo
        </Link>

        <div className="mt-6 grid gap-8 lg:grid-cols-[1.4fr_1fr]">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">{item.name}</h1>
            <p className="text-muted-foreground mt-3">{item.description}</p>

            {bullets.length > 0 ? (
              <ul className="mt-6 space-y-2 text-sm">
                {bullets.map((bullet) => (
                  <li key={bullet} className="flex gap-2">
                    <span aria-hidden className="text-muted-foreground">
                      •
                    </span>
                    <span>{bullet}</span>
                  </li>
                ))}
              </ul>
            ) : null}

            <div className="text-muted-foreground mt-8 space-y-2 text-sm">
              <p>
                Pagamento por transferência bancária ou em dinheiro.{" "}
                {payment.transfer.iban ? "Os dados de transferência aparecem no checkout." : ""}
              </p>
              {store.hours ? <p>Atendimento: {store.hours}</p> : null}
            </div>
          </div>

          <Card className="h-fit">
            <CardContent className="space-y-4 pt-6">
              <div>
                <p className="text-muted-foreground text-sm">Preço</p>
                <p className="text-2xl font-semibold">
                  {item.type === "fx" ? "Calculado no checkout" : formatAOA(item.price)}
                </p>
              </div>
              <Link
                href={`/checkout/${item.slug}`}
                className={buttonVariants({ size: "lg", className: "w-full" })}
              >
                Continuar
              </Link>              <p className="text-muted-foreground text-xs">
                Não é preciso criar conta. Basta o teu nome e WhatsApp.
              </p>
            </CardContent>
          </Card>
        </div>
      </main>

      <SiteFooter store={store} />
    </>
  );
}

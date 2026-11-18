import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ArrowLeftRight, Check, FileDown, Palette, Play, ShieldCheck } from "lucide-react";

import { BottomNav } from "@/components/store/bottom-nav";
import { ProductCard } from "@/components/store/product-card";
import { ViewTracker } from "@/components/store/view-tracker";
import { Shelf } from "@/components/store/shelf";
import { SiteFooter, SiteHeader } from "@/components/site-chrome";
import { buttonVariants } from "@/components/ui/button";
import { TYPE_META, discountPercent, productMeta } from "@/lib/catalog";
import { formatAOA } from "@/lib/money";
import { getPublicSettings } from "@/lib/settings";
import { getTopProductId } from "@/lib/stats";
import { createClient } from "@/lib/supabase/server";
import type { CatalogRow, Json, ProductType } from "@/types/database";

export const dynamic = "force-dynamic";

const ICONS: Record<ProductType, typeof Play> = {
  profile: Play,
  fx: ArrowLeftRight,
  design: Palette,
  digital: FileDown,
};

function highlights(product: CatalogRow): string[] {
  const config = (product.config ?? {}) as Record<string, Json | undefined>;
  const out: string[] = [];

  if (product.type === "profile") {
    if (config.duration_days) out.push(`Validade de ${config.duration_days} dias`);
    if (config.screens) out.push(`${config.screens} ecrã(s) simultâneo(s)`);
    if (config.warranty_days) out.push(`Substituição garantida durante ${config.warranty_days} dias`);
  }
  if (product.type === "fx") {
    if (config.base) out.push(`Par ${config.base as string} → ${config.quote as string}`);
    if (config.min_amount) out.push(`Montante mínimo: ${config.min_amount} ${config.base}`);
    out.push("Cotação fixada no momento do pedido");
  }
  if (product.type === "design") {
    if (config.delivery_hours) out.push(`Entrega em até ${config.delivery_hours}h após o briefing`);
    if (config.revisions) out.push(`${config.revisions} revisões incluídas`);
  }
  if (product.type === "digital") {
    out.push("Acesso enviado após confirmação do pagamento");
  }

  out.push("Confirmação por WhatsApp");
  return out;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createClient();
  const { data } = await supabase.from("catalog").select("name, description").eq("slug", slug).maybeSingle();
  return data
    ? { title: data.name, description: data.description }
    : { title: "Produto não encontrado" };
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createClient();

  const [{ data: product }, { store }, topId] = await Promise.all([
    supabase.from("catalog").select("*").eq("slug", slug).maybeSingle(),
    getPublicSettings(),
    getTopProductId(),
  ]);

  if (!product) notFound();

  const item = product as CatalogRow;
  const theme = TYPE_META[item.type];
  const Icon = ICONS[item.type];
  const hot = topId === item.id;
  const discount = discountPercent(item);

  const { data: relatedData } = await supabase
    .from("catalog")
    .select("*")
    .eq("type", item.type)
    .neq("id", item.id)
    .limit(8);

  const related = (relatedData ?? []) as CatalogRow[];
  const bullets = highlights(item);

  return (
    <>
      <SiteHeader store={store} />

      <main className="flex-1 pb-20 sm:pb-0">
        <ViewTracker productId={item.id} />
        <div className="mx-auto w-full max-w-7xl px-4 py-5 sm:px-6 sm:py-8">
          <nav className="text-muted-foreground mb-4 flex items-center gap-1.5 text-xs">
            <Link href="/" className="hover:underline">
              Início
            </Link>
            <span aria-hidden>/</span>
            <Link href={`/categoria/${item.type}`} className="hover:underline">
              {theme.plural}
            </Link>
            <span aria-hidden>/</span>
            <span className="text-foreground line-clamp-1">{item.name}</span>
          </nav>

          <div className="grid gap-6 lg:grid-cols-[1.55fr_1fr] lg:gap-10">
            <div>
              <div
                className={`relative aspect-[16/10] overflow-hidden rounded-xl bg-gradient-to-br ${theme.gradient}`}
              >
                <div
                  aria-hidden
                  className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.35),transparent_55%)]"
                />
                <Icon
                  aria-hidden
                  className="absolute inset-0 m-auto size-16 text-white/90 drop-shadow sm:size-24"
                  strokeWidth={1.2}
                />
                <span className="absolute top-3 left-3 rounded-md bg-white/20 px-2 py-1 text-[10px] font-bold tracking-wide text-white uppercase backdrop-blur-sm">
                  {theme.label}
                </span>
              </div>

              <h1 className="mt-5 text-3xl font-bold tracking-tight sm:text-4xl">
                {item.name}
                {hot ? <span title="Serviço mais acessado"> 🔥</span> : null}
              </h1>

              <div className="mt-2 flex flex-wrap items-center gap-2">
                <p className="text-muted-foreground text-sm">{productMeta(item)}</p>
                {hot ? (
                  <span className="rounded-md bg-orange-500 px-2 py-0.5 text-[10px] font-bold text-white">
                    Mais acessado
                  </span>
                ) : null}
                {discount ? (
                  <span className="rounded-md bg-rose-500 px-2 py-0.5 text-[10px] font-bold text-white">
                    -{discount}%
                  </span>
                ) : null}
              </div>

              <p className="mt-4 text-sm leading-relaxed sm:text-base">{item.description}</p>

              <ul className="mt-6 space-y-2.5">
                {bullets.map((bullet) => (
                  <li key={bullet} className="flex items-start gap-2 text-sm">
                    <Check className="text-primary mt-0.5 size-4 shrink-0" strokeWidth={2.5} />
                    <span>{bullet}</span>
                  </li>
                ))}
              </ul>

              <div className="border-border mt-8 flex items-start gap-3 rounded-lg border p-4">
                <ShieldCheck className="text-muted-foreground mt-0.5 size-5 shrink-0" />
                <p className="text-muted-foreground text-xs leading-relaxed">
                  Pagamento por transferência ou em dinheiro. Pedido criado em 2 minutos, sem conta
                  nem registo.
                </p>
              </div>
            </div>

            <div className="lg:sticky lg:top-32 lg:h-fit">
              <div className="border-border bg-card rounded-xl border p-5">
                <p className="text-muted-foreground text-xs">Preço</p>
                <p className="mt-0.5 flex items-baseline gap-2">
                  <span className="text-3xl font-semibold tracking-tight">
                    {item.type === "fx" ? "Calculado no checkout" : formatAOA(item.price)}
                  </span>
                  {discount ? (
                    <span className="text-muted-foreground text-sm line-through">
                      {formatAOA(item.compare_at_price)}
                    </span>
                  ) : null}
                </p>
                {discount ? (
                  <p className="mt-1 text-xs font-medium text-rose-400">
                    Poupes {formatAOA(Number(item.compare_at_price) - Number(item.price))} nesta
                    compra
                  </p>
                ) : null}

                <Link
                  href={`/checkout/${item.slug}`}
                  className={buttonVariants({ size: "lg", className: "mt-5 w-full" })}
                >
                  Pedir agora
                </Link>

                <ul className="text-muted-foreground mt-4 space-y-1.5 text-xs">
                  <li>• Sem criação de conta</li>
                  <li>• Confirmação por WhatsApp</li>
                  <li>• Dados de pagamento no checkout</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {related.length > 0 ? (
          <Shelf
            title={`Mais em ${theme.plural}`}
            href={`/categoria/${item.type}`}
          >
            {related.map((other) => (
              <ProductCard key={other.id} product={other} hot={other.id === topId} />
            ))}
          </Shelf>
        ) : null}
      </main>

      <div className="border-border bg-background/95 fixed inset-x-0 bottom-0 z-30 border-t p-3 backdrop-blur sm:hidden">
        <div className="flex items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-muted-foreground truncate text-[10px]">Preço</p>
            <p className="truncate text-sm font-semibold">
              {item.type === "fx" ? "Calculado no checkout" : formatAOA(item.price)}
            </p>
          </div>
          <Link
            href={`/checkout/${item.slug}`}
            className={buttonVariants({ size: "lg", className: "shrink-0" })}
          >
            Pedir agora
          </Link>
        </div>
      </div>

      <SiteFooter store={store} />
      <BottomNav whatsapp={store.whatsapp} />
    </>
  );
}

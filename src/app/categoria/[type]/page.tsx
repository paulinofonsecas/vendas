import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

import { BottomNav } from "@/components/store/bottom-nav";
import { ProductCard } from "@/components/store/product-card";
import { SiteFooter, SiteHeader } from "@/components/site-chrome";
import { TYPE_META, TYPE_ORDER } from "@/lib/catalog";
import { getPublicSettings } from "@/lib/settings";
import { getTopProductId } from "@/lib/stats";
import { createClient } from "@/lib/supabase/server";
import type { CatalogRow, ProductType } from "@/types/database";

export const dynamic = "force-dynamic";

function isType(value: string): value is ProductType {
  return (TYPE_ORDER as string[]).includes(value);
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ type: string }>;
}): Promise<Metadata> {
  const { type } = await params;
  if (!isType(type)) return { title: "Categoria" };
  return { title: TYPE_META[type].plural };
}

export default async function CategoryPage({ params }: { params: Promise<{ type: string }> }) {
  const { type } = await params;
  if (!isType(type)) notFound();

  const supabase = await createClient();
  const [{ data: products }, { store }, topId] = await Promise.all([
    supabase
      .from("catalog")
      .select("*")
      .eq("type", type)
      .order("sort", { ascending: true }),
    getPublicSettings(),
    getTopProductId(),
  ]);

  const items = (products ?? []) as CatalogRow[];
  const theme = TYPE_META[type];

  return (
    <>
      <SiteHeader store={store} />

      <main className="flex-1 pb-16 sm:pb-0">
        <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6">
          <nav className="text-muted-foreground mb-3 flex items-center gap-1.5 text-xs">
            <Link href="/" className="hover:underline">
              Início
            </Link>
            <span aria-hidden>/</span>
            <span className="text-foreground">{theme.plural}</span>
          </nav>

          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{theme.plural}</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            {items.length === 0
              ? "Sem produtos nesta categoria por agora."
              : `${items.length} ${items.length === 1 ? "opção" : "opções"} · pagamento em AOA`}
          </p>

          <div className="mt-6 grid grid-cols-2 gap-x-3 gap-y-6 sm:grid-cols-3 lg:grid-cols-4">
            {items.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                variant="grid"
                hot={product.id === topId}
              />
            ))}
          </div>

          <div className="mt-12 flex flex-wrap gap-2">
            {TYPE_ORDER.filter((other) => other !== type).map((other) => (
              <Link
                key={other}
                href={`/categoria/${other}`}
                className="border-border hover:bg-muted rounded-full border px-3 py-1.5 text-xs font-medium"
              >
                {TYPE_META[other].plural}
              </Link>
            ))}
          </div>
        </div>
      </main>

      <SiteFooter store={store} />
      <BottomNav whatsapp={store.whatsapp} />
    </>
  );
}

import Link from "next/link";
import { Search } from "lucide-react";

import { BottomNav } from "@/components/store/bottom-nav";
import { ProductCard } from "@/components/store/product-card";
import { SiteFooter, SiteHeader } from "@/components/site-chrome";
import { TYPE_META, TYPE_ORDER } from "@/lib/catalog";
import { getPublicSettings } from "@/lib/settings";
import { getTopProductId } from "@/lib/stats";
import { createClient } from "@/lib/supabase/server";
import type { CatalogRow } from "@/types/database";

export const dynamic = "force-dynamic";

export const metadata = { title: "Pesquisar" };

function sanitize(term: string): string {
  return term.replace(/[,()%\\]/g, " ").trim().slice(0, 60);
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const term = sanitize(q ?? "");

  const supabase = await createClient();
  const [{ store }, topId] = await Promise.all([getPublicSettings(), getTopProductId()]);

  let query = supabase.from("catalog").select("*").order("sort", { ascending: true });
  if (term) {
    query = query.or(`name.ilike.%${term}%,description.ilike.%${term}%`);
  }

  const { data } = await query;
  const items = (data ?? []) as CatalogRow[];

  return (
    <>
      <SiteHeader store={store} />

      <main className="flex-1 pb-16 sm:pb-0">
        <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6">
          <form action="/pesquisa" className="relative">
            <Search
              aria-hidden
              className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2"
            />
            <input
              name="q"
              type="search"
              defaultValue={term}
              autoFocus
              placeholder="Perfis, câmbio, flyers…"
              aria-label="Pesquisar"
              className="border-border bg-muted/50 focus:bg-background w-full rounded-full border py-2.5 pr-3 pl-9 text-sm outline-none"
            />
          </form>

          <p className="text-muted-foreground mt-4 text-sm">
            {term
              ? `${items.length} ${items.length === 1 ? "resultado" : "resultados"} para “${term}”`
              : "Escreve o que procuras, ou escolhe uma categoria."}
          </p>

          {items.length > 0 ? (
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
          ) : term ? (
            <div className="border-border mt-6 rounded-xl border border-dashed p-10 text-center">
              <p className="text-sm font-medium">Sem resultados</p>
              <p className="text-muted-foreground mt-1 text-sm">
                Tenta outra palavra ou fala connosco no WhatsApp.
              </p>
            </div>
          ) : null}

          <div className="mt-10 flex flex-wrap gap-2">
            {TYPE_ORDER.map((type) => (
              <Link
                key={type}
                href={`/categoria/${type}`}
                className="border-border hover:bg-muted rounded-full border px-3 py-1.5 text-xs font-medium"
              >
                {TYPE_META[type].plural}
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

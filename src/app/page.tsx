import Link from "next/link";

import { SiteFooter, SiteHeader } from "@/components/site-chrome";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatAOA, whatsappLink } from "@/lib/money";
import { getPublicSettings } from "@/lib/settings";
import { createClient } from "@/lib/supabase/server";
import type { CatalogRow, ProductType } from "@/types/database";

export const dynamic = "force-dynamic";

const GROUPS: Record<ProductType, { title: string; description: string }> = {
  profile: {
    title: "Perfis de streaming",
    description: "Netflix e outros serviços, com garantia de substituição.",
  },
  fx: { title: "Câmbio", description: "Compra e venda de divisas com taxa actualizada." },
  design: { title: "Design", description: "Flyers e artes para redes sociais." },
  digital: { title: "Produtos digitais", description: "Guias e materiais com entrega imediata." },
};

const ORDER: ProductType[] = ["profile", "fx", "design", "digital"];

function priceLabel(product: CatalogRow): string {
  if (product.type === "fx") return "Taxa do dia";
  if (product.price === 0) return "Sob consulta";
  return formatAOA(product.price);
}

export default async function HomePage() {
  const supabase = await createClient();
  const [{ data: products }, { store }] = await Promise.all([
    supabase.from("catalog").select("*").order("sort", { ascending: true }),
    getPublicSettings(),
  ]);

  const catalog = (products ?? []) as CatalogRow[];
  const wa = store.whatsapp
    ? whatsappLink(store.whatsapp, "Olá! Quero fazer um pedido.")
    : null;

  return (
    <>
      <SiteHeader store={store} />

      <main className="flex-1">
        <section className="border-border/60 border-b">
          <div className="mx-auto w-full max-w-6xl px-4 py-16 sm:py-24">
            <p className="text-muted-foreground mb-4 text-sm font-medium tracking-wide uppercase">
              {store.name}
            </p>
            <h1 className="max-w-2xl text-4xl leading-tight font-semibold tracking-tight sm:text-5xl">
              Perfis, câmbio e design. Resolvido em minutos.
            </h1>
            <p className="text-muted-foreground mt-4 max-w-xl text-lg">
              Escolhe o serviço, deixa o teu WhatsApp e paga por transferência ou em dinheiro.
              Confirmamos tudo por WhatsApp.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="#catalogo" className={buttonVariants({ size: "lg" })}>
                Ver catálogo
              </Link>
              {wa ? (
                <a
                  href={wa}
                  target="_blank"
                  rel="noreferrer"
                  className={buttonVariants({ size: "lg", variant: "outline" })}
                >
                  Falar no WhatsApp
                </a>
              ) : null}
            </div>
          </div>
        </section>

        <section id="catalogo" className="mx-auto w-full max-w-6xl px-4 py-14">
          <div className="space-y-14">
            {ORDER.map((type) => {
              const items = catalog.filter((product) => product.type === type);
              if (items.length === 0) return null;

              return (
                <div key={type} className="space-y-5">
                  <div className="flex items-end justify-between gap-4">
                    <div>
                      <h2 className="text-xl font-semibold tracking-tight">{GROUPS[type].title}</h2>
                      <p className="text-muted-foreground text-sm">{GROUPS[type].description}</p>
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {items.map((product) => (
                      <Card key={product.id} className="flex flex-col">
                        <CardHeader>
                          <CardTitle className="text-base">{product.name}</CardTitle>
                        </CardHeader>
                        <CardContent className="flex flex-1 flex-col justify-between gap-4">
                          <p className="text-muted-foreground text-sm">{product.description}</p>
                          <div className="flex items-center justify-between gap-3">
                            <span className="font-semibold">{priceLabel(product)}</span>
                            <Link
                              href={`/p/${product.slug}`}
                              className={buttonVariants({ size: "sm" })}
                            >
                              Pedir
                            </Link>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              );
            })}

            {catalog.length === 0 ? (
              <p className="text-muted-foreground">
                Ainda não há produtos publicados. Volta em breve.
              </p>
            ) : null}
          </div>
        </section>
      </main>

      <SiteFooter store={store} />
    </>
  );
}

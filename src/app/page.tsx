import Link from "next/link";
import { MessageCircle, ShieldCheck, Timer, Wallet } from "lucide-react";

import { ProductCard } from "@/components/store/product-card";
import { BottomNav } from "@/components/store/bottom-nav";
import { Faq } from "@/components/store/faq";
import { HeroCarousel, type Banner } from "@/components/store/hero-carousel";
import { Shelf } from "@/components/store/shelf";
import { SiteFooter, SiteHeader } from "@/components/site-chrome";
import { formatAOA, whatsappLink } from "@/lib/money";
import { TYPE_META, TYPE_ORDER } from "@/lib/catalog";
import { getPublicSettings } from "@/lib/settings";
import { createClient } from "@/lib/supabase/server";
import type { CatalogRow, ProductType } from "@/types/database";

export const dynamic = "force-dynamic";

const TRUST = [
  { icon: Wallet, label: "Pagamento local em AOA" },
  { icon: MessageCircle, label: "Confirmação por WhatsApp" },
  { icon: ShieldCheck, label: "Garantia de substituição" },
  { icon: Timer, label: "Entrega no mesmo dia" },
];

function buildBanners(catalog: CatalogRow[], rate: { sell: number } | null): Banner[] {
  const first = (type: ProductType) => catalog.find((product) => product.type === type);

  const banners: Banner[] = [];

  const profile = first("profile");
  if (profile) {
    banners.push({
      badge: "Mais procurado",
      title: `Perfis de streaming a partir de ${formatAOA(profile.price)}`,
      subtitle: "Netflix e outros serviços com garantia de substituição durante o período.",
      cta: "Ver perfis",
      href: "/categoria/profile",
    });
  }

  const fx = first("fx");
  if (fx) {
    banners.push({
      badge: "Câmbio do dia",
      title: rate ? `1 USD = ${rate.sell.toLocaleString("pt-PT")} AOA` : "Compra e venda de divisas",
      subtitle: "Cotação fixada no momento do pedido, sem surpresas depois.",
      cta: "Ver cotação",
      href: `/p/${fx.slug}`,
    });
  }

  const design = first("design") ?? first("digital");
  if (design) {
    banners.push({
      badge: "Serviço rápido",
      title: design.name,
      subtitle: "Escolhe, deixa o WhatsApp e recebe a confirmação em minutos.",
      cta: "Ver serviço",
      href: `/p/${design.slug}`,
    });
  }

  return banners;
}

export default async function HomePage() {
  const supabase = await createClient();

  const [{ data: products }, { data: rates }, { store }] = await Promise.all([
    supabase.from("catalog").select("*").order("sort", { ascending: true }),
    supabase.from("fx_rates").select("base, quote, sell").eq("active", true),
    getPublicSettings(),
  ]);

  const catalog = (products ?? []) as CatalogRow[];
  const usd = (rates ?? []).find((rate) => rate.base === "USD" && rate.quote === "AOA");
  const banners = buildBanners(catalog, usd ? { sell: Number(usd.sell) } : null);

  const palette = catalog.length
    ? catalog.map((product) => TYPE_META[product.type].gradient)
    : TYPE_ORDER.map((type) => TYPE_META[type].gradient);

  const tiles = Array.from({ length: 48 }, (_, i) => palette[i % palette.length]!);

  return (
    <>
      <SiteHeader store={store} />

      <main className="flex-1 pb-16 sm:pb-0">
        <HeroCarousel banners={banners} tiles={tiles} />

        <div id="catalogo" className="pt-2">
          {TYPE_ORDER.map((type) => {
            const items = catalog.filter((product) => product.type === type);
            if (items.length === 0) return null;

            return (
              <Shelf
                key={type}
                title={TYPE_META[type].plural}
                subtitle={
                  items.length === 1 ? "1 opção disponível" : `${items.length} opções disponíveis`
                }
                href={`/categoria/${type}`}
              >
                {items.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </Shelf>
            );
          })}
        </div>

        {catalog.length === 0 ? (
          <p className="text-muted-foreground mx-auto max-w-7xl px-4 py-16">
            Ainda não há produtos publicados.
          </p>
        ) : null}

        <section className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="border-border/60 mt-6 flex flex-wrap items-center justify-center gap-x-8 gap-y-4 border-y py-6 opacity-70">
            {TRUST.map(({ icon: Icon, label }) => (
              <span key={label} className="flex items-center gap-2 text-xs sm:text-sm">
                <Icon className="size-4" strokeWidth={1.8} />
                {label}
              </span>
            ))}
          </div>
        </section>

        <Faq />

        <section className="mx-auto max-w-7xl px-4 pb-12 sm:px-6">
          <div className="from-primary/10 to-background rounded-xl bg-gradient-to-br p-6 text-center sm:p-10">
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
              Não encontras o que procuras?
            </h2>
            <p className="text-muted-foreground mx-auto mt-2 max-w-md text-sm">
              Diz-nos o que precisas no WhatsApp e montamos a solução.
            </p>
            <Link
              href={
                store.whatsapp
                  ? whatsappLink(store.whatsapp, "Olá! Preciso de um serviço que não está no site.")
                  : "/pesquisa"
              }
              className="text-foreground mt-4 inline-block text-sm font-medium underline underline-offset-4"
            >
              Falar com a equipa
            </Link>
          </div>
        </section>
      </main>

      <SiteFooter store={store} />
      <BottomNav whatsapp={store.whatsapp} />
    </>
  );
}

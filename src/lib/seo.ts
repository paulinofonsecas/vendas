import type { CatalogRow } from "@/types/database";
import { TYPE_META } from "@/lib/catalog";
import { absoluteUrl } from "@/lib/site";

/** Gradiente por tipo em CSS puro — o Satori não entende classes do Tailwind. */
export const TYPE_GRADIENT_CSS: Record<CatalogRow["type"], string> = {
  profile: "linear-gradient(135deg, #e11d48 0%, #f43f5e 45%, #fb923c 100%)",
  fx: "linear-gradient(135deg, #047857 0%, #10b981 50%, #a3e635 100%)",
  design: "linear-gradient(135deg, #6d28d9 0%, #8b5cf6 50%, #e879f9 100%)",
  digital: "linear-gradient(135deg, #0369a1 0%, #0ea5e9 50%, #22d3ee 100%)",
};

export function ogImageUrl(slug: string): string {
  return absoluteUrl(`/p/${slug}/opengraph-image`);
}

/** Dados estruturados para o Google (rich results). */
export function productJsonLd(product: CatalogRow, url: string) {
  const brand = "Vendaz";

  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description || `${product.name} · ${TYPE_META[product.type].plural}`,
    image: [ogImageUrl(product.slug)],
    url,
    brand: { "@type": "Brand", name: brand },
    category: TYPE_META[product.type].plural,
    ...(Number(product.price) > 0
      ? {
          offers: {
            "@type": "Offer",
            url,
            priceCurrency: product.currency || "AOA",
            price: Number(product.price).toFixed(2),
            availability: "https://schema.org/InStock",
            seller: { "@type": "Organization", name: brand },
          },
        }
      : {}),
  };
}

export function shareText(product: CatalogRow, priceLabel: string): string {
  return `${product.name} — ${priceLabel} na Vendaz`;
}

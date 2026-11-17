import type { CatalogRow, Json, ProductType } from "@/types/database";

export const TYPE_META: Record<
  ProductType,
  { label: string; plural: string; gradient: string; accent: string }
> = {
  profile: {
    label: "Perfil",
    plural: "Perfis de streaming",
    gradient: "from-rose-600 via-rose-500 to-orange-400",
    accent: "text-rose-600",
  },
  fx: {
    label: "Câmbio",
    plural: "Câmbio",
    gradient: "from-emerald-700 via-emerald-500 to-lime-400",
    accent: "text-emerald-600",
  },
  design: {
    label: "Design",
    plural: "Design gráfico",
    gradient: "from-violet-700 via-violet-500 to-fuchsia-400",
    accent: "text-violet-600",
  },
  digital: {
    label: "Digital",
    plural: "Produtos digitais",
    gradient: "from-sky-700 via-sky-500 to-cyan-400",
    accent: "text-sky-600",
  },
};

export const TYPE_ORDER: ProductType[] = ["profile", "fx", "design", "digital"];

function config(product: CatalogRow): Record<string, Json | undefined> {
  const value = product.config;
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, Json | undefined>)
    : {};
}

/** Linha de meta do cartão, derivada do tipo — equivalente ao "autor · rating" deles. */
export function productMeta(product: CatalogRow): string {
  const cfg = config(product);

  switch (product.type) {
    case "profile": {
      const days = cfg.duration_days as number | undefined;
      const screens = cfg.screens as number | undefined;
      return [days ? `${days} dias` : null, screens ? `${screens} ecrã(s)` : null]
        .filter(Boolean)
        .join(" · ");
    }
    case "fx": {
      const base = (cfg.base as string) ?? "USD";
      const quote = (cfg.quote as string) ?? "AOA";
      return `${base} → ${quote} · taxa do dia`;
    }
    case "design": {
      const hours = cfg.delivery_hours as number | undefined;
      return hours ? `entrega em ${hours}h` : "entrega digital";
    }
    case "digital":
      return "acesso imediato";
    default:
      return "";
  }
}

export function productBadge(product: CatalogRow): string | null {
  const cfg = config(product);
  if (product.type === "profile" && cfg.warranty_days) {
    return `Garantia ${cfg.warranty_days}d`;
  }
  if (product.type === "fx" && cfg.min_amount) {
    return `Mín. ${cfg.min_amount}`;
  }
  if (product.type === "design" && cfg.revisions) {
    return `${cfg.revisions} revisões`;
  }
  return null;
}

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

/** Linha de meta do cartão, derivada do tipo. */
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

/** Desconto em percentagem, quando existe preço anterior. */
export function discountPercent(product: CatalogRow): number | null {
  const before = Number(product.compare_at_price ?? 0);
  const now = Number(product.price ?? 0);
  if (!before || before <= now || now <= 0) return null;
  return Math.round(((before - now) / before) * 100);
}

function isFresh(product: CatalogRow, days = 7): boolean {
  const created = new Date(product.created_at).getTime();
  if (!Number.isFinite(created)) return false;
  return Date.now() - created < days * 86_400_000;
}

export type AlertTone = "sale" | "hot" | "urgent" | "new" | "info";

export type ProductAlert = { label: string; tone: AlertTone };

/**
 * Etiqueta de alerta do cartão, por prioridade:
 * desconto → mais acessado → últimas unidades → novidade → detalhe do tipo.
 */
export function productAlert(
  product: CatalogRow,
  options: { hot?: boolean; stock?: number | null } = {},
): ProductAlert | null {
  const discount = discountPercent(product);
  if (discount) return { label: `-${discount}%`, tone: "sale" };

  if (options.hot) return { label: "🔥 Mais acessado", tone: "hot" };

  if (typeof options.stock === "number" && options.stock > 0 && options.stock <= 3) {
    return { label: `Últimas ${options.stock}`, tone: "urgent" };
  }

  if (isFresh(product)) return { label: "Novo", tone: "new" };

  const cfg = config(product);
  if (product.type === "profile" && cfg.warranty_days) {
    return { label: `Garantia ${cfg.warranty_days}d`, tone: "info" };
  }
  if (product.type === "design" && cfg.revisions) {
    return { label: `${cfg.revisions} revisões`, tone: "info" };
  }
  if (product.type === "fx" && cfg.min_amount) {
    return { label: `Mín. ${cfg.min_amount}`, tone: "info" };
  }
  if (product.type === "digital") {
    return { label: "Acesso imediato", tone: "info" };
  }

  return null;
}

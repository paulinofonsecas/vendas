import Link from "next/link";
import { ArrowLeftRight, FileDown, Palette, Play } from "lucide-react";

import { formatAOA, toNumber } from "@/lib/money";
import {
  TYPE_META,
  discountPercent,
  productAlert,
  productMeta,
  type AlertTone,
} from "@/lib/catalog";
import type { CatalogRow, ProductType } from "@/types/database";

const ICONS: Record<ProductType, typeof Play> = {
  profile: Play,
  fx: ArrowLeftRight,
  design: Palette,
  digital: FileDown,
};

const TONE: Record<AlertTone, string> = {
  sale: "bg-rose-500 text-white",
  hot: "bg-orange-500 text-white",
  urgent: "bg-amber-400 text-black",
  new: "bg-emerald-500 text-white",
  info: "bg-black/55 text-white backdrop-blur-sm",
};

export function ProductCard({
  product,
  variant = "shelf",
  hot = false,
  stock,
}: {
  product: CatalogRow;
  variant?: "shelf" | "grid";
  hot?: boolean;
  stock?: number | null;
}) {
  const theme = TYPE_META[product.type];
  const Icon = ICONS[product.type];
  const alert = productAlert(product, { hot, stock });
  const discount = discountPercent(product);
  const meta = productMeta(product);

  const priceLabel = product.type === "fx" ? "Taxa do dia" : formatAOA(toNumber(product.price));

  return (
    <Link
      href={`/p/${product.slug}`}
      className={
        variant === "shelf"
          ? "group block w-[170px] shrink-0 snap-start sm:w-[200px]"
          : "group block w-full"
      }
    >
      <div
        className={`relative aspect-[4/3] overflow-hidden rounded-lg bg-gradient-to-br ${theme.gradient}`}
      >
        <div
          aria-hidden
          className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.35),transparent_55%)]"
        />
        <Icon
          aria-hidden
          className="absolute inset-0 m-auto size-10 text-white/90 drop-shadow-sm sm:size-12"
          strokeWidth={1.5}
        />

        {alert ? (
          <span
            className={`absolute top-2 left-2 rounded-md px-2 py-0.5 text-[10px] font-bold ${TONE[alert.tone]}`}
          >
            {alert.label}
          </span>
        ) : null}

        <span className="absolute right-2 bottom-2 rounded bg-black/25 px-1.5 py-0.5 text-[10px] font-medium text-white backdrop-blur-sm">
          {theme.label}
        </span>
      </div>

      <p className="group-hover:text-primary mt-3 line-clamp-1 text-[15px] leading-snug font-semibold">
        {product.name}
        {hot ? <span title="Mais acessado"> 🔥</span> : null}
      </p>
      <p className="text-muted-foreground mt-1 line-clamp-1 text-xs">{meta}</p>

      <p className="mt-2 flex items-baseline gap-1.5">
        <span className="text-[15px] font-bold">{priceLabel}</span>
        {discount ? (
          <span className="text-muted-foreground text-xs line-through">
            {formatAOA(product.compare_at_price)}
          </span>
        ) : null}
      </p>
    </Link>
  );
}

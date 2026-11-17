import Link from "next/link";
import { ArrowLeftRight, FileDown, Palette, Play } from "lucide-react";

import { formatAOA, toNumber } from "@/lib/money";
import { TYPE_META, productBadge, productMeta } from "@/lib/catalog";
import type { CatalogRow, ProductType } from "@/types/database";

const ICONS: Record<ProductType, typeof Play> = {
  profile: Play,
  fx: ArrowLeftRight,
  design: Palette,
  digital: FileDown,
};

export function ProductCard({
  product,
  variant = "shelf",
}: {
  product: CatalogRow;
  variant?: "shelf" | "grid";
}) {
  const theme = TYPE_META[product.type];
  const Icon = ICONS[product.type];
  const badge = productBadge(product);
  const price = product.type === "fx" ? "Taxa do dia" : formatAOA(toNumber(product.price));
  const meta = productMeta(product);

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

        {badge ? (
          <span className="bg-primary text-primary-foreground absolute top-2 left-2 rounded-md px-2 py-0.5 text-[10px] font-bold">
            {badge}
          </span>
        ) : null}

        <span className="absolute right-2 bottom-2 rounded bg-black/25 px-1.5 py-0.5 text-[10px] font-medium text-white backdrop-blur-sm">
          {theme.label}
        </span>
      </div>

      <p className="group-hover:text-primary mt-3 line-clamp-1 text-sm leading-tight font-semibold">
        {product.name}
      </p>
      <p className="text-muted-foreground mt-0.5 line-clamp-1 text-xs">{meta}</p>
      <p className="mt-1.5 text-sm font-semibold">{price}</p>
    </Link>
  );
}

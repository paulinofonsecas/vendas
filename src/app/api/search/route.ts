import { NextResponse } from "next/server";

import { TYPE_META, TYPE_ORDER, discountPercent } from "@/lib/catalog";
import { createClient } from "@/lib/supabase/server";
import type { CatalogRow, ProductType } from "@/types/database";

export type Suggestion = {
  slug: string;
  name: string;
  type: ProductType;
  typeLabel: string;
  price: number;
  compareAt: number | null;
  meta: string;
};

export type SuggestionResponse = {
  products: Suggestion[];
  categories: { type: ProductType; label: string; count: number }[];
};

const EMPTY: SuggestionResponse = { products: [], categories: [] };

function sanitize(term: string): string {
  return term.replace(/[,()%\\*]/g, " ").trim().slice(0, 60);
}

function normalize(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

export async function GET(request: Request) {
  const raw = new URL(request.url).searchParams.get("q") ?? "";
  const term = sanitize(raw);

  if (term.length < 2) {
    return NextResponse.json(EMPTY);
  }

  const supabase = await createClient();
  const { data } = await supabase.rpc("search_catalog", { p_term: term, p_limit: 8 });

  const products: Suggestion[] = ((data ?? []) as CatalogRow[]).map((product) => ({
    slug: product.slug,
    name: product.name,
    type: product.type,
    typeLabel: TYPE_META[product.type].label,
    price: Number(product.price),
    compareAt: product.compare_at_price ? Number(product.compare_at_price) : null,
    meta: discountPercent(product) ? `-${discountPercent(product)}%` : TYPE_META[product.type].plural,
  }));

  // categorias: bate no nome do tipo ("perfis" -> Perfis de streaming)
  const needle = normalize(term);
  const categories = TYPE_ORDER.filter((type) => {
    const label = normalize(TYPE_META[type].plural);
    const singular = normalize(TYPE_META[type].label);
    return label.includes(needle) || singular.includes(needle);
  }).map((type) => ({
    type,
    label: TYPE_META[type].plural,
    count: products.filter((product) => product.type === type).length,
  }));

  return NextResponse.json({ products, categories });
}

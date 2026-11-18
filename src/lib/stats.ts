import { unstable_cache } from "next/cache";

import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Produto mais acessado nos últimos 30 dias.
 *
 * O cálculo corre em Postgres (`top_product_id`) e o resultado fica em cache
 * por 10 minutos — o selo 🔥 não pode custar uma query agregada por pageview.
 */
export const getTopProductId = unstable_cache(
  async (): Promise<string | null> => {
    const supabase = createAdminClient();
    const { data, error } = await supabase.rpc("top_product_id", { p_days: 30 });
    if (error) return null;
    return (data as string | null) ?? null;
  },
  ["top-product-30d"],
  { revalidate: 600, tags: ["catalog"] },
);

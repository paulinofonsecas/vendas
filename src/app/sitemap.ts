import type { MetadataRoute } from "next";

import { TYPE_ORDER } from "@/lib/catalog";
import { absoluteUrl } from "@/lib/site";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = await createClient();
  const { data } = await supabase.from("catalog").select("slug");
  const now = new Date();

  return [
    {
      url: absoluteUrl("/"),
      lastModified: now,
      changeFrequency: "daily",
      priority: 1,
    },
    ...TYPE_ORDER.map((type) => ({
      url: absoluteUrl(`/categoria/${type}`),
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
    ...(data ?? []).map((product) => ({
      url: absoluteUrl(`/p/${product.slug}`),
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
  ];
}

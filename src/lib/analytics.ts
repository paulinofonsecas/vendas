import { unstable_cache } from "next/cache";

import { createAdminClient } from "@/lib/supabase/admin";
import type { Json } from "@/types/database";

export const EVENT_CATALOG = {
  page_view: "Visitas a páginas",
  product_view: "Produto visto",
  search: "Pesquisas",
  banner_click: "Clique em banner",
  share_click: "Clique em partilhar",
  checkout_start: "Checkout iniciado",
  order_created: "Pedido criado",
  proof_uploaded: "Comprovativo enviado",
} as const;

export type EventName = keyof typeof EVENT_CATALOG;

export type AnalyticsConfig = {
  enabled: boolean;
  events: Record<string, { label: string; enabled: boolean }>;
};

function fallbackConfig(): AnalyticsConfig {
  return {
    enabled: true,
    events: Object.fromEntries(
      Object.entries(EVENT_CATALOG).map(([key, label]) => [key, { label, enabled: true }]),
    ),
  };
}

/** Lê a configuração de telemetria (settings.analytics). Só servidor. */
export const getAnalyticsConfig = unstable_cache(
  async (): Promise<AnalyticsConfig> => {
    const supabase = createAdminClient();
    const { data } = await supabase
      .from("settings")
      .select("value")
      .eq("key", "analytics")
      .maybeSingle();

    if (!data?.value) return fallbackConfig();

    const value = data.value as Record<string, Json | undefined>;
    const events = (value.events ?? {}) as Record<string, { label?: string; enabled?: boolean }>;

    return {
      enabled: value.enabled !== false,
      events: Object.fromEntries(
        Object.keys(EVENT_CATALOG).map((key) => [
          key,
          {
            label: events[key]?.label ?? EVENT_CATALOG[key as EventName],
            enabled: events[key]?.enabled !== false,
          },
        ]),
      ),
    };
  },
  ["analytics-config"],
  { revalidate: 60, tags: ["analytics"] },
);

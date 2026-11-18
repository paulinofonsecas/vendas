import { saveAnalyticsConfigAction } from "@/app/actions/admin";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EVENT_CATALOG } from "@/lib/analytics";
import { getAnalyticsConfig } from "@/lib/analytics";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const DAY = 86_400_000;

function short(value: string): string {
  return new Intl.DateTimeFormat("pt-PT", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export default async function AdminTelemetryPage({
  searchParams,
}: {
  searchParams: Promise<{ msg?: string }>;
}) {
  const { msg } = await searchParams;
  const supabase = await createClient();

  // eslint-disable-next-line react-hooks/purity -- server component, sem render repetido
  const since = new Date(Date.now() - 7 * DAY).toISOString();
  const [{ data: events }, { data: products }, config] = await Promise.all([
    supabase
      .from("analytics_events")
      .select("id, name, path, product_id, session_id, meta, created_at")
      .gte("created_at", since)
      .order("created_at", { ascending: false })
      .limit(3000),
    supabase.from("products").select("id, name"),
    getAnalyticsConfig(),
  ]);

  const rows = events ?? [];
  const nameById = new Map((products ?? []).map((product) => [product.id, product.name]));

  const perEvent = new Map<string, number>();
  const perProduct = new Map<string, number>();
  const sessions = new Set<string>();

  for (const row of rows) {
    perEvent.set(row.name, (perEvent.get(row.name) ?? 0) + 1);
    if (row.session_id) sessions.add(row.session_id);
    if (row.product_id) perProduct.set(row.product_id, (perProduct.get(row.product_id) ?? 0) + 1);
  }

  const topProducts = [...perProduct.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6);

  const kpis = [
    { label: "Eventos (7 dias)", value: rows.length },
    { label: "Sessões", value: sessions.size },
    { label: "Visitas", value: perEvent.get("page_view") ?? 0 },
    { label: "Pedidos", value: perEvent.get("order_created") ?? 0 },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Telemetria</h1>
        <p className="text-muted-foreground mt-0.5 text-sm">
          Últimos 7 dias · {config.enabled ? "recolha activa" : "recolha desligada"}
        </p>
      </div>

      {msg ? <p className="bg-muted rounded-md px-4 py-3 text-sm">{decodeURIComponent(msg)}</p> : null}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((kpi) => (
          <Card key={kpi.label}>
            <CardContent className="pt-5">
              <p className="text-muted-foreground text-xs">{kpi.label}</p>
              <p className="mt-1 text-2xl font-semibold tracking-tight">{kpi.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">O que é medido</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={saveAnalyticsConfigAction} className="space-y-3">
              <label className="flex items-center gap-2 text-sm font-medium">
                <input
                  type="checkbox"
                  name="analytics_enabled"
                  defaultChecked={config.enabled}
                  className="size-4"
                />
                Recolher telemetria
              </label>

              <div className="border-border/60 divide-border/60 divide-y rounded-lg border">
                {Object.entries(EVENT_CATALOG).map(([key, label]) => {
                  const count = perEvent.get(key) ?? 0;
                  return (
                    <label
                      key={key}
                      className="flex items-center justify-between gap-3 px-3 py-2 text-sm"
                    >
                      <span className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          name={`event_${key}`}
                          defaultChecked={config.events[key]?.enabled ?? true}
                          className="size-4"
                        />
                        <span>
                          {label}
                          <span className="text-muted-foreground ml-2 font-mono text-[11px]">
                            {key}
                          </span>
                        </span>
                      </span>
                      <Badge variant="outline">{count}</Badge>
                    </label>
                  );
                })}
              </div>

              <Button type="submit" className="w-full">
                Guardar configuração
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Produtos mais vistos</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {topProducts.map(([productId, count]) => (
                <div key={productId} className="flex items-center justify-between gap-3">
                  <span className="truncate">{nameById.get(productId) ?? "produto removido"}</span>
                  <span className="font-semibold">{count}</span>
                </div>
              ))}
              {topProducts.length === 0 ? (
                <p className="text-muted-foreground text-sm">Sem dados ainda.</p>
              ) : null}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Eventos recentes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1.5 text-xs">
              {rows.slice(0, 12).map((row) => (
                <div key={row.id} className="flex justify-between gap-3">
                  <span className="font-mono">{row.name}</span>
                  <span className="text-muted-foreground truncate">{row.path}</span>
                  <span className="text-muted-foreground shrink-0">{short(row.created_at)}</span>
                </div>
              ))}
              {rows.length === 0 ? (
                <p className="text-muted-foreground">Nenhum evento recolhido ainda.</p>
              ) : null}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

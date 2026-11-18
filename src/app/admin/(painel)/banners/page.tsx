import { BannersPanel } from "@/components/admin/banners-panel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

function when(value: string): string {
  return new Intl.DateTimeFormat("pt-PT", { dateStyle: "short", timeStyle: "short" }).format(
    new Date(value),
  );
}

export default async function AdminBannersPage({
  searchParams,
}: {
  searchParams: Promise<{ msg?: string }>;
}) {
  const { msg } = await searchParams;
  const supabase = await createClient();

  const [{ data: banners }, { data: audit }] = await Promise.all([
    supabase.from("banners").select("*").order("sort", { ascending: true }),
    supabase
      .from("audit_log")
      .select("*")
      .eq("entity", "banner")
      .order("created_at", { ascending: false })
      .limit(12),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Banners</h1>
        <p className="text-muted-foreground mt-0.5 text-sm">
          Flyers do carrossel da home, com janela de datas e auditoria.
        </p>
      </div>

      {msg ? <p className="bg-muted rounded-md px-4 py-3 text-sm">{decodeURIComponent(msg)}</p> : null}

      <BannersPanel banners={banners ?? []} />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Auditoria</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          {(audit ?? []).map((entry) => (
            <div
              key={entry.id}
              className="border-border/60 flex flex-wrap items-center justify-between gap-2 border-b pb-2 last:border-0"
            >
              <span className="font-mono text-xs">{entry.action}</span>
              <span className="text-muted-foreground text-xs">
                {entry.actor} · {when(entry.created_at)}
              </span>
            </div>
          ))}
          {(audit ?? []).length === 0 ? (
            <p className="text-muted-foreground text-sm">Sem alterações registadas.</p>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}

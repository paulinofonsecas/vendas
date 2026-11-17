import Link from "next/link";
import { notFound } from "next/navigation";

import {
  cancelOrderAction,
  confirmOrderAction,
  deliverOrderAction,
  rejectProofAction,
} from "@/app/actions/admin";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { decryptSecret } from "@/lib/crypto";
import { formatAOA, whatsappLink } from "@/lib/money";
import { PAYMENT_LABELS, STATUS_LABELS, STATUS_STYLES } from "@/lib/orders";
import { createClient } from "@/lib/supabase/server";
import type { Json } from "@/types/database";

export const dynamic = "force-dynamic";

function formatDateTime(value: string | null): string {
  if (!value) return "—";
  return new Intl.DateTimeFormat("pt-PT", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

function payloadLines(payload: Json): { label: string; value: string }[] {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) return [];

  const labels: Record<string, string> = {
    direction: "Operação",
    amount: "Montante",
    base: "Moeda",
    quote: "Contra-moeda",
    rate: "Taxa aplicada",
    briefing: "Briefing",
    references: "Referências",
    delivery_hours: "Prazo (h)",
  };

  return Object.entries(payload)
    .filter(([key, value]) => labels[key] && value !== null && value !== undefined && value !== "")
    .map(([key, value]) => ({
      label: labels[key]!,
      value: typeof value === "object" ? JSON.stringify(value) : String(value),
    }));
}

export default async function AdminOrderPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ msg?: string }>;
}) {
  const [{ id }, { msg }] = await Promise.all([params, searchParams]);

  const supabase = await createClient();
  const { data: order } = await supabase.from("orders").select("*").eq("id", id).maybeSingle();

  if (!order) notFound();

  const [{ data: customer }, { data: items }, { data: proofs }, { data: events }] = await Promise.all([
    supabase.from("customers").select("*").eq("id", order.customer_id).maybeSingle(),
    supabase.from("order_items").select("*").eq("order_id", order.id),
    supabase
      .from("payment_proofs")
      .select("*")
      .eq("order_id", order.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("order_events")
      .select("*")
      .eq("order_id", order.id)
      .order("created_at", { ascending: false })
      .limit(20),
  ]);

  const itemIds = (items ?? []).map((item) => item.id);
  const { data: inventory } =
    itemIds.length > 0
      ? await supabase.from("inventory_items").select("*").in("order_item_id", itemIds)
      : { data: [] };

  const signedUrls = new Map<string, string>();
  for (const proof of (proofs ?? []).slice(0, 5)) {
    const { data: signed } = await supabase.storage
      .from("proofs")
      .createSignedUrl(proof.file_path, 600);
    if (signed?.signedUrl) signedUrls.set(proof.id, signed.signedUrl);
  }

  const pendingProof = (proofs ?? []).find((proof) => proof.status === "pending");
  const wa = customer?.whatsapp
    ? whatsappLink(
        customer.whatsapp,
        `Olá ${customer.name}, sobre o teu pedido ${order.code} na Vendaz.`,
      )
    : null;

  return (
    <div className="space-y-6">
      <Link href="/admin" className="text-muted-foreground text-sm hover:underline">
        ← Pedidos
      </Link>

      {msg ? (
        <p className="bg-muted rounded-md px-4 py-3 text-sm">{decodeURIComponent(msg)}</p>
      ) : null}

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-mono text-2xl font-semibold tracking-tight">{order.code}</h1>
          <p className="text-muted-foreground text-sm">
            {formatDateTime(order.created_at)} · {PAYMENT_LABELS[order.payment_method]} ·{" "}
            {formatAOA(order.total)}
          </p>
        </div>
        <Badge className={STATUS_STYLES[order.status]}>{STATUS_LABELS[order.status]}</Badge>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Itens</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {(items ?? []).map((item) => (
                <div key={item.id} className="space-y-2">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-medium">{item.description}</p>
                      <p className="text-muted-foreground text-xs">
                        {item.qty}× {formatAOA(item.unit_price)}
                      </p>
                    </div>
                    <span className="font-medium">{formatAOA(item.total)}</span>
                  </div>

                  {payloadLines(item.payload).length > 0 ? (
                    <dl className="bg-muted rounded-md p-3 text-xs">
                      {payloadLines(item.payload).map((line) => (
                        <div key={line.label} className="flex gap-2 py-0.5">
                          <dt className="text-muted-foreground w-28 shrink-0">{line.label}</dt>
                          <dd className="break-words">{line.value}</dd>
                        </div>
                      ))}
                    </dl>
                  ) : null}
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Comprovativos</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {(proofs ?? []).length === 0 ? (
                <p className="text-muted-foreground text-sm">Ainda sem comprovativo.</p>
              ) : null}

              {(proofs ?? []).map((proof) => (
                <div
                  key={proof.id}
                  className="border-border/60 flex flex-wrap items-center justify-between gap-2 border-b pb-3 text-sm last:border-0 last:pb-0"
                >
                  <div>
                    <p className="font-medium capitalize">{proof.status}</p>
                    <p className="text-muted-foreground text-xs">
                      {formatDateTime(proof.created_at)}
                      {proof.note ? ` · ${proof.note}` : ""}
                    </p>
                  </div>
                  {signedUrls.get(proof.id) ? (
                    <a
                      href={signedUrls.get(proof.id)}
                      target="_blank"
                      rel="noreferrer"
                      className="text-sm font-medium underline-offset-4 hover:underline"
                    >
                      Ver ficheiro
                    </a>
                  ) : null}
                </div>
              ))}

              {pendingProof ? (
                <form action={rejectProofAction} className="flex flex-wrap items-end gap-2 pt-2">
                  <input type="hidden" name="orderId" value={order.id} />
                  <input
                    name="note"
                    placeholder="Motivo da rejeição"
                    className="border-input bg-background h-9 flex-1 rounded-md border px-3 text-sm"
                  />
                  <Button type="submit" variant="outline" size="sm">
                    Rejeitar
                  </Button>
                </form>
              ) : null}
            </CardContent>
          </Card>

          {(inventory ?? []).length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Credenciais entregues</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                {(inventory ?? []).map((entry) => {
                  let secret = "—";
                  try {
                    secret = decryptSecret(entry.secret_ciphertext);
                  } catch {
                    secret = "Erro ao decifrar";
                  }
                  return (
                    <div key={entry.id} className="border-border/60 border-b pb-2 last:border-0">
                      <p className="font-medium">{entry.label}</p>
                      <p className="font-mono text-xs break-all whitespace-pre-wrap">{secret}</p>
                      <p className="text-muted-foreground mt-1 text-xs">
                        Expira {formatDateTime(entry.expires_at)} · garantia até{" "}
                        {formatDateTime(entry.warranty_until)}
                      </p>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          ) : null}

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Histórico</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-xs">
              {(events ?? []).map((event) => (
                <div key={event.id} className="flex justify-between gap-3">
                  <span className="font-medium">{event.event}</span>
                  <span className="text-muted-foreground">
                    {event.actor} · {formatDateTime(event.created_at)}
                  </span>
                </div>
              ))}
              {(events ?? []).length === 0 ? (
                <p className="text-muted-foreground">Sem eventos.</p>
              ) : null}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Cliente</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p className="font-medium">{customer?.name ?? "—"}</p>
              <p className="text-muted-foreground">{customer?.whatsapp}</p>
              {customer?.email ? <p className="text-muted-foreground">{customer.email}</p> : null}
              {wa ? (
                <a
                  href={wa}
                  target="_blank"
                  rel="noreferrer"
                  className={buttonVariants({ variant: "outline", size: "sm", className: "mt-2" })}
                >
                  Abrir WhatsApp
                </a>
              ) : null}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Acções</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {order.status === "pending_payment" ? (
                <form action={confirmOrderAction}>
                  <input type="hidden" name="orderId" value={order.id} />
                  <Button type="submit" className="w-full">
                    Confirmar pagamento
                  </Button>
                </form>
              ) : null}

              {order.status === "confirmed" ? (
                <form action={deliverOrderAction}>
                  <input type="hidden" name="orderId" value={order.id} />
                  <Button type="submit" className="w-full">
                    Marcar como entregue
                  </Button>
                </form>
              ) : null}

              {order.status !== "cancelled" && order.status !== "delivered" ? (
                <>
                  <Separator />
                  <form action={cancelOrderAction}>
                    <input type="hidden" name="orderId" value={order.id} />
                    <Button type="submit" variant="ghost" className="text-destructive w-full">
                      Cancelar pedido
                    </Button>
                  </form>
                </>
              ) : null}

              <Separator />
              <dl className="text-muted-foreground space-y-1 text-xs">
                <div className="flex justify-between">
                  <dt>Confirmado</dt>
                  <dd>{formatDateTime(order.confirmed_at)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt>Entregue</dt>
                  <dd>{formatDateTime(order.delivered_at)}</dd>
                </div>
              </dl>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

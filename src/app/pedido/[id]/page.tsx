import Link from "next/link";
import { notFound } from "next/navigation";

import { ProofForm } from "@/app/pedido/[id]/proof-form";
import { BottomNav } from "@/components/store/bottom-nav";
import { SiteFooter, SiteHeader } from "@/components/site-chrome";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatAOA, whatsappLink } from "@/lib/money";
import { PAYMENT_LABELS, STATUS_FLOW, STATUS_LABELS, STATUS_STYLES } from "@/lib/orders";
import { getPublicSettings } from "@/lib/settings";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function OrderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!UUID.test(id)) notFound();

  const admin = createAdminClient();
  const { store, payment } = await getPublicSettings();

  const { data: order } = await admin
    .from("orders")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (!order) notFound();

  const [{ data: customer }, { data: items }, { data: proofs }] = await Promise.all([
    admin.from("customers").select("name, whatsapp").eq("id", order.customer_id).maybeSingle(),
    admin
      .from("order_items")
      .select("*")
      .eq("order_id", order.id)
      .order("created_at", { ascending: true }),
    admin
      .from("payment_proofs")
      .select("*")
      .eq("order_id", order.id)
      .order("created_at", { ascending: false }),
  ]);

  const pendingProof = (proofs ?? []).find((proof) => proof.status === "pending");
  const rejectedProof = (proofs ?? []).find((proof) => proof.status === "rejected");

  const waMessage = `Olá! Tenho uma dúvida sobre o pedido ${order.code}.`;
  const wa = store.whatsapp ? whatsappLink(store.whatsapp, waMessage) : null;

  return (
    <>
      <SiteHeader store={store} />

      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10 pb-20 sm:pb-10">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-muted-foreground text-sm">Pedido</p>
            <h1 className="font-mono text-2xl font-semibold tracking-tight">{order.code}</h1>
          </div>
          <Badge className={STATUS_STYLES[order.status]}>{STATUS_LABELS[order.status]}</Badge>
        </div>

        <ol className="text-muted-foreground mt-6 flex flex-wrap items-center gap-2 text-xs">
          {STATUS_FLOW.map((step, index) => {
            const currentIndex = STATUS_FLOW.indexOf(order.status);
            const done = currentIndex >= index && order.status !== "cancelled";
            return (
              <li key={step} className="flex items-center gap-2">
                {index > 0 ? <span aria-hidden>→</span> : null}
                <span className={done ? "text-foreground font-medium" : ""}>
                  {STATUS_LABELS[step]}
                </span>
              </li>
            );
          })}
        </ol>

        <div className="mt-8 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Resumo</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {(items ?? []).map((item) => (
                <div key={item.id} className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-medium">{item.description}</p>
                    <p className="text-muted-foreground text-xs">
                      {item.qty}× {formatAOA(item.unit_price)}
                    </p>
                  </div>
                  <span className="font-medium">{formatAOA(item.total)}</span>
                </div>
              ))}

              <div className="border-border/60 flex justify-between border-t pt-3">
                <span>Total</span>
                <span className="font-semibold">{formatAOA(order.total)}</span>
              </div>

              <div className="text-muted-foreground flex justify-between text-xs">
                <span>Pagamento</span>
                <span>{PAYMENT_LABELS[order.payment_method]}</span>
              </div>
              {customer ? (
                <div className="text-muted-foreground flex justify-between text-xs">
                  <span>Contacto</span>
                  <span>
                    {customer.name} · {customer.whatsapp}
                  </span>
                </div>
              ) : null}
            </CardContent>
          </Card>

          {order.status === "pending_payment" && order.payment_method === "transfer" ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Pagamento por transferência</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <div className="bg-muted rounded-lg p-4">
                  <p className="font-medium">{payment.transfer.bank}</p>
                  <p className="text-muted-foreground">{payment.transfer.holder}</p>
                  <p className="mt-2 font-mono text-xs break-all">{payment.transfer.iban}</p>
                  <p className="text-muted-foreground mt-3 text-xs">
                    Montante: <strong>{formatAOA(order.total)}</strong> · Referência: {order.code}
                  </p>
                </div>

                {pendingProof ? (
                  <p className="text-amber-400">
                    Comprovativo recebido. Assim que validarmos, avisamos-te por WhatsApp.
                  </p>
                ) : (
                  <>
                    {rejectedProof ? (
                      <p className="text-destructive">
                        O último comprovativo não foi aceite
                        {rejectedProof.note ? `: ${rejectedProof.note}` : "."} Envia outro, por favor.
                      </p>
                    ) : null}
                    <ProofForm orderId={order.id} />
                  </>
                )}
              </CardContent>
            </Card>
          ) : null}

          {order.status === "pending_payment" && order.payment_method === "cash" ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Pagamento no acto da entrega</CardTitle>
              </CardHeader>
              <CardContent className="text-sm">
                <p>
                  {payment.cash.instructions ||
                    "Vamos combinar contigo o local e a hora da entrega por WhatsApp."}
                </p>
              </CardContent>
            </Card>
          ) : null}

          {order.status === "delivered" ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Entrega</CardTitle>
              </CardHeader>
              <CardContent className="text-sm">
                <p>
                  Pedido entregue. Para substituições dentro da garantia, fala connosco no WhatsApp
                  com o código <strong>{order.code}</strong>.
                </p>
              </CardContent>
            </Card>
          ) : null}

          <div className="flex flex-wrap gap-3">
            {wa ? (
              <a
                href={wa}
                target="_blank"
                rel="noreferrer"
                className={buttonVariants({ variant: "outline" })}
              >
                Falar no WhatsApp
              </a>
            ) : null}
            <Link href="/" className={buttonVariants({ variant: "ghost" })}>
              Voltar à loja
            </Link>
          </div>
        </div>
      </main>

      <SiteFooter store={store} />
      <BottomNav whatsapp={store.whatsapp} />
    </>
  );
}

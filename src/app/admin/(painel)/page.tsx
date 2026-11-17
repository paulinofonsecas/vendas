import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatAOA } from "@/lib/money";
import { PAYMENT_LABELS, STATUS_LABELS, STATUS_STYLES } from "@/lib/orders";
import { createClient } from "@/lib/supabase/server";
import type { OrderStatus } from "@/types/database";

export const dynamic = "force-dynamic";

const FILTERS: { value: OrderStatus | "all"; label: string }[] = [
  { value: "all", label: "Todos" },
  { value: "pending_payment", label: "Aguarda pagamento" },
  { value: "confirmed", label: "Confirmados" },
  { value: "delivered", label: "Entregues" },
  { value: "cancelled", label: "Cancelados" },
];

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("pt-PT", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; msg?: string }>;
}) {
  const { status, msg } = await searchParams;
  const active = FILTERS.some((f) => f.value === status) ? (status as OrderStatus) : "all";

  const supabase = await createClient();
  let query = supabase
    .from("orders")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100);

  if (active !== "all") query = query.eq("status", active);

  const { data: orders } = await query;

  const customerIds = [...new Set((orders ?? []).map((order) => order.customer_id))];
  const { data: customers } =
    customerIds.length > 0
      ? await supabase.from("customers").select("id, name, whatsapp").in("id", customerIds)
      : { data: [] as { id: string; name: string; whatsapp: string }[] };

  const customersById = new Map((customers ?? []).map((customer) => [customer.id, customer]));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">Pedidos</h1>
        <p className="text-muted-foreground text-sm">{orders?.length ?? 0} resultados</p>
      </div>

      {msg ? (
        <p className="bg-muted rounded-md px-4 py-3 text-sm">{decodeURIComponent(msg)}</p>
      ) : null}

      <div className="flex flex-wrap gap-2 text-sm">
        {FILTERS.map((filter) => (
          <Link
            key={filter.value}
            href={filter.value === "all" ? "/admin" : `/admin?status=${filter.value}`}
            className={`rounded-full border px-3 py-1.5 ${
              active === filter.value ? "border-foreground font-medium" : "border-border"
            }`}
          >
            {filter.label}
          </Link>
        ))}
      </div>

      <div className="border-border/60 overflow-x-auto rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Código</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Pagamento</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Criado</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {(orders ?? []).map((order) => {
              const customer = customersById.get(order.customer_id);
              return (
                <TableRow key={order.id}>
                  <TableCell className="font-mono text-xs">{order.code}</TableCell>
                  <TableCell>
                    <div className="font-medium">{customer?.name ?? "—"}</div>
                    <div className="text-muted-foreground text-xs">{customer?.whatsapp}</div>
                  </TableCell>
                  <TableCell className="text-sm">{PAYMENT_LABELS[order.payment_method]}</TableCell>
                  <TableCell className="text-sm">{formatAOA(order.total)}</TableCell>
                  <TableCell>
                    <Badge className={STATUS_STYLES[order.status]}>{STATUS_LABELS[order.status]}</Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-xs">
                    {formatDate(order.created_at)}
                  </TableCell>
                  <TableCell className="text-right">
                    <Link
                      href={`/admin/pedidos/${order.id}`}
                      className="text-sm font-medium underline-offset-4 hover:underline"
                    >
                      Abrir
                    </Link>
                  </TableCell>
                </TableRow>
              );
            })}

            {(orders ?? []).length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-muted-foreground py-10 text-center text-sm">
                  Sem pedidos nesta vista.
                </TableCell>
              </TableRow>
            ) : null}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

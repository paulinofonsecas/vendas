"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { normalizeWhatsapp } from "@/lib/money";
import { checkRateLimit, clientIp } from "@/lib/rate-limit";
import { createAdminClient } from "@/lib/supabase/admin";

export type TrackState = { error?: string };

/**
 * Localiza um pedido por código + WhatsApp. Sem login de cliente: o par
 * código + número funciona como credencial, limitado por IP para travar enumeração.
 */
export async function trackOrderAction(_prev: TrackState, formData: FormData): Promise<TrackState> {
  const hdrs = await headers();
  const limit = await checkRateLimit(`track:${clientIp(hdrs)}`, 15, 60 * 60);
  if (!limit.allowed) return { error: "Demasiadas tentativas. Tenta novamente mais tarde." };

  const code = String(formData.get("code") ?? "")
    .trim()
    .toUpperCase();
  const whatsapp = normalizeWhatsapp(String(formData.get("whatsapp") ?? ""));

  if (!code || whatsapp.length < 9) {
    return { error: "Preenche o código do pedido e o WhatsApp usado na compra." };
  }

  const admin = createAdminClient();

  const { data: order } = await admin
    .from("orders")
    .select("id, customer_id")
    .eq("code", code)
    .maybeSingle();

  if (!order) return { error: "Não encontrámos nenhum pedido com esse código." };

  const { data: customer } = await admin
    .from("customers")
    .select("whatsapp")
    .eq("id", order.customer_id)
    .maybeSingle();

  if (!customer || customer.whatsapp !== whatsapp) {
    return { error: "O WhatsApp não corresponde a este pedido." };
  }

  redirect(`/pedido/${order.id}`);
}

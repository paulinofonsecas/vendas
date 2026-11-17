"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { createAdminClient } from "@/lib/supabase/admin";
import { clientIp, checkRateLimit } from "@/lib/rate-limit";
import { normalizeWhatsapp, roundMoney, toNumber } from "@/lib/money";
import {
  contactSchema,
  designSchema,
  digitalSchema,
  fieldErrors,
  fxSchema,
  paymentMethodSchema,
  profileSchema,
} from "@/lib/validators";
import type { Json } from "@/types/database";

export type CheckoutState = {
  error?: string;
  fieldErrors?: Record<string, string>;
};

const MAX_PROOF_BYTES = 10 * 1024 * 1024;
const ALLOWED_PROOF_TYPES = ["image/jpeg", "image/png", "image/webp", "application/pdf"];

function fail(error: string, errs?: Record<string, string>): CheckoutState {
  return { error, fieldErrors: errs };
}

/**
 * Cria o pedido. Preços e cotações são sempre lidos/calculados no servidor:
 * o formulário nunca decide quanto o cliente paga.
 */
export async function createOrderAction(
  _prev: CheckoutState,
  formData: FormData,
): Promise<CheckoutState> {
  const hdrs = await headers();
  const limit = await checkRateLimit(`checkout:${clientIp(hdrs)}`, 6, 60 * 60);
  if (!limit.allowed) {
    return fail("Demasiados pedidos seguidos. Tenta novamente daqui a uma hora.");
  }

  const contact = contactSchema.safeParse({
    name: formData.get("name"),
    whatsapp: formData.get("whatsapp"),
    email: formData.get("email") ?? "",
  });
  if (!contact.success) return fail("Confirma os teus dados.", fieldErrors(contact.error));

  const paymentMethod = paymentMethodSchema.safeParse(formData.get("paymentMethod"));
  if (!paymentMethod.success) return fail("Escolhe a forma de pagamento.");

  const productId = String(formData.get("productId") ?? "");
  if (!productId) return fail("Produto em falta.");

  const supabase = createAdminClient();

  const { data: product, error: productError } = await supabase
    .from("products")
    .select("*")
    .eq("id", productId)
    .eq("active", true)
    .maybeSingle();

  if (productError) return fail("Não foi possível ler o produto.");
  if (!product) return fail("Este produto já não está disponível.");

  const config = (product.config ?? {}) as Record<string, Json | undefined>;
  let subtotal = 0;
  let itemDescription = product.name;
  let itemPayload: Record<string, Json> = {};
  let qty = 1;

  switch (product.type) {
    case "profile": {
      const parsed = profileSchema.safeParse({ qty: formData.get("qty") ?? 1 });
      if (!parsed.success) return fail("Confirma a quantidade.", fieldErrors(parsed.error));

      const { count } = await supabase
        .from("inventory_items")
        .select("id", { count: "exact", head: true })
        .eq("product_id", product.id)
        .eq("status", "available");

      if ((count ?? 0) < parsed.data.qty) {
        return fail("Não há stock suficiente para essa quantidade. Fala com o suporte no WhatsApp.");
      }

      qty = parsed.data.qty;
      subtotal = roundMoney(toNumber(product.price) * qty);
      itemDescription = `${product.name} (${qty}x)`;
      break;
    }

    case "fx": {
      const parsed = fxSchema.safeParse({
        amount: formData.get("amount"),
        direction: formData.get("direction") ?? "buy",
      });
      if (!parsed.success) return fail("Confirma o montante.", fieldErrors(parsed.error));

      const base = (config.base as string) || "USD";
      const quote = (config.quote as string) || "AOA";

      const { data: rate } = await supabase
        .from("fx_rates")
        .select("*")
        .eq("base", base)
        .eq("quote", quote)
        .eq("active", true)
        .maybeSingle();

      if (!rate) return fail("Não há cotação disponível para este par neste momento.");

      const minAmount = toNumber(config.min_amount as number);
      if (minAmount && parsed.data.amount < minAmount) {
        return fail(`Montante mínimo: ${minAmount} ${base}.`);
      }

      const applied = parsed.data.direction === "buy" ? toNumber(rate.sell) : toNumber(rate.buy);
      const total = roundMoney(parsed.data.amount * applied);

      qty = 1;
      subtotal = total;
      itemDescription = `${parsed.data.direction === "buy" ? "Compra" : "Venda"} de ${parsed.data.amount} ${base}`;
      itemPayload = {
        direction: parsed.data.direction,
        amount: parsed.data.amount,
        base,
        quote,
        rate: applied,
        rate_id: rate.id,
        rate_at: new Date().toISOString(),
      };
      break;
    }

    case "design": {
      const parsed = designSchema.safeParse({
        briefing: formData.get("briefing"),
        references: formData.get("references") ?? "",
      });
      if (!parsed.success) return fail("Completa o briefing.", fieldErrors(parsed.error));

      subtotal = roundMoney(toNumber(product.price));
      itemPayload = {
        briefing: parsed.data.briefing,
        references: parsed.data.references || null,
        delivery_hours: (config.delivery_hours as number) ?? null,
      };
      break;
    }

    case "digital": {
      const parsed = digitalSchema.safeParse({ qty: formData.get("qty") ?? 1 });
      if (!parsed.success) return fail("Quantidade inválida.", fieldErrors(parsed.error));

      qty = parsed.data.qty;
      subtotal = roundMoney(toNumber(product.price) * qty);
      break;
    }

    default:
      return fail("Tipo de produto desconhecido.");
  }

  const whatsapp = normalizeWhatsapp(contact.data.whatsapp);
  if (whatsapp.length < 9) return fail("Número de WhatsApp inválido.");

  const { data: existingCustomer } = await supabase
    .from("customers")
    .select("id")
    .eq("whatsapp", whatsapp)
    .maybeSingle();

  let customerId = existingCustomer?.id;

  if (!customerId) {
    const { data: created, error: customerError } = await supabase
      .from("customers")
      .insert({
        name: contact.data.name,
        whatsapp,
        email: contact.data.email || null,
      })
      .select("id")
      .single();

    if (customerError || !created) return fail("Não foi possível registar o teu contacto.");
    customerId = created.id;
  }

  const orderPayload: Record<string, Json> = {
    product_slug: product.slug,
    product_type: product.type,
    submitted_at: new Date().toISOString(),
  };

  const { data: order, error: orderError } = await supabase
    .from("orders")
    .insert({
      customer_id: customerId,
      payment_method: paymentMethod.data,
      subtotal,
      total: subtotal,
      currency: product.currency,
      payload: orderPayload,
    })
    .select("id, code")
    .single();

  if (orderError || !order) return fail("Não foi possível criar o pedido. Tenta novamente.");

  const { error: itemError } = await supabase.from("order_items").insert({
    order_id: order.id,
    product_id: product.id,
    description: itemDescription,
    qty,
    unit_price: roundMoney(toNumber(product.price)),
    total: subtotal,
    payload: itemPayload,
  });

  if (itemError) {
    await supabase.from("orders").delete().eq("id", order.id);
    return fail("Não foi possível criar o pedido. Tenta novamente.");
  }

  await supabase.from("order_events").insert({
    order_id: order.id,
    actor: "customer",
    event: "order_created",
    meta: { payment_method: paymentMethod.data, total: subtotal },
  });

  await supabase.from("outbox").insert({
    order_id: order.id,
    event: "order_created",
    channel: "whatsapp",
    payload: {
      code: order.code,
      name: contact.data.name,
      whatsapp,
      total: subtotal,
      product: product.name,
      description: itemDescription,
    },
  });

  redirect(`/pedido/${order.id}`);
}

export type ProofState = { error?: string; success?: boolean };

/** Upload do comprovativo. Passa pelo servidor: o bucket é privado e o anon não escreve. */
export async function uploadProofAction(_prev: ProofState, formData: FormData): Promise<ProofState> {
  const orderId = String(formData.get("orderId") ?? "");
  const file = formData.get("file");

  if (!orderId) return { error: "Pedido em falta." };
  if (!(file instanceof File) || file.size === 0) return { error: "Escolhe um ficheiro." };
  if (file.size > MAX_PROOF_BYTES) return { error: "O ficheiro não pode passar de 10 MB." };
  if (!ALLOWED_PROOF_TYPES.includes(file.type)) {
    return { error: "Formato inválido. Usa JPG, PNG, WEBP ou PDF." };
  }

  const hdrs = await headers();
  const limit = await checkRateLimit(`proof:${clientIp(hdrs)}`, 10, 60 * 60);
  if (!limit.allowed) return { error: "Demasiadas tentativas. Tenta mais tarde." };

  const supabase = createAdminClient();

  const { data: order } = await supabase
    .from("orders")
    .select("id, status")
    .eq("id", orderId)
    .maybeSingle();

  if (!order) return { error: "Pedido não encontrado." };
  if (order.status !== "pending_payment") {
    return { error: "Este pedido já não aceita comprovativos." };
  }

  const extension = file.name.split(".").pop()?.toLowerCase() ?? "bin";
  const path = `${orderId}/${Date.now()}-${crypto.randomUUID()}.${extension}`;
  const bytes = new Uint8Array(await file.arrayBuffer());

  const { error: uploadError } = await supabase.storage
    .from("proofs")
    .upload(path, bytes, { contentType: file.type, upsert: false });

  if (uploadError) return { error: "Não foi possível guardar o comprovativo." };

  await supabase.from("payment_proofs").insert({
    order_id: orderId,
    file_path: path,
    mime: file.type,
    size_bytes: file.size,
  });

  await supabase.from("order_events").insert({
    order_id: orderId,
    actor: "customer",
    event: "proof_uploaded",
    meta: { path },
  });

  await supabase.from("outbox").insert({
    order_id: orderId,
    event: "proof_uploaded",
    channel: "whatsapp",
    payload: { path },
  });

  revalidatePath(`/pedido/${orderId}`);
  return { success: true };
}

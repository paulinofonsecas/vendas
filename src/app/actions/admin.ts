"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { redirect } from "next/navigation";

import { requireStaff } from "@/lib/auth";
import { EVENT_CATALOG, type EventName } from "@/lib/analytics";
import { encryptSecret } from "@/lib/crypto";
import { roundMoney, toNumber } from "@/lib/money";
import { createClient } from "@/lib/supabase/server";
import type { Json, ProductType } from "@/types/database";

export type AuthState = { error?: string };

function addDays(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString();
}

function num(value: FormDataEntryValue | null, fallback = 0): number {
  return toNumber(typeof value === "string" ? value : fallback);
}

function str(value: FormDataEntryValue | null): string {
  return typeof value === "string" ? value.trim() : "";
}

/* -------------------------------------------------------------------------- */
/* sessão                                                                     */
/* -------------------------------------------------------------------------- */

export async function loginAction(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const email = str(formData.get("email")).toLowerCase();
  const password = str(formData.get("password"));

  if (!email || !password) return { error: "Preenche o email e a password." };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) return { error: "Credenciais inválidas." };

  redirect("/admin");
}

export async function logoutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/admin/login");
}

/* -------------------------------------------------------------------------- */
/* pedidos                                                                    */
/* -------------------------------------------------------------------------- */

export async function confirmOrderAction(formData: FormData) {
  const staff = await requireStaff();
  const orderId = str(formData.get("orderId"));
  const supabase = await createClient();

  const { data: order } = await supabase
    .from("orders")
    .select("id, status, code, total, payment_method")
    .eq("id", orderId)
    .maybeSingle();

  if (!order || order.status !== "pending_payment") {
    redirect(`/admin/pedidos/${orderId}?msg=Este+pedido+n%C3%A3o+est%C3%A1+pendente.`);
  }

  const now = new Date().toISOString();

  await supabase
    .from("payment_proofs")
    .update({ status: "accepted", reviewed_by: staff.email, reviewed_at: now })
    .eq("order_id", orderId)
    .eq("status", "pending");

  await supabase
    .from("orders")
    .update({ status: "confirmed", confirmed_at: now })
    .eq("id", orderId);

  await supabase.from("order_events").insert({
    order_id: orderId,
    actor: staff.email,
    event: "order_confirmed",
    meta: { payment_method: order.payment_method },
  });

  await supabase.from("outbox").insert({
    order_id: orderId,
    event: "order_confirmed",
    channel: "whatsapp",
    payload: { code: order.code, total: order.total },
  });

  revalidatePath("/admin");
  revalidatePath(`/admin/pedidos/${orderId}`);
  redirect(`/admin/pedidos/${orderId}?msg=Pedido+confirmado.`);
}

export async function rejectProofAction(formData: FormData) {
  const staff = await requireStaff();
  const orderId = str(formData.get("orderId"));
  const note = str(formData.get("note"));
  const supabase = await createClient();

  await supabase
    .from("payment_proofs")
    .update({
      status: "rejected",
      note: note || "Comprovativo ilegível ou inválido.",
      reviewed_by: staff.email,
      reviewed_at: new Date().toISOString(),
    })
    .eq("order_id", orderId)
    .eq("status", "pending");

  await supabase.from("order_events").insert({
    order_id: orderId,
    actor: staff.email,
    event: "proof_rejected",
    meta: { note },
  });

  await supabase.from("outbox").insert({
    order_id: orderId,
    event: "proof_rejected",
    channel: "whatsapp",
    payload: { note },
  });

  revalidatePath(`/admin/pedidos/${orderId}`);
  redirect(`/admin/pedidos/${orderId}?msg=Comprovativo+rejeitado.`);
}

export async function deliverOrderAction(formData: FormData) {
  const staff = await requireStaff();
  const orderId = str(formData.get("orderId"));
  const supabase = await createClient();

  const { data: order } = await supabase
    .from("orders")
    .select("id, status, code")
    .eq("id", orderId)
    .maybeSingle();

  if (!order || order.status !== "confirmed") {
    redirect(`/admin/pedidos/${orderId}?msg=Confirma+o+pagamento+antes+de+entregar.`);
  }

  const { data: items } = await supabase
    .from("order_items")
    .select("id, product_id, qty")
    .eq("order_id", orderId);

  const productIds = [...new Set((items ?? []).map((item) => item.product_id))];
  const { data: products } =
    productIds.length > 0
      ? await supabase.from("products").select("id, type, config").in("id", productIds)
      : { data: [] as { id: string; type: ProductType; config: Json }[] };

  const productsById = new Map((products ?? []).map((product) => [product.id, product]));

  for (const item of items ?? []) {
    const product = productsById.get(item.product_id);
    if (product?.type !== "profile") continue;

    const config = (product.config ?? {}) as Record<string, Json | undefined>;
    const durationDays = toNumber(config.duration_days as number) || 30;
    const warrantyDays = toNumber(config.warranty_days as number) || 7;

    const { data: stock } = await supabase
      .from("inventory_items")
      .select("id")
      .eq("product_id", item.product_id)
      .eq("status", "available")
      .limit(item.qty);

    if (!stock || stock.length < item.qty) {
      redirect(`/admin/pedidos/${orderId}?msg=Stock+insuficiente+para+entregar.`);
    }

    const now = new Date().toISOString();
    await supabase
      .from("inventory_items")
      .update({
        status: "assigned",
        order_item_id: item.id,
        assigned_at: now,
        expires_at: addDays(durationDays),
        warranty_until: addDays(warrantyDays),
      })
      .in(
        "id",
        stock.map((s) => s.id),
      );

    await supabase
      .from("order_items")
      .update({ warranty_until: addDays(warrantyDays) })
      .eq("id", item.id);
  }

  const now = new Date().toISOString();
  await supabase.from("orders").update({ status: "delivered", delivered_at: now }).eq("id", orderId);
  await supabase.from("order_events").insert({
    order_id: orderId,
    actor: staff.email,
    event: "order_delivered",
  });
  await supabase.from("outbox").insert({
    order_id: orderId,
    event: "order_delivered",
    channel: "whatsapp",
    payload: { code: order.code },
  });

  revalidatePath("/admin");
  revalidatePath(`/admin/pedidos/${orderId}`);
  redirect(`/admin/pedidos/${orderId}?msg=Pedido+entregue.`);
}

export async function cancelOrderAction(formData: FormData) {
  const staff = await requireStaff();
  const orderId = str(formData.get("orderId"));
  const supabase = await createClient();

  await supabase
    .from("orders")
    .update({ status: "cancelled", cancelled_at: new Date().toISOString() })
    .eq("id", orderId);

  await supabase.from("order_events").insert({
    order_id: orderId,
    actor: staff.email,
    event: "order_cancelled",
  });

  revalidatePath("/admin");
  revalidatePath(`/admin/pedidos/${orderId}`);
  redirect(`/admin/pedidos/${orderId}?msg=Pedido+cancelado.`);
}

/* -------------------------------------------------------------------------- */
/* catálogo                                                                   */
/* -------------------------------------------------------------------------- */

function buildConfig(formData: FormData, type: ProductType): Record<string, Json> {
  const config: Record<string, Json> = {};

  if (type === "profile") {
    config.duration_days = num(formData.get("duration_days"), 30);
    config.warranty_days = num(formData.get("warranty_days"), 7);
    config.screens = num(formData.get("screens"), 1);
  }

  if (type === "fx") {
    config.base = (str(formData.get("base")) || "USD").toUpperCase();
    config.quote = (str(formData.get("quote")) || "AOA").toUpperCase();
    config.min_amount = num(formData.get("min_amount"), 0);
  }

  if (type === "design") {
    config.delivery_hours = num(formData.get("delivery_hours"), 48);
    config.revisions = num(formData.get("revisions"), 2);
    const formats = str(formData.get("formats"));
    if (formats) {
      config.formats = formats
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);
    }
  }

  if (type === "digital") {
    config.delivery = str(formData.get("delivery")) || "link";
    config.format = str(formData.get("format")) || "pdf";
  }

  return config;
}

export async function saveProductAction(formData: FormData) {
  await requireStaff();
  const supabase = await createClient();

  const id = str(formData.get("id"));
  const type = str(formData.get("type")) as ProductType;
  const price = roundMoney(num(formData.get("price")));
  const compareAt = roundMoney(num(formData.get("compare_at_price")));
  const slug = str(formData.get("slug"))
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  const payload = {
    type,
    slug,
    name: str(formData.get("name")),
    description: str(formData.get("description")),
    price,
    compare_at_price: compareAt > price ? compareAt : null,
    active: formData.get("active") === "on" || formData.get("active") === "true",
    sort: num(formData.get("sort")),
    config: buildConfig(formData, type),
  };

  if (!payload.slug || !payload.name) {
    redirect("/admin/produtos?msg=Slug+e+nome+s%C3%A3o+obrigat%C3%B3rios.");
  }

  if (id) {
    await supabase.from("products").update(payload).eq("id", id);
  } else {
    await supabase.from("products").insert(payload);
  }

  revalidatePath("/admin/produtos");
  revalidatePath("/");
  redirect("/admin/produtos?msg=Produto+guardado.");
}

export async function toggleProductAction(formData: FormData) {
  await requireStaff();
  const supabase = await createClient();
  const id = str(formData.get("id"));
  const active = str(formData.get("active")) === "true";

  await supabase.from("products").update({ active: !active }).eq("id", id);

  revalidatePath("/admin/produtos");
  revalidatePath("/");
}

/* -------------------------------------------------------------------------- */
/* stock                                                                      */
/* -------------------------------------------------------------------------- */

export async function addInventoryAction(formData: FormData) {
  await requireStaff();
  const supabase = await createClient();

  const productId = str(formData.get("productId"));
  const label = str(formData.get("label"));
  const email = str(formData.get("email"));
  const password = str(formData.get("password"));
  const pin = str(formData.get("pin"));
  const notes = str(formData.get("notes"));

  if (!productId || (!email && !password)) {
    redirect("/admin/estoque?msg=Produto,+email+ou+password+s%C3%A3o+obrigat%C3%B3rios.");
  }

  const secret = JSON.stringify({ email, password, pin, notes });

  const { error } = await supabase.from("inventory_items").insert({
    product_id: productId,
    label: label || email || "Perfil",
    secret_ciphertext: encryptSecret(secret),
  });

  if (error) redirect("/admin/estoque?msg=N%C3%A3o+foi+poss%C3%ADvel+guardar.");

  revalidatePath("/admin/estoque");
  redirect("/admin/estoque?msg=Perfil+adicionado.");
}

export async function revokeInventoryAction(formData: FormData) {
  await requireStaff();
  const supabase = await createClient();
  const id = str(formData.get("id"));

  await supabase.from("inventory_items").update({ status: "revoked" }).eq("id", id);

  revalidatePath("/admin/estoque");
}

/* -------------------------------------------------------------------------- */
/* câmbios e definições                                                       */
/* -------------------------------------------------------------------------- */

export async function saveFxRateAction(formData: FormData) {
  await requireStaff();
  const supabase = await createClient();

  const id = str(formData.get("id"));
  const payload = {
    base: str(formData.get("base")).toUpperCase(),
    quote: str(formData.get("quote")).toUpperCase(),
    buy: num(formData.get("buy")),
    sell: num(formData.get("sell")),
    active: formData.get("active") !== "false",
  };

  if (payload.buy <= 0 || payload.sell <= 0) {
    redirect("/admin/cambios?msg=Taxas+inv%C3%A1lidas.");
  }

  if (id) {
    await supabase.from("fx_rates").update(payload).eq("id", id);
  } else {
    await supabase.from("fx_rates").upsert(payload, { onConflict: "base,quote" });
  }

  revalidatePath("/admin/cambios");
  revalidatePath("/");
  redirect("/admin/cambios?msg=C%C3%A2mbio+actualizado.");
}

export async function saveStoreSettingsAction(formData: FormData) {
  await requireStaff();
  const supabase = await createClient();

  const value: Json = {
    name: str(formData.get("name")) || "Vendaz",
    whatsapp: str(formData.get("whatsapp")).replace(/\D/g, ""),
    email: str(formData.get("email")),
    address: str(formData.get("address")),
    hours: str(formData.get("hours")),
    currency: "AOA",
  };

  const { error } = await supabase
    .from("settings")
    .upsert({ key: "store", value, is_public: true, updated_at: new Date().toISOString() }, { onConflict: "key" });

  if (error) redirect("/admin/definicoes?msg=N%C3%A3o+foi+poss%C3%ADvel+guardar+a+loja.");

  revalidatePath("/");
  revalidatePath("/admin/definicoes");
  redirect("/admin/definicoes?msg=Loja+actualizada.");
}

export async function saveBannerAction(formData: FormData) {
  const staff = await requireStaff();
  const supabase = await createClient();

  const id = str(formData.get("id"));
  const payload = {
    image: str(formData.get("image")),
    title: str(formData.get("title")),
    subtitle: str(formData.get("subtitle")),
    cta: str(formData.get("cta")),
    href: str(formData.get("href")) || "/#catalogo",
    sort: num(formData.get("sort")),
    active: formData.get("active") === "on",
    starts_at: str(formData.get("starts_at")) || null,
    ends_at: str(formData.get("ends_at")) || null,
  };

  if (!payload.image) {
    redirect("/admin/banners?msg=Indica+a+imagem+do+banner.");
  }

  if (id) {
    await supabase.from("banners").update(payload).eq("id", id);
  } else {
    await supabase.from("banners").insert({ ...payload, created_by: staff.email });
  }

  await supabase.from("audit_log").insert({
    actor: staff.email,
    action: id ? "banner.update" : "banner.create",
    entity: "banner",
    entity_id: id || null,
    diff: payload,
  });

  revalidatePath("/");
  revalidatePath("/admin/banners");
  redirect("/admin/banners?msg=Banner+guardado.");
}

export async function toggleBannerAction(formData: FormData) {
  const staff = await requireStaff();
  const supabase = await createClient();
  const id = str(formData.get("id"));
  const active = str(formData.get("active")) === "true";

  await supabase.from("banners").update({ active: !active }).eq("id", id);
  await supabase.from("audit_log").insert({
    actor: staff.email,
    action: "banner.toggle",
    entity: "banner",
    entity_id: id,
    diff: { active: !active },
  });

  revalidatePath("/");
  revalidatePath("/admin/banners");
}

export async function deleteBannerAction(formData: FormData) {
  const staff = await requireStaff();
  const supabase = await createClient();
  const id = str(formData.get("id"));

  await supabase.from("banners").delete().eq("id", id);
  await supabase.from("audit_log").insert({
    actor: staff.email,
    action: "banner.delete",
    entity: "banner",
    entity_id: id,
  });

  revalidatePath("/");
  revalidatePath("/admin/banners");
  redirect("/admin/banners?msg=Banner+removido.");
}

export async function saveAnalyticsConfigAction(formData: FormData) {
  await requireStaff();
  const supabase = await createClient();

  const events: Record<string, { label: string; enabled: boolean }> = {};
  for (const key of Object.keys(EVENT_CATALOG)) {
    events[key] = {
      label: EVENT_CATALOG[key as EventName],
      enabled: formData.get(`event_${key}`) === "on",
    };
  }

  const value: Json = { enabled: formData.get("analytics_enabled") === "on", events };

  await supabase
    .from("settings")
    .upsert(
      { key: "analytics", value, is_public: false, updated_at: new Date().toISOString() },
      { onConflict: "key" },
    );

  revalidateTag("analytics", "max");
  revalidatePath("/admin/telemetria");
  redirect("/admin/telemetria?msg=Configura%C3%A7%C3%A3o+guardada.");
}

export async function savePaymentSettingsAction(formData: FormData) {
  await requireStaff();
  const supabase = await createClient();

  const value: Json = {
    transfer: {
      enabled: formData.get("transfer_enabled") === "on",
      bank: str(formData.get("transfer_bank")),
      holder: str(formData.get("transfer_holder")),
      iban: str(formData.get("transfer_iban")).toUpperCase(),
      instructions: str(formData.get("transfer_instructions")),
    },
    cash: {
      enabled: formData.get("cash_enabled") === "on",
      instructions: str(formData.get("cash_instructions")),
    },
  };

  const { error } = await supabase
    .from("settings")
    .upsert({ key: "payment", value, is_public: true, updated_at: new Date().toISOString() }, { onConflict: "key" });

  if (error) redirect("/admin/definicoes?msg=N%C3%A3o+foi+poss%C3%ADvel+guardar+os+pagamentos.");

  revalidatePath("/");
  revalidatePath("/admin/definicoes");
  redirect("/admin/definicoes?msg=Pagamentos+actualizados.");
}

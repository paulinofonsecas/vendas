import { createClient } from "@/lib/supabase/server";
import type { Json } from "@/types/database";

export type StoreSettings = {
  name: string;
  whatsapp: string;
  email: string;
  address: string;
  hours: string;
  currency: string;
};

export type PaymentSettings = {
  transfer: { enabled: boolean; bank: string; holder: string; iban: string; instructions: string };
  cash: { enabled: boolean; instructions: string };
};

const STORE_FALLBACK: StoreSettings = {
  name: "Vendaz",
  whatsapp: "",
  email: "",
  address: "",
  hours: "",
  currency: "AOA",
};

const PAYMENT_FALLBACK: PaymentSettings = {
  transfer: { enabled: true, bank: "", holder: "", iban: "", instructions: "" },
  cash: { enabled: true, instructions: "" },
};

function asObject(value: Json): Record<string, Json | undefined> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, Json | undefined>)
    : {};
}

/** Settings públicas. RLS só expõe as linhas com is_public = true. */
export async function getPublicSettings(): Promise<{
  store: StoreSettings;
  payment: PaymentSettings;
}> {
  const supabase = await createClient();
  const { data } = await supabase.from("settings").select("key, value").in("key", ["store", "payment"]);

  const rows = new Map((data ?? []).map((row) => [row.key, row.value]));

  const store = asObject(rows.get("store") ?? {});
  const payment = asObject(rows.get("payment") ?? {});
  const transfer = asObject(payment.transfer as Json);
  const cash = asObject(payment.cash as Json);

  return {
    store: {
      name: (store.name as string) || STORE_FALLBACK.name,
      whatsapp: (store.whatsapp as string) || "",
      email: (store.email as string) || "",
      address: (store.address as string) || "",
      hours: (store.hours as string) || "",
      currency: (store.currency as string) || "AOA",
    },
    payment: {
      transfer: {
        enabled: (transfer.enabled as boolean) ?? PAYMENT_FALLBACK.transfer.enabled,
        bank: (transfer.bank as string) || PAYMENT_FALLBACK.transfer.bank,
        holder: (transfer.holder as string) || PAYMENT_FALLBACK.transfer.holder,
        iban: (transfer.iban as string) || PAYMENT_FALLBACK.transfer.iban,
        instructions: (transfer.instructions as string) || PAYMENT_FALLBACK.transfer.instructions,
      },
      cash: {
        enabled: (cash.enabled as boolean) ?? PAYMENT_FALLBACK.cash.enabled,
        instructions: (cash.instructions as string) || PAYMENT_FALLBACK.cash.instructions,
      },
    },
  };
}

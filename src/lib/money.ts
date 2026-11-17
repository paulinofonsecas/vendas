export const CURRENCY = "AOA";

const formatter = new Intl.NumberFormat("pt-PT", {
  style: "currency",
  currency: CURRENCY,
  maximumFractionDigits: 0,
});

export function toNumber(value: number | string | null | undefined): number {
  if (value === null || value === undefined || value === "") return 0;
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : 0;
}

export function formatAOA(value: number | string | null | undefined): string {
  return formatter.format(toNumber(value));
}

export function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

export function normalizeWhatsapp(input: string): string {
  const digits = input.replace(/\D/g, "");
  // Angola: 9xx xxx xxx -> 244 9xx xxx xxx
  if (digits.length === 9) return `244${digits}`;
  return digits;
}

export function whatsappLink(number: string, message: string): string {
  return `https://wa.me/${number.replace(/\D/g, "")}?text=${encodeURIComponent(message)}`;
}

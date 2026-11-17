import type { OrderStatus, PaymentMethod, ProductType } from "@/types/database";

export const STATUS_LABELS: Record<OrderStatus, string> = {
  pending_payment: "Aguarda pagamento",
  confirmed: "Confirmado",
  delivered: "Entregue",
  cancelled: "Cancelado",
};

export const STATUS_STYLES: Record<OrderStatus, string> = {
  pending_payment: "border-amber-500/30 bg-amber-500/15 text-amber-300",
  confirmed: "border-sky-500/30 bg-sky-500/15 text-sky-300",
  delivered: "border-emerald-500/30 bg-emerald-500/15 text-emerald-300",
  cancelled: "border-neutral-500/30 bg-neutral-500/15 text-neutral-300",
};

export const PAYMENT_LABELS: Record<PaymentMethod, string> = {
  transfer: "Transferência",
  cash: "Dinheiro",
};

export const TYPE_LABELS: Record<ProductType, string> = {
  profile: "Perfil",
  fx: "Câmbio",
  design: "Design",
  digital: "Digital",
};

export const STATUS_FLOW: OrderStatus[] = ["pending_payment", "confirmed", "delivered"];

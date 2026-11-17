import type { OrderStatus, PaymentMethod, ProductType } from "@/types/database";

export const STATUS_LABELS: Record<OrderStatus, string> = {
  pending_payment: "Aguarda pagamento",
  confirmed: "Confirmado",
  delivered: "Entregue",
  cancelled: "Cancelado",
};

export const STATUS_STYLES: Record<OrderStatus, string> = {
  pending_payment: "bg-amber-100 text-amber-900 border-amber-200",
  confirmed: "bg-blue-100 text-blue-900 border-blue-200",
  delivered: "bg-emerald-100 text-emerald-900 border-emerald-200",
  cancelled: "bg-neutral-200 text-neutral-700 border-neutral-300",
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

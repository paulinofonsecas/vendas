import { z } from "zod";

import type { PaymentMethod } from "@/types/database";

export const paymentMethodSchema = z.enum(["transfer", "cash"]) satisfies z.ZodType<PaymentMethod>;

export const contactSchema = z.object({
  name: z.string().trim().min(2, "Indica o teu nome completo.").max(80, "Nome demasiado longo."),
  whatsapp: z
    .string()
    .trim()
    .min(9, "Indica um número de WhatsApp válido.")
    .max(20, "Número demasiado longo."),
  email: z.string().trim().email("Email inválido.").max(120).optional().or(z.literal("")),
});

export const profileSchema = z.object({
  qty: z.coerce.number().int().min(1, "Mínimo 1.").max(10, "Máximo 10 por pedido."),
});

export const fxSchema = z.object({
  amount: z.coerce.number().positive("Indica o montante.").max(100_000_000, "Montante demasiado alto."),
  direction: z.enum(["buy", "sell"]),
});

export const designSchema = z.object({
  briefing: z.string().trim().min(15, "Descreve o flyer com pelo menos 15 caracteres.").max(2000),
  references: z.string().trim().max(500).optional().or(z.literal("")),
});

export const digitalSchema = z.object({
  qty: z.coerce.number().int().min(1).max(5).default(1),
});

export function firstIssue(error: z.ZodError): { field?: string; message: string } {
  const issue = error.issues[0];
  return {
    field: issue?.path.join("."),
    message: issue?.message ?? "Dados inválidos.",
  };
}

export function fieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "form";
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}

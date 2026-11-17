"use client";

import { useActionState, useState } from "react";

import { createOrderAction, type CheckoutState } from "@/app/actions/checkout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { formatAOA } from "@/lib/money";
import type { PaymentSettings } from "@/lib/settings";
import type { Json, ProductType } from "@/types/database";

type Props = {
  product: {
    id: string;
    type: ProductType;
    name: string;
    price: number;
    config: Record<string, Json | undefined>;
  };
  availableStock: number | null;
  fxRate: { buy: number; sell: number } | null;
  transfer: PaymentSettings["transfer"];
  cash: PaymentSettings["cash"];
};

const initial: CheckoutState = {};

export function CheckoutForm({ product, availableStock, fxRate, transfer, cash }: Props) {
  const [state, formAction, pending] = useActionState(createOrderAction, initial);
  const [qty, setQty] = useState(1);
  const [amount, setAmount] = useState("");
  const [direction, setDirection] = useState<"buy" | "sell">("buy");
  const [method, setMethod] = useState<"transfer" | "cash">(
    transfer.enabled ? "transfer" : "cash",
  );

  const errors = state.fieldErrors ?? {};

  const amountNumber = Number(amount.replace(",", "."));
  const fxTotal =
    Number.isFinite(amountNumber) && amountNumber > 0 && fxRate
      ? amountNumber * (direction === "buy" ? fxRate.sell : fxRate.buy)
      : 0;

  const total = product.type === "profile" ? product.price * qty : product.type === "fx" ? fxTotal : product.price;

  return (
    <form action={formAction} className="mt-8 grid gap-6 lg:grid-cols-[1.5fr_1fr]">
      <input type="hidden" name="productId" value={product.id} />

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Os teus dados</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="name">Nome completo</Label>
              <Input id="name" name="name" autoComplete="name" required />
              {errors.name ? <p className="text-destructive text-xs">{errors.name}</p> : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="whatsapp">WhatsApp</Label>
              <Input
                id="whatsapp"
                name="whatsapp"
                inputMode="tel"
                placeholder="923 000 000"
                autoComplete="tel"
                required
              />
              {errors.whatsapp ? (
                <p className="text-destructive text-xs">{errors.whatsapp}</p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email (opcional)</Label>
              <Input id="email" name="email" type="email" autoComplete="email" />
              {errors.email ? <p className="text-destructive text-xs">{errors.email}</p> : null}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Detalhes do pedido</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {product.type === "profile" ? (
              <div className="space-y-2">
                <Label htmlFor="qty">Quantidade de perfis</Label>
                <Input
                  id="qty"
                  name="qty"
                  type="number"
                  min={1}
                  max={Math.max(1, availableStock ?? 1)}
                  value={qty}
                  onChange={(event) => setQty(Number(event.target.value) || 1)}
                  required
                />
                <p className="text-muted-foreground text-xs">
                  {availableStock === 0
                    ? "Sem stock neste momento — fala connosco no WhatsApp."
                    : `Disponíveis agora: ${availableStock}`}
                </p>
                {errors.qty ? <p className="text-destructive text-xs">{errors.qty}</p> : null}
              </div>
            ) : null}

            {product.type === "fx" ? (
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="amount">Montante</Label>
                  <Input
                    id="amount"
                    name="amount"
                    inputMode="decimal"
                    placeholder="100"
                    value={amount}
                    onChange={(event) => setAmount(event.target.value)}
                    required
                  />
                  {errors.amount ? <p className="text-destructive text-xs">{errors.amount}</p> : null}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="direction">Operação</Label>
                  <select
                    id="direction"
                    name="direction"
                    value={direction}
                    onChange={(event) => setDirection(event.target.value as "buy" | "sell")}
                    className="border-input bg-background h-9 w-full rounded-md border px-3 text-sm"
                  >
                    <option value="buy">Quero comprar {(product.config.base as string) ?? "USD"}</option>
                    <option value="sell">Quero vender {(product.config.base as string) ?? "USD"}</option>
                  </select>
                </div>

                <p className="text-muted-foreground text-xs sm:col-span-2">
                  {fxRate
                    ? `Cotação actual: compra ${fxRate.buy} / venda ${fxRate.sell}. A taxa fica fixada quando o pedido é criado.`
                    : "Sem cotação activa neste momento."}
                </p>
              </div>
            ) : null}

            {product.type === "design" ? (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="briefing">Briefing</Label>
                  <Textarea
                    id="briefing"
                    name="briefing"
                    rows={5}
                    placeholder="Objectivo do flyer, texto, cores, estilo e prazo desejado."
                    required
                  />
                  {errors.briefing ? (
                    <p className="text-destructive text-xs">{errors.briefing}</p>
                  ) : null}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="references">Referências (opcional)</Label>
                  <Input id="references" name="references" placeholder="Links ou @ do Instagram" />
                </div>
              </div>
            ) : null}

            {product.type === "digital" ? (
              <p className="text-muted-foreground text-sm">
                Recebes o acesso por WhatsApp assim que o pagamento for confirmado.
              </p>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Pagamento</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              {transfer.enabled ? (
                <label
                  className={`cursor-pointer rounded-lg border p-4 text-sm ${
                    method === "transfer" ? "border-foreground" : "border-border"
                  }`}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="transfer"
                    className="sr-only"
                    checked={method === "transfer"}
                    onChange={() => setMethod("transfer")}
                  />
                  <span className="font-medium">Transferência bancária</span>
                  <span className="text-muted-foreground mt-1 block text-xs">
                    Envias o comprovativo depois de criar o pedido.
                  </span>
                </label>
              ) : null}

              {cash.enabled ? (
                <label
                  className={`cursor-pointer rounded-lg border p-4 text-sm ${
                    method === "cash" ? "border-foreground" : "border-border"
                  }`}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="cash"
                    className="sr-only"
                    checked={method === "cash"}
                    onChange={() => setMethod("cash")}
                  />
                  <span className="font-medium">Dinheiro / presencial</span>
                  <span className="text-muted-foreground mt-1 block text-xs">
                    {cash.instructions || "Pagas no acto da entrega."}
                  </span>
                </label>
              ) : null}
            </div>

            {method === "transfer" ? (
              <div className="bg-muted rounded-lg p-4 text-sm">
                <p className="font-medium">{transfer.bank}</p>
                <p className="text-muted-foreground">{transfer.holder}</p>
                <p className="mt-2 font-mono text-xs break-all">{transfer.iban}</p>
                {transfer.instructions ? (
                  <p className="text-muted-foreground mt-3 text-xs">{transfer.instructions}</p>
                ) : null}
              </div>
            ) : null}
          </CardContent>
        </Card>
      </div>

      <Card className="h-fit lg:sticky lg:top-24">
        <CardHeader>
          <CardTitle className="text-base">Resumo</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start justify-between gap-3 text-sm">
            <span className="text-muted-foreground">{product.name}</span>
            <span className="text-right font-medium">
              {product.type === "fx" ? "—" : formatAOA(product.price)}
            </span>
          </div>

          <div className="border-border/60 flex items-center justify-between border-t pt-3">
            <span className="text-sm font-medium">Total</span>
            <span className="text-lg font-semibold">
              {product.type === "fx" && total === 0 ? "—" : formatAOA(total)}
            </span>
          </div>

          {product.type === "fx" ? (
            <p className="text-muted-foreground text-xs">
              O valor em AOA é calculado com a cotação do momento em que confirmas.
            </p>
          ) : null}

          {state.error ? (
            <p className="bg-destructive/10 text-destructive rounded-md p-3 text-sm">{state.error}</p>
          ) : null}

          <Button type="submit" className="w-full" size="lg" disabled={pending}>
            {pending ? "A criar pedido…" : "Criar pedido"}
          </Button>

          <p className="text-muted-foreground text-xs">
            Ao continuar aceitas os termos de serviço e a política de entrega e garantia.
          </p>
        </CardContent>
      </Card>
    </form>
  );
}

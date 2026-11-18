import { addInventoryAction } from "@/app/actions/admin";
import { StockTable, type StockRow } from "@/app/admin/(painel)/estoque/stock-table";
import { Field, SELECT_CLASS } from "@/components/admin/field";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function AdminStockPage({
  searchParams,
}: {
  searchParams: Promise<{ msg?: string }>;
}) {
  const { msg } = await searchParams;
  const supabase = await createClient();

  const [{ data: products }, { data: inventory }] = await Promise.all([
    supabase.from("products").select("id, name, type").eq("type", "profile").order("name"),
    supabase
      .from("inventory_items")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(300),
  ]);

  const nameById = new Map((products ?? []).map((product) => [product.id, product.name]));

  const rows: StockRow[] = (inventory ?? []).map((item) => ({
    ...item,
    productName: nameById.get(item.product_id) ?? "Produto removido",
  }));

  const available = new Map<string, number>();
  for (const item of inventory ?? []) {
    if (item.status !== "available") continue;
    available.set(item.product_id, (available.get(item.product_id) ?? 0) + 1);
  }

  const totalAvailable = [...available.values()].reduce((sum, value) => sum + value, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Stock de perfis</h1>
        <p className="text-muted-foreground mt-0.5 text-sm">
          {totalAvailable} {totalAvailable === 1 ? "perfil disponível" : "perfis disponíveis"} para
          entrega imediata
        </p>
      </div>

      {msg ? <p className="bg-muted rounded-md px-4 py-3 text-sm">{decodeURIComponent(msg)}</p> : null}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Adicionar perfil</CardTitle>
        </CardHeader>
        <CardContent>
          {(products ?? []).length === 0 ? (
            <p className="text-muted-foreground text-sm">
              Cria primeiro um produto do tipo Perfil em{" "}
              <span className="text-foreground font-medium">Produtos</span>.
            </p>
          ) : (
            <form action={addInventoryAction} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field name="productId" label="Produto">
                  <select
                    id="productId"
                    name="productId"
                    className={SELECT_CLASS}
                    required
                  >
                    {(products ?? []).map((product) => (
                      <option key={product.id} value={product.id}>
                        {product.name} — {available.get(product.id) ?? 0} em stock
                      </option>
                    ))}
                  </select>
                </Field>

                <Field name="label" label="Etiqueta" hint="Como vais reconhecer este perfil na lista.">
                  <Input id="label" name="label" placeholder="Perfil #12" />
                </Field>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <Field name="email" label="Email da conta">
                  <Input id="email" name="email" autoComplete="off" placeholder="perfil@exemplo.com" />
                </Field>

                <Field name="password" label="Password">
                  <Input
                    id="password"
                    name="password"
                    autoComplete="new-password"
                    className="font-mono"
                  />
                </Field>

                <Field name="pin" label="PIN do perfil" hint="Netflix usa 4 dígitos.">
                  <Input id="pin" name="pin" inputMode="numeric" className="font-mono" />
                </Field>
              </div>

              <Field name="notes" label="Notas (opcional)">
                <Textarea
                  id="notes"
                  name="notes"
                  rows={2}
                  placeholder="Ex: perfil 3 da conta principal, renovar a 12/12."
                />
              </Field>

              <p className="text-muted-foreground text-xs">
                As credenciais são cifradas com AES-256-GCM e só aparecem no detalhe do pedido.
              </p>

              <Button type="submit">Adicionar ao stock</Button>
            </form>
          )}
        </CardContent>
      </Card>

      <StockTable products={products ?? []} items={rows} />
    </div>
  );
}

import { addInventoryAction, revokeInventoryAction } from "@/app/actions/admin";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const STATUS_TEXT: Record<string, string> = {
  available: "Disponível",
  assigned: "Atribuído",
  expired: "Expirado",
  revoked: "Revogado",
};

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
      .limit(100),
  ]);

  const counts = new Map<string, number>();
  for (const item of inventory ?? []) {
    if (item.status !== "available") continue;
    counts.set(item.product_id, (counts.get(item.product_id) ?? 0) + 1);
  }

  const productName = new Map((products ?? []).map((product) => [product.id, product.name]));

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">Stock de perfis</h1>

      {msg ? <p className="bg-muted rounded-md px-4 py-3 text-sm">{decodeURIComponent(msg)}</p> : null}

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Inventário</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {(inventory ?? []).map((item) => (
              <div
                key={item.id}
                className="border-border/60 flex flex-wrap items-center justify-between gap-2 border-b pb-2 text-sm last:border-0 last:pb-0"
              >
                <div>
                  <p className="font-medium">{item.label}</p>
                  <p className="text-muted-foreground text-xs">
                    {productName.get(item.product_id) ?? "produto removido"}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{STATUS_TEXT[item.status] ?? item.status}</Badge>
                  {item.status === "available" ? (
                    <form action={revokeInventoryAction}>
                      <input type="hidden" name="id" value={item.id} />
                      <Button type="submit" size="sm" variant="ghost" className="text-destructive">
                        Revogar
                      </Button>
                    </form>
                  ) : null}
                </div>
              </div>
            ))}

            {(inventory ?? []).length === 0 ? (
              <p className="text-muted-foreground text-sm">Sem itens em stock.</p>
            ) : null}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Disponibilidade</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {(products ?? []).map((product) => (
                <div key={product.id} className="flex justify-between">
                  <span className="text-muted-foreground">{product.name}</span>
                  <span className="font-medium">{counts.get(product.id) ?? 0}</span>
                </div>
              ))}
              {(products ?? []).length === 0 ? (
                <p className="text-muted-foreground">Cria primeiro um produto do tipo Perfil.</p>
              ) : null}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Adicionar perfil</CardTitle>
            </CardHeader>
            <CardContent>
              <form action={addInventoryAction} className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="productId">Produto</Label>
                  <select
                    id="productId"
                    name="productId"
                    className="border-input bg-background h-9 w-full rounded-md border px-3 text-sm"
                    required
                  >
                    {(products ?? []).map((product) => (
                      <option key={product.id} value={product.id}>
                        {product.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="label">Etiqueta</Label>
                  <Input id="label" name="label" placeholder="Perfil #12" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="secret">Credenciais</Label>
                  <Textarea
                    id="secret"
                    name="secret"
                    rows={3}
                    placeholder={"email:perfil@exemplo.com\npassword: xxxx\npin: 1234"}
                    className="font-mono text-xs"
                    required
                  />
                  <p className="text-muted-foreground text-xs">
                    Guardado com AES-256-GCM. Só aparece no detalhe do pedido entregue.
                  </p>
                </div>

                <Button type="submit" className="w-full">
                  Adicionar
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

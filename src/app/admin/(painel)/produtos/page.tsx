import Link from "next/link";

import { saveProductAction, toggleProductAction } from "@/app/actions/admin";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { formatAOA } from "@/lib/money";
import { TYPE_LABELS } from "@/lib/orders";
import { createClient } from "@/lib/supabase/server";
import type { Json, ProductType } from "@/types/database";

export const dynamic = "force-dynamic";

const TYPES: ProductType[] = ["profile", "fx", "design", "digital"];

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ msg?: string; edit?: string }>;
}) {
  const { msg, edit } = await searchParams;
  const supabase = await createClient();

  const { data: products } = await supabase
    .from("products")
    .select("*")
    .order("type", { ascending: true })
    .order("sort", { ascending: true });

  const editing = (products ?? []).find((product) => product.id === edit) ?? null;
  const config = (editing?.config ?? {}) as Record<string, Json | undefined>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">Produtos</h1>

      {msg ? <p className="bg-muted rounded-md px-4 py-3 text-sm">{decodeURIComponent(msg)}</p> : null}

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Catálogo</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {(products ?? []).map((product) => (
              <div
                key={product.id}
                className="border-border/60 flex flex-wrap items-center justify-between gap-3 border-b pb-3 last:border-0 last:pb-0"
              >
                <div>
                  <p className="text-sm font-medium">{product.name}</p>
                  <p className="text-muted-foreground text-xs">
                    {TYPE_LABELS[product.type]} · /{product.slug} · {formatAOA(product.price)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={product.active ? "default" : "outline"}>
                    {product.active ? "Activo" : "Inactivo"}
                  </Badge>
                  <Link
                    href={`/admin/produtos?edit=${product.id}`}
                    className={buttonVariants({ size: "sm", variant: "ghost" })}
                  >
                    Editar
                  </Link>
                  <form action={toggleProductAction}>
                    <input type="hidden" name="id" value={product.id} />
                    <input type="hidden" name="active" value={String(product.active)} />
                    <Button type="submit" size="sm" variant="outline">
                      {product.active ? "Desactivar" : "Activar"}
                    </Button>
                  </form>
                </div>
              </div>
            ))}

            {(products ?? []).length === 0 ? (
              <p className="text-muted-foreground text-sm">Sem produtos.</p>
            ) : null}
          </CardContent>
        </Card>

        <Card className="h-fit">
          <CardHeader>
            <CardTitle className="text-base">
              {editing ? `Editar: ${editing.name}` : "Novo produto"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form action={saveProductAction} className="space-y-3">
              {editing ? <input type="hidden" name="id" value={editing.id} /> : null}

              <div className="space-y-2">
                <Label htmlFor="type">Tipo</Label>
                <select
                  id="type"
                  name="type"
                  defaultValue={editing?.type ?? "profile"}
                  className="border-input bg-background h-9 w-full rounded-md border px-3 text-sm"
                >
                  {TYPES.map((type) => (
                    <option key={type} value={type}>
                      {TYPE_LABELS[type]}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="name">Nome</Label>
                <Input id="name" name="name" defaultValue={editing?.name ?? ""} required />
              </div>

              <div className="space-y-2">
                <Label htmlFor="slug">Slug</Label>
                <Input id="slug" name="slug" defaultValue={editing?.slug ?? ""} required />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  name="description"
                  rows={3}
                  defaultValue={editing?.description ?? ""}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="price">Preço (AOA)</Label>
                  <Input
                    id="price"
                    name="price"
                    type="number"
                    step="0.01"
                    min="0"
                    defaultValue={editing?.price ?? 0}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sort">Ordem</Label>
                  <Input id="sort" name="sort" type="number" defaultValue={editing?.sort ?? 0} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="duration_days">Dias (perfis)</Label>
                  <Input
                    id="duration_days"
                    name="duration_days"
                    type="number"
                    defaultValue={(config.duration_days as number) ?? 30}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="warranty_days">Garantia (dias)</Label>
                  <Input
                    id="warranty_days"
                    name="warranty_days"
                    type="number"
                    defaultValue={(config.warranty_days as number) ?? 7}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="base">Moeda (câmbio)</Label>
                  <Input id="base" name="base" defaultValue={(config.base as string) ?? "USD"} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="quote">Contra-moeda</Label>
                  <Input id="quote" name="quote" defaultValue={(config.quote as string) ?? "AOA"} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="min_amount">Mínimo (câmbio)</Label>
                  <Input
                    id="min_amount"
                    name="min_amount"
                    type="number"
                    defaultValue={(config.min_amount as number) ?? 0}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="delivery_hours">Prazo (design, h)</Label>
                  <Input
                    id="delivery_hours"
                    name="delivery_hours"
                    type="number"
                    defaultValue={(config.delivery_hours as number) ?? 48}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="config_json">Config avançada (JSON)</Label>
                <Textarea
                  id="config_json"
                  name="config_json"
                  rows={3}
                  defaultValue={editing ? JSON.stringify(editing.config) : "{}"}
                  className="font-mono text-xs"
                />
              </div>

              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" name="active" defaultChecked={editing?.active ?? true} />
                Activo
              </label>

              <Button type="submit" className="w-full">
                {editing ? "Guardar alterações" : "Criar produto"}
              </Button>

              {editing ? (
                <Link
                  href="/admin/produtos"
                  className={buttonVariants({ variant: "ghost", className: "w-full" })}
                >
                  Cancelar edição
                </Link>
              ) : null}
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

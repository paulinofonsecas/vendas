"use client";

import Link from "next/link";
import { useState } from "react";

import { saveProductAction } from "@/app/actions/admin";
import { Field, SELECT_CLASS } from "@/components/admin/field";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { TYPE_META, TYPE_ORDER } from "@/lib/catalog";
import type { Json, ProductRow, ProductType } from "@/types/database";

function configOf(product?: ProductRow): Record<string, Json | undefined> {
  const value = product?.config;
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, Json | undefined>)
    : {};
}

export function ProductForm({ product }: { product?: ProductRow }) {
  const config = configOf(product);
  const [type, setType] = useState<ProductType>(product?.type ?? "profile");

  return (
    <form action={saveProductAction} className="space-y-6">
      {product ? <input type="hidden" name="id" value={product.id} /> : null}

      <div className="border-border/60 space-y-4 rounded-lg border p-4 sm:p-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field name="type" label="Tipo de produto" hint="Define os campos e o checkout aplicável.">
            <select
              id="type"
              name="type"
              value={type}
              onChange={(event) => setType(event.target.value as ProductType)}
              className={SELECT_CLASS}
            >
              {TYPE_ORDER.map((item) => (
                <option key={item} value={item}>
                  {TYPE_META[item].label}
                </option>
              ))}
            </select>
          </Field>

          <Field name="sort" label="Ordem" hint="Menor aparece primeiro nas prateleiras.">
            <Input id="sort" name="sort" type="number" defaultValue={product?.sort ?? 0} />
          </Field>

          <Field name="name" label="Nome">
            <Input id="name" name="name" defaultValue={product?.name ?? ""} required />
          </Field>

          <Field name="slug" label="Slug" hint="Usado no URL: /p/nome-do-produto">
            <Input
              id="slug"
              name="slug"
              defaultValue={product?.slug ?? ""}
              placeholder="netflix-1-ecra"
              required
            />
          </Field>
        </div>

        <Field name="description" label="Descrição">
          <Textarea
            id="description"
            name="description"
            rows={3}
            defaultValue={product?.description ?? ""}
          />
        </Field>

        <div className="grid gap-4 sm:grid-cols-3">
          <Field
            name="price"
            label="Preço (AOA)"
            hint={type === "fx" ? "No câmbio o preço vem da taxa; deixa 0." : undefined}
          >
            <Input
              id="price"
              name="price"
              type="number"
              step="0.01"
              min="0"
              defaultValue={product?.price ?? 0}
            />
          </Field>

          <Field
            name="compare_at_price"
            label="Preço antes (opcional)"
            hint="Preenche para mostrar o desconto e criar a prateleira Ofertas."
          >
            <Input
              id="compare_at_price"
              name="compare_at_price"
              type="number"
              step="0.01"
              min="0"
              defaultValue={product?.compare_at_price ?? ""}
            />
          </Field>

          <div className="flex items-end">
            <label className="flex h-9 items-center gap-2 text-sm">
              <input
                type="checkbox"
                name="active"
                defaultChecked={product?.active ?? true}
                className="size-4"
              />
              Visível na loja
            </label>
          </div>
        </div>
      </div>

      <div className="border-border/60 space-y-4 rounded-lg border p-4 sm:p-6">
        <p className="text-sm font-semibold">
          Configuração de {TYPE_META[type].label.toLowerCase()}
        </p>

        {type === "profile" ? (
          <div className="grid gap-4 sm:grid-cols-3">
            <Field name="duration_days" label="Validade (dias)">
              <Input
                id="duration_days"
                name="duration_days"
                type="number"
                min="1"
                defaultValue={(config.duration_days as number) ?? 30}
              />
            </Field>
            <Field name="warranty_days" label="Garantia (dias)">
              <Input
                id="warranty_days"
                name="warranty_days"
                type="number"
                min="0"
                defaultValue={(config.warranty_days as number) ?? 7}
              />
            </Field>
            <Field name="screens" label="Ecrãs">
              <Input
                id="screens"
                name="screens"
                type="number"
                min="1"
                defaultValue={(config.screens as number) ?? 1}
              />
            </Field>
          </div>
        ) : null}

        {type === "fx" ? (
          <div className="grid gap-4 sm:grid-cols-3">
            <Field name="base" label="Moeda base">
              <Input id="base" name="base" defaultValue={(config.base as string) ?? "USD"} />
            </Field>
            <Field name="quote" label="Contra-moeda">
              <Input id="quote" name="quote" defaultValue={(config.quote as string) ?? "AOA"} />
            </Field>
            <Field name="min_amount" label="Montante mínimo" hint="Na moeda base.">
              <Input
                id="min_amount"
                name="min_amount"
                type="number"
                min="0"
                step="0.01"
                defaultValue={(config.min_amount as number) ?? 0}
              />
            </Field>
          </div>
        ) : null}

        {type === "design" ? (
          <div className="grid gap-4 sm:grid-cols-3">
            <Field name="delivery_hours" label="Prazo de entrega (h)">
              <Input
                id="delivery_hours"
                name="delivery_hours"
                type="number"
                min="1"
                defaultValue={(config.delivery_hours as number) ?? 48}
              />
            </Field>
            <Field name="revisions" label="Revisões incluídas">
              <Input
                id="revisions"
                name="revisions"
                type="number"
                min="0"
                defaultValue={(config.revisions as number) ?? 2}
              />
            </Field>
            <Field name="formats" label="Formatos" hint="Separados por vírgula.">
              <Input
                id="formats"
                name="formats"
                defaultValue={Array.isArray(config.formats) ? (config.formats as string[]).join(", ") : "1080x1080"}
              />
            </Field>
          </div>
        ) : null}

        {type === "digital" ? (
          <div className="grid gap-4 sm:grid-cols-2">
            <Field name="delivery" label="Forma de entrega">
              <select
                id="delivery"
                name="delivery"
                defaultValue={(config.delivery as string) ?? "link"}
                className={SELECT_CLASS}
              >
                <option value="link">Link de download</option>
                <option value="file">Ficheiro enviado no chat</option>
                <option value="area">Área de membros</option>
              </select>
            </Field>
            <Field name="format" label="Formato do ficheiro">
              <select
                id="format"
                name="format"
                defaultValue={(config.format as string) ?? "pdf"}
                className={SELECT_CLASS}
              >
                {["pdf", "xlsx", "zip", "canva", "video", "outro"].map((format) => (
                  <option key={format} value={format}>
                    {format.toUpperCase()}
                  </option>
                ))}
              </select>
            </Field>
          </div>
        ) : null}
      </div>

      <div className="flex flex-wrap gap-2">
        <Button type="submit">{product ? "Guardar alterações" : "Criar produto"}</Button>
        <Link href="/admin/produtos" className={buttonVariants({ variant: "ghost" })}>
          Cancelar
        </Link>
      </div>
    </form>
  );
}

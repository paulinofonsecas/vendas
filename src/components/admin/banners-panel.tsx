"use client";

import { useState } from "react";
import { MoreHorizontal, Pencil, Plus, Power, Trash2 } from "lucide-react";

import { deleteBannerAction, saveBannerAction, toggleBannerAction } from "@/app/actions/admin";
import { Field } from "@/components/admin/field";
import { SideDrawer } from "@/components/admin/side-drawer";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { BannerRow } from "@/types/database";

function when(value: string | null): string {
  if (!value) return "—";
  return new Intl.DateTimeFormat("pt-PT", { dateStyle: "short", timeStyle: "short" }).format(
    new Date(value),
  );
}

function BannerForm({ banner }: { banner?: BannerRow }) {
  return (
    <form action={saveBannerAction} className="space-y-4">
      {banner ? <input type="hidden" name="id" value={banner.id} /> : null}

      <Field
        name="image"
        label="Imagem (1920×400)"
        hint="URL pública. É a mesma imagem usada no preview social."
      >
        <Input id="image" name="image" defaultValue={banner?.image ?? ""} required />
      </Field>

      <Field name="title" label="Título" hint="Opcional. Sem título, o banner inteiro fica clicável.">
        <Input id="title" name="title" defaultValue={banner?.title ?? ""} />
      </Field>

      <Field name="href" label="Link">
        <Input
          id="href"
          name="href"
          defaultValue={banner?.href ?? "/#catalogo"}
          placeholder="/categoria/profile"
        />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field name="sort" label="Ordem">
          <Input id="sort" name="sort" type="number" defaultValue={banner?.sort ?? 0} />
        </Field>
        <div className="flex items-end">
          <label className="flex h-9 items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="active"
              defaultChecked={banner?.active ?? true}
              className="size-4"
            />
            Activo
          </label>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field name="starts_at" label="Começa em" hint="Opcional.">
          <Input
            id="starts_at"
            name="starts_at"
            type="datetime-local"
            defaultValue={banner?.starts_at?.slice(0, 16) ?? ""}
          />
        </Field>
        <Field name="ends_at" label="Termina em" hint="Opcional.">
          <Input
            id="ends_at"
            name="ends_at"
            type="datetime-local"
            defaultValue={banner?.ends_at?.slice(0, 16) ?? ""}
          />
        </Field>
      </div>

      <input type="hidden" name="subtitle" value={banner?.subtitle ?? ""} />
      <input type="hidden" name="cta" value={banner?.cta ?? ""} />

      <Button type="submit" className="w-full">
        {banner ? "Guardar alterações" : "Criar banner"}
      </Button>
    </form>
  );
}

export function BannersPanel({ banners }: { banners: BannerRow[] }) {
  const [editing, setEditing] = useState<BannerRow | null>(null);
  const [creating, setCreating] = useState(false);
  const [menu, setMenu] = useState<string | null>(null);

  const open = creating || editing !== null;

  function close() {
    setCreating(false);
    setEditing(null);
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-3">
        <div>
          <CardTitle className="text-base">Carrossel</CardTitle>
          <p className="text-muted-foreground mt-0.5 text-xs">
            {banners.length} no total · {banners.filter((banner) => banner.active).length} activos
          </p>
        </div>

        <Button
          type="button"
          size="sm"
          onClick={() => {
            setEditing(null);
            setCreating(true);
          }}
        >
          <Plus className="size-4" />
          Adicionar
        </Button>
      </CardHeader>

      <CardContent>
        <div className="border-border/60 overflow-x-auto rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Banner</TableHead>
                <TableHead className="w-16">Ordem</TableHead>
                <TableHead>Janela</TableHead>
                <TableHead className="w-24">Estado</TableHead>
                <TableHead className="w-12" />
              </TableRow>
            </TableHeader>

            <TableBody>
              {banners.map((banner) => (
                <TableRow key={banner.id}>
                  <TableCell className="max-w-[320px]">
                    <div className="flex items-center gap-3">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={banner.image}
                        alt=""
                        className="h-8 w-20 shrink-0 rounded object-cover"
                      />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">
                          {banner.title || "(só imagem)"}
                        </p>
                        <p className="text-muted-foreground truncate font-mono text-[11px]">
                          {banner.href}
                        </p>
                      </div>
                    </div>
                  </TableCell>

                  <TableCell className="text-muted-foreground text-sm">{banner.sort}</TableCell>

                  <TableCell className="text-muted-foreground text-xs whitespace-nowrap">
                    {banner.starts_at || banner.ends_at
                      ? `${when(banner.starts_at)} → ${when(banner.ends_at)}`
                      : "Sempre"}
                  </TableCell>

                  <TableCell>
                    <Badge variant={banner.active ? "default" : "outline"}>
                      {banner.active ? "Activo" : "Inactivo"}
                    </Badge>
                  </TableCell>

                  <TableCell className="relative">
                    <button
                      type="button"
                      aria-label="Acções"
                      aria-expanded={menu === banner.id}
                      onClick={() => setMenu(menu === banner.id ? null : banner.id)}
                      className="hover:bg-muted rounded-md p-1.5"
                    >
                      <MoreHorizontal className="size-4" />
                    </button>

                    {menu === banner.id ? (
                      <>
                        <button
                          type="button"
                          aria-label="Fechar menu"
                          onClick={() => setMenu(null)}
                          className="fixed inset-0 z-10 cursor-default"
                        />
                        <div className="border-border bg-popover absolute top-full right-0 z-20 mt-1 w-44 overflow-hidden rounded-lg border shadow-xl">
                          <button
                            type="button"
                            onClick={() => {
                              setMenu(null);
                              setCreating(false);
                              setEditing(banner);
                            }}
                            className="hover:bg-muted flex w-full items-center gap-2 px-3 py-2 text-left text-sm"
                          >
                            <Pencil className="size-3.5" />
                            Editar
                          </button>

                          <form action={toggleBannerAction}>
                            <input type="hidden" name="id" value={banner.id} />
                            <input type="hidden" name="active" value={String(banner.active)} />
                            <button
                              type="submit"
                              className="hover:bg-muted flex w-full items-center gap-2 px-3 py-2 text-left text-sm"
                            >
                              <Power className="size-3.5" />
                              {banner.active ? "Desactivar" : "Activar"}
                            </button>
                          </form>

                          <form action={deleteBannerAction}>
                            <input type="hidden" name="id" value={banner.id} />
                            <button
                              type="submit"
                              className="hover:bg-muted text-destructive flex w-full items-center gap-2 px-3 py-2 text-left text-sm"
                            >
                              <Trash2 className="size-3.5" />
                              Apagar
                            </button>
                          </form>
                        </div>
                      </>
                    ) : null}
                  </TableCell>
                </TableRow>
              ))}

              {banners.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-muted-foreground py-12 text-center text-sm">
                    Sem banners. Usa <strong>Adicionar</strong> para criar o primeiro.
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </div>

        <a
          href="/admin/telemetria"
          className={buttonVariants({ variant: "link", size: "sm", className: "mt-2 px-0 text-xs" })}
        >
          Ver cliques nos banners na telemetria
        </a>
      </CardContent>

      <SideDrawer
        open={open}
        onClose={close}
        title={editing ? "Editar banner" : "Novo banner"}
        description="1920×400. A janela de datas é opcional."
      >
        <BannerForm key={editing?.id ?? "novo"} banner={editing ?? undefined} />
      </SideDrawer>
    </Card>
  );
}

"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowDown, ArrowUp, ChevronsUpDown } from "lucide-react";

import { toggleProductAction } from "@/app/actions/admin";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TYPE_META, TYPE_ORDER } from "@/lib/catalog";
import { formatAOA } from "@/lib/money";
import type { ProductRow, ProductType } from "@/types/database";

type SortKey = "name" | "type" | "price" | "sort" | "active";

const SELECT =
  "border-input bg-background h-9 w-full rounded-lg border px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

function SortHeader({
  label,
  sortKey,
  current,
  direction,
  onSort,
}: {
  label: string;
  sortKey: SortKey;
  current: SortKey;
  direction: "asc" | "desc";
  onSort: (key: SortKey) => void;
}) {
  const active = current === sortKey;
  const Icon = !active ? ChevronsUpDown : direction === "asc" ? ArrowUp : ArrowDown;

  return (
    <button
      type="button"
      onClick={() => onSort(sortKey)}
      className="hover:text-foreground flex items-center gap-1 font-medium whitespace-nowrap transition"
    >
      {label}
      <Icon className={`size-3.5 ${active ? "text-foreground" : "text-muted-foreground/60"}`} />
    </button>
  );
}

export function ProductsTable({ products }: { products: ProductRow[] }) {
  const [search, setSearch] = useState("");
  const [type, setType] = useState<ProductType | "all">("all");
  const [status, setStatus] = useState<"all" | "active" | "inactive">("all");
  const [sortKey, setSortKey] = useState<SortKey>("sort");
  const [direction, setDirection] = useState<"asc" | "desc">("asc");

  function onSort(key: SortKey) {
    if (key === sortKey) {
      setDirection((d) => (d === "asc" ? "desc" : "asc"));
      return;
    }
    setSortKey(key);
    setDirection(key === "name" || key === "type" ? "asc" : "desc");
  }

  const rows = useMemo(() => {
    const term = search.trim().toLowerCase();

    const filtered = products.filter((product) => {
      if (type !== "all" && product.type !== type) return false;
      if (status === "active" && !product.active) return false;
      if (status === "inactive" && product.active) return false;
      if (!term) return true;
      return (
        product.name.toLowerCase().includes(term) ||
        product.slug.toLowerCase().includes(term) ||
        product.description.toLowerCase().includes(term)
      );
    });

    const factor = direction === "asc" ? 1 : -1;

    return [...filtered].sort((a, b) => {
      switch (sortKey) {
        case "name":
          return a.name.localeCompare(b.name, "pt") * factor;
        case "type":
          return a.type.localeCompare(b.type) * factor;
        case "price":
          return (Number(a.price) - Number(b.price)) * factor;
        case "active":
          return (Number(a.active) - Number(b.active)) * factor;
        default:
          return (a.sort - b.sort) * factor;
      }
    });
  }, [products, search, type, status, sortKey, direction]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Procurar por nome, slug ou descrição…"
          className="h-9 sm:max-w-sm"
          aria-label="Procurar produtos"
        />

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={type}
            onChange={(event) => setType(event.target.value as ProductType | "all")}
            className={`${SELECT} w-auto`}
            aria-label="Filtrar por tipo"
          >
            <option value="all">Todos os tipos</option>
            {TYPE_ORDER.map((item) => (
              <option key={item} value={item}>
                {TYPE_META[item].label}
              </option>
            ))}
          </select>

          <select
            value={status}
            onChange={(event) => setStatus(event.target.value as typeof status)}
            className={`${SELECT} w-auto`}
            aria-label="Filtrar por estado"
          >
            <option value="all">Todos os estados</option>
            <option value="active">Activos</option>
            <option value="inactive">Inactivos</option>
          </select>

          <span className="text-muted-foreground ml-auto text-xs sm:ml-2">
            {rows.length} de {products.length}
          </span>
        </div>
      </div>

      <div className="border-border/60 overflow-x-auto rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>
                <SortHeader
                  label="Produto"
                  sortKey="name"
                  current={sortKey}
                  direction={direction}
                  onSort={onSort}
                />
              </TableHead>
              <TableHead>
                <SortHeader
                  label="Tipo"
                  sortKey="type"
                  current={sortKey}
                  direction={direction}
                  onSort={onSort}
                />
              </TableHead>
              <TableHead className="text-right">
                <div className="flex justify-end">
                  <SortHeader
                    label="Preço"
                    sortKey="price"
                    current={sortKey}
                    direction={direction}
                    onSort={onSort}
                  />
                </div>
              </TableHead>
              <TableHead className="text-right">
                <div className="flex justify-end">
                  <SortHeader
                    label="Ordem"
                    sortKey="sort"
                    current={sortKey}
                    direction={direction}
                    onSort={onSort}
                  />
                </div>
              </TableHead>
              <TableHead>
                <SortHeader
                  label="Estado"
                  sortKey="active"
                  current={sortKey}
                  direction={direction}
                  onSort={onSort}
                />
              </TableHead>
              <TableHead className="text-right">Acções</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {rows.map((product) => (
              <TableRow key={product.id}>
                <TableCell className="max-w-[280px]">
                  <p className="truncate font-medium">{product.name}</p>
                  <p className="text-muted-foreground font-mono text-xs">/{product.slug}</p>
                </TableCell>

                <TableCell>
                  <Badge variant="outline">{TYPE_META[product.type].label}</Badge>
                </TableCell>

                <TableCell className="text-right text-sm whitespace-nowrap">
                  {product.type === "fx" ? "—" : formatAOA(product.price)}
                </TableCell>

                <TableCell className="text-muted-foreground text-right text-sm">
                  {product.sort}
                </TableCell>

                <TableCell>
                  <Badge variant={product.active ? "default" : "outline"}>
                    {product.active ? "Activo" : "Inactivo"}
                  </Badge>
                </TableCell>

                <TableCell>
                  <div className="flex items-center justify-end gap-1">
                    <Link
                      href={`/admin/produtos/${product.id}`}
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
                </TableCell>
              </TableRow>
            ))}

            {rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-muted-foreground py-12 text-center text-sm">
                  Nenhum produto corresponde a estes filtros.
                </TableCell>
              </TableRow>
            ) : null}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

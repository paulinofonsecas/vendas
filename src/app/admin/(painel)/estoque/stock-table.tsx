"use client";

import { useMemo, useState } from "react";
import { ArrowDown, ArrowUp, ChevronsUpDown } from "lucide-react";

import { revokeInventoryAction } from "@/app/actions/admin";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { InventoryItemRow, InventoryStatus } from "@/types/database";

export type StockRow = InventoryItemRow & { productName: string };

const SELECT =
  "border-input bg-background h-9 w-full rounded-lg border px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

const STATUS_LABEL: Record<InventoryStatus, string> = {
  available: "Disponível",
  assigned: "Atribuído",
  expired: "Expirado",
  revoked: "Revogado",
};

const STATUS_STYLE: Record<InventoryStatus, string> = {
  available: "border-emerald-500/30 bg-emerald-500/15 text-emerald-300",
  assigned: "border-sky-500/30 bg-sky-500/15 text-sky-300",
  expired: "border-amber-500/30 bg-amber-500/15 text-amber-300",
  revoked: "border-neutral-500/30 bg-neutral-500/15 text-neutral-300",
};

type SortKey = "label" | "product" | "status" | "created_at";

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

function shortDate(value: string | null): string {
  if (!value) return "—";
  return new Intl.DateTimeFormat("pt-PT", { dateStyle: "short" }).format(new Date(value));
}

export function StockTable({
  items,
  products,
}: {
  items: StockRow[];
  products: { id: string; name: string }[];
}) {
  const [search, setSearch] = useState("");
  const [product, setProduct] = useState("all");
  const [status, setStatus] = useState<InventoryStatus | "all">("all");
  const [sortKey, setSortKey] = useState<SortKey>("created_at");
  const [direction, setDirection] = useState<"asc" | "desc">("desc");

  function onSort(key: SortKey) {
    if (key === sortKey) {
      setDirection((d) => (d === "asc" ? "desc" : "asc"));
      return;
    }
    setSortKey(key);
    setDirection(key === "created_at" ? "desc" : "asc");
  }

  const rows = useMemo(() => {
    const term = search.trim().toLowerCase();

    const filtered = items.filter((item) => {
      if (product !== "all" && item.product_id !== product) return false;
      if (status !== "all" && item.status !== status) return false;
      if (!term) return true;
      return (
        item.label.toLowerCase().includes(term) ||
        item.productName.toLowerCase().includes(term)
      );
    });

    const factor = direction === "asc" ? 1 : -1;

    return [...filtered].sort((a, b) => {
      switch (sortKey) {
        case "label":
          return a.label.localeCompare(b.label, "pt") * factor;
        case "product":
          return a.productName.localeCompare(b.productName, "pt") * factor;
        case "status":
          return a.status.localeCompare(b.status) * factor;
        default:
          return (new Date(a.created_at).getTime() - new Date(b.created_at).getTime()) * factor;
      }
    });
  }, [items, search, product, status, sortKey, direction]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Procurar por etiqueta ou produto…"
          className="h-9 sm:max-w-xs"
          aria-label="Procurar stock"
        />

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={product}
            onChange={(event) => setProduct(event.target.value)}
            className={`${SELECT} w-auto`}
            aria-label="Filtrar por produto"
          >
            <option value="all">Todos os produtos</option>
            {products.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>

          <select
            value={status}
            onChange={(event) => setStatus(event.target.value as InventoryStatus | "all")}
            className={`${SELECT} w-auto`}
            aria-label="Filtrar por estado"
          >
            <option value="all">Todos os estados</option>
            <option value="available">Disponível</option>
            <option value="assigned">Atribuído</option>
            <option value="expired">Expirado</option>
            <option value="revoked">Revogado</option>
          </select>

          <span className="text-muted-foreground ml-auto text-xs sm:ml-2">
            {rows.length} de {items.length}
          </span>
        </div>
      </div>

      <div className="border-border/60 overflow-x-auto rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>
                <SortHeader
                  label="Etiqueta"
                  sortKey="label"
                  current={sortKey}
                  direction={direction}
                  onSort={onSort}
                />
              </TableHead>
              <TableHead>
                <SortHeader
                  label="Produto"
                  sortKey="product"
                  current={sortKey}
                  direction={direction}
                  onSort={onSort}
                />
              </TableHead>
              <TableHead>
                <SortHeader
                  label="Estado"
                  sortKey="status"
                  current={sortKey}
                  direction={direction}
                  onSort={onSort}
                />
              </TableHead>
              <TableHead>
                <SortHeader
                  label="Adicionado"
                  sortKey="created_at"
                  current={sortKey}
                  direction={direction}
                  onSort={onSort}
                />
              </TableHead>
              <TableHead>Expira</TableHead>
              <TableHead className="text-right">Acções</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {rows.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="max-w-[220px]">
                  <p className="truncate font-medium">{item.label}</p>
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">{item.productName}</TableCell>
                <TableCell>
                  <Badge className={STATUS_STYLE[item.status]}>{STATUS_LABEL[item.status]}</Badge>
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {shortDate(item.created_at)}
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {shortDate(item.expires_at)}
                </TableCell>
                <TableCell className="text-right">
                  {item.status === "available" ? (
                    <form action={revokeInventoryAction} className="flex justify-end">
                      <input type="hidden" name="id" value={item.id} />
                      <Button type="submit" size="sm" variant="ghost">
                        Revogar
                      </Button>
                    </form>
                  ) : (
                    <span className="text-muted-foreground text-xs">—</span>
                  )}
                </TableCell>
              </TableRow>
            ))}

            {rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-muted-foreground py-12 text-center text-sm">
                  Sem itens para estes filtros.
                </TableCell>
              </TableRow>
            ) : null}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

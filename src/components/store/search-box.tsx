"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Loader2, Search, X } from "lucide-react";

import type { SuggestionResponse } from "@/app/api/search/route";
import { TYPE_META } from "@/lib/catalog";
import { formatAOA } from "@/lib/money";

const EMPTY: SuggestionResponse = { products: [], categories: [] };

export function SearchBox({
  className = "",
  inputClassName = "",
  autoFocus = false,
}: {
  className?: string;
  inputClassName?: string;
  autoFocus?: boolean;
}) {
  const router = useRouter();
  const wrapperRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<SuggestionResponse>(EMPTY);
  const [active, setActive] = useState(-1);

  const total = data.products.length + data.categories.length;

  useEffect(() => {
    function onClickOutside(event: MouseEvent) {
      if (!wrapperRef.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  useEffect(() => {
    const term = query.trim();

    if (abortRef.current) abortRef.current.abort();
    if (timerRef.current) clearTimeout(timerRef.current);

    if (term.length < 2) return;

    timerRef.current = setTimeout(async () => {
      setLoading(true);

      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(term)}`, {
          signal: controller.signal,
        });
        if (!res.ok) throw new Error("falha");
        setData((await res.json()) as SuggestionResponse);
        setActive(-1);
      } catch {
        if (!controller.signal.aborted) setData(EMPTY);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 220);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [query]);

  function hrefFor(index: number): string | null {
    if (index < data.categories.length) {
      const category = data.categories[index];
      return category ? `/categoria/${category.type}` : null;
    }
    const product = data.products[index - data.categories.length];
    return product ? `/p/${product.slug}` : null;
  }

  function onKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Escape") {
      setOpen(false);
      return;
    }

    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      if (!open || total === 0) return;
      event.preventDefault();
      setActive((current) => {
        const next = event.key === "ArrowDown" ? current + 1 : current - 1;
        if (next < 0) return total - 1;
        if (next >= total) return 0;
        return next;
      });
      return;
    }

    if (event.key === "Enter" && open && active >= 0) {
      const href = hrefFor(active);
      if (href) {
        event.preventDefault();
        setOpen(false);
        router.push(href);
      }
    }
  }

  const showPanel = open && query.trim().length >= 2;

  return (
    <div ref={wrapperRef} className={`relative ${className}`}>
      <form action="/pesquisa" role="search" onSubmit={() => setOpen(false)}>
        <Search
          aria-hidden
          className="text-muted-foreground pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2"
        />
        <input
          name="q"
          type="search"
          value={query}
          autoFocus={autoFocus}
          onChange={(event) => {
            const value = event.target.value;
            setQuery(value);
            setOpen(true);

            if (value.trim().length < 2) {
              setData(EMPTY);
              setLoading(false);
              setActive(-1);
            }
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          placeholder="O que procuras? Perfis, câmbio, flyers…"
          aria-label="Pesquisar produtos"
          role="combobox"
          aria-autocomplete="list"
          aria-haspopup="listbox"
          aria-expanded={showPanel}
          aria-controls="search-suggestions"
          autoComplete="off"
          className={`border-border bg-muted/60 placeholder:text-muted-foreground/80 hover:bg-muted focus:border-foreground/25 focus:bg-background h-12 w-full rounded-full border pr-10 pl-12 text-base outline-none transition focus:ring-4 focus:ring-foreground/5 [&::-webkit-search-cancel-button]:hidden ${inputClassName}`}
        />

        {query ? (
          <button
            type="button"
            onClick={() => {
              setQuery("");
              setData(EMPTY);
              setLoading(false);
              setActive(-1);
            }}
            aria-label="Limpar pesquisa"
            className="text-muted-foreground hover:text-foreground absolute top-1/2 right-3 -translate-y-1/2 rounded-full p-1"
          >
            <X className="size-4" />
          </button>
        ) : null}
      </form>

      {showPanel ? (
        <div
          id="search-suggestions"
          role="listbox"
          className="border-border bg-card absolute inset-x-0 top-full z-50 mt-2 overflow-hidden rounded-xl border shadow-2xl shadow-black/40"
        >
          <div className="max-h-[70vh] overflow-y-auto overscroll-contain py-1.5">
            {loading && total === 0 ? (
              <p className="text-muted-foreground flex items-center gap-2 px-4 py-3 text-sm">
                <Loader2 className="size-4 animate-spin" /> A procurar…
              </p>
            ) : null}

            {data.categories.length > 0 ? (
              <div className="px-1.5 pb-1">
                <p className="text-muted-foreground px-2.5 py-1 text-[10px] font-semibold tracking-wider uppercase">
                  Categorias
                </p>
                {data.categories.map((category, index) => (
                  <Link
                    key={category.type}
                    href={`/categoria/${category.type}`}
                    role="option"
                    aria-selected={active === index}
                    onMouseEnter={() => setActive(index)}
                    onClick={() => setOpen(false)}
                    className={`flex items-center justify-between rounded-lg px-2.5 py-2 text-sm ${
                      active === index ? "bg-muted" : ""
                    }`}
                  >
                    <span className="font-medium">{category.label}</span>
                    <span className="text-muted-foreground text-xs">Ver categoria</span>
                  </Link>
                ))}
              </div>
            ) : null}

            {data.products.length > 0 ? (
              <div className="px-1.5">
                {data.categories.length > 0 ? (
                  <p className="text-muted-foreground px-2.5 py-1 text-[10px] font-semibold tracking-wider uppercase">
                    Produtos
                  </p>
                ) : null}

                {data.products.map((product, index) => {
                  const position = data.categories.length + index;
                  const theme = TYPE_META[product.type];

                  return (
                    <Link
                      key={product.slug}
                      href={`/p/${product.slug}`}
                      role="option"
                      aria-selected={active === position}
                      onMouseEnter={() => setActive(position)}
                      onClick={() => setOpen(false)}
                      className={`flex items-center gap-3 rounded-lg px-2.5 py-2 ${
                        active === position ? "bg-muted" : ""
                      }`}
                    >
                      <span
                        aria-hidden
                        className={`size-9 shrink-0 rounded-md bg-gradient-to-br ${theme.gradient}`}
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium">{product.name}</span>
                        <span className="text-muted-foreground block truncate text-xs">
                          {theme.label}
                          {product.meta.startsWith("-") ? ` · ${product.meta}` : ""}
                        </span>
                      </span>
                      <span className="shrink-0 text-sm font-semibold">
                        {product.type === "fx" ? "Taxa" : formatAOA(product.price)}
                      </span>
                    </Link>
                  );
                })}
              </div>
            ) : null}

            {!loading && total === 0 ? (
              <div className="px-4 py-5 text-sm">
                <p className="font-medium">Sem resultados para “{query.trim()}”</p>
                <p className="text-muted-foreground mt-1 text-xs">
                  Tenta outra palavra ou fala connosco no WhatsApp.
                </p>
              </div>
            ) : null}
          </div>

          <Link
            href={`/pesquisa?q=${encodeURIComponent(query.trim())}`}
            onClick={() => setOpen(false)}
            className="border-border text-muted-foreground hover:bg-muted hover:text-foreground block border-t px-4 py-2.5 text-xs font-medium"
          >
            Ver todos os resultados para “{query.trim()}”
          </Link>
        </div>
      ) : null}
    </div>
  );
}

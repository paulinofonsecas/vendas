import Link from "next/link";
import { Search } from "lucide-react";

import { WhatsAppIcon } from "@/components/whatsapp-icon";
import { TYPE_META, TYPE_ORDER } from "@/lib/catalog";
import { whatsappLink } from "@/lib/money";
import type { StoreSettings } from "@/lib/settings";

const SEARCH_INPUT =
  "border-border bg-muted/60 placeholder:text-muted-foreground/80 hover:bg-muted focus:border-foreground/25 focus:bg-background h-12 w-full rounded-full border text-base outline-none transition focus:ring-4 focus:ring-foreground/5";

export function SiteHeader({ store }: { store: StoreSettings }) {
  const wa = store.whatsapp
    ? whatsappLink(store.whatsapp, "Olá! Vi o site e quero saber mais.")
    : null;

  return (
    <header className="border-border/70 bg-background/90 sticky top-0 z-40 border-b backdrop-blur">
      <div className="mx-auto w-full max-w-7xl px-3 sm:px-6">
        <div className="flex h-16 items-center gap-3 sm:h-20 sm:gap-5">
          <Link
            href="/"
            className="shrink-0 text-xl font-bold tracking-tight sm:text-2xl"
            aria-label={`${store.name} — início`}
          >
            {store.name}
          </Link>

          <form action="/pesquisa" role="search" className="relative hidden flex-1 md:block">
            <Search
              aria-hidden
              className="text-muted-foreground pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2"
            />
            <input
              name="q"
              type="search"
              placeholder="O que procuras? Perfis, câmbio, flyers…"
              aria-label="Pesquisar produtos"
              className={`${SEARCH_INPUT} pr-32 pl-12`}
            />
            <button
              type="submit"
              className="bg-foreground text-background absolute top-1/2 right-1.5 -translate-y-1/2 rounded-full px-5 py-2 text-sm font-semibold transition hover:opacity-90"
            >
              Pesquisar
            </button>
          </form>

          <Link
            href="/pesquisa"
            aria-label="Pesquisar"
            className="border-border ml-auto rounded-full border p-2.5 md:hidden"
          >
            <Search className="size-5" />
          </Link>

          {wa ? (
            <a
              href={wa}
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-11 shrink-0 items-center gap-2 rounded-full bg-[#25D366] px-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#1fb457] sm:px-5"
            >
              <WhatsAppIcon className="size-5" />
              <span className="hidden sm:inline">WhatsApp</span>
            </a>
          ) : null}
        </div>

        <form action="/pesquisa" role="search" className="relative pb-3 md:hidden">
          <Search
            aria-hidden
            className="text-muted-foreground pointer-events-none absolute top-[22px] left-4 size-5 -translate-y-1/2"
          />
          <input
            name="q"
            type="search"
            placeholder="O que procuras hoje?"
            aria-label="Pesquisar produtos"
            className={`${SEARCH_INPUT} pl-12`}
          />
        </form>

        <nav className="hidden items-center gap-1 overflow-x-auto pb-2.5 md:flex">
          {TYPE_ORDER.map((type) => (
            <Link
              key={type}
              href={`/categoria/${type}`}
              className="hover:bg-muted text-muted-foreground hover:text-foreground rounded-full px-3 py-1.5 text-sm font-medium whitespace-nowrap transition"
            >
              {TYPE_META[type].plural}
            </Link>
          ))}
          <span aria-hidden className="bg-border mx-1 h-4 w-px shrink-0" />
          <Link
            href="/pedido"
            className="hover:bg-muted text-muted-foreground hover:text-foreground rounded-full px-3 py-1.5 text-sm font-medium whitespace-nowrap transition"
          >
            Meus pedidos
          </Link>
        </nav>
      </div>
    </header>
  );
}

export function SiteFooter({ store }: { store: StoreSettings }) {
  const wa = store.whatsapp
    ? whatsappLink(store.whatsapp, "Olá! Preciso de ajuda com um pedido.")
    : null;

  return (
    <footer className="border-border/60 mt-auto border-t">
      <div className="mx-auto grid w-full max-w-7xl gap-8 px-4 py-10 sm:grid-cols-3 sm:px-6">
        <div>
          <p className="text-sm font-semibold">{store.name}</p>
          <p className="text-muted-foreground mt-2 text-xs leading-relaxed">
            Perfis de streaming, câmbio, design e produtos digitais em Angola.
          </p>
        </div>

        <div className="text-xs">
          <p className="text-muted-foreground mb-2 text-[10px] font-semibold tracking-wider uppercase">
            Navegar
          </p>
          <ul className="space-y-1.5">
            {TYPE_ORDER.map((type) => (
              <li key={type}>
                <Link href={`/categoria/${type}`} className="hover:underline">
                  {TYPE_META[type].plural}
                </Link>
              </li>
            ))}
            <li>
              <Link href="/pedido" className="hover:underline">
                Acompanhar pedido
              </Link>
            </li>
          </ul>
        </div>

        <div className="text-xs">
          <p className="text-muted-foreground mb-2 text-[10px] font-semibold tracking-wider uppercase">
            Contacto
          </p>
          <ul className="space-y-1.5">
            {store.address ? <li>{store.address}</li> : null}
            {store.hours ? <li>{store.hours}</li> : null}
            {wa ? (
              <li>
                <a
                  href={wa}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 hover:underline"
                >
                  <WhatsAppIcon className="size-3.5 text-[#25D366]" />
                  WhatsApp
                </a>
              </li>
            ) : null}
          </ul>
        </div>
      </div>

      <div className="border-border/60 border-t">
        <p className="text-muted-foreground mx-auto w-full max-w-7xl px-4 py-4 text-xs sm:px-6">
          © {new Date().getFullYear()} {store.name}
        </p>
      </div>
    </footer>
  );
}

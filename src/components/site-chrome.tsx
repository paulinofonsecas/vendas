import Link from "next/link";
import { Search } from "lucide-react";

import { TYPE_META, TYPE_ORDER } from "@/lib/catalog";
import { whatsappLink } from "@/lib/money";
import type { StoreSettings } from "@/lib/settings";

export function SiteHeader({ store }: { store: StoreSettings }) {
  const wa = store.whatsapp
    ? whatsappLink(store.whatsapp, "Olá! Vi o site e quero saber mais.")
    : null;

  return (
    <header className="border-border/60 bg-background/90 sticky top-0 z-40 border-b backdrop-blur">
      <div className="mx-auto w-full max-w-7xl px-2 sm:px-6">
        <div className="flex h-14 items-center gap-3">
          <Link href="/" className="text-lg font-semibold tracking-tight whitespace-nowrap">
            {store.name}
          </Link>

          <form action="/pesquisa" className="relative hidden flex-1 sm:block">
            <Search
              aria-hidden
              className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2"
            />
            <input
              name="q"
              type="search"
              placeholder="O que procuras?"
              aria-label="Pesquisar produtos"
              className="border-border bg-muted/50 focus:bg-background w-full rounded-full border py-2 pr-3 pl-9 text-sm outline-none"
            />
          </form>

          <Link
            href="/pesquisa"
            aria-label="Pesquisar"
            className="ml-auto rounded-full p-2 sm:hidden"
          >
            <Search className="size-5" />
          </Link>

          {wa ? (
            <a
              href={wa}
              target="_blank"
              rel="noreferrer"
              className="bg-foreground text-background rounded-full px-3 py-1.5 text-xs font-medium whitespace-nowrap sm:px-4 sm:py-2 sm:text-sm"
            >
              WhatsApp
            </a>
          ) : null}
        </div>

        <nav className="-mx-1 flex items-center gap-1 overflow-x-auto pb-2">
          {TYPE_ORDER.map((type) => (
            <Link
              key={type}
              href={`/categoria/${type}`}
              className="hover:bg-muted text-muted-foreground hover:text-foreground rounded-full px-3 py-1.5 text-xs font-medium whitespace-nowrap sm:text-sm"
            >
              {TYPE_META[type].plural}
            </Link>
          ))}
          <span aria-hidden className="bg-border mx-1 h-4 w-px shrink-0" />
          <Link
            href="/pedido"
            className="hover:bg-muted text-muted-foreground hover:text-foreground rounded-full px-3 py-1.5 text-xs font-medium whitespace-nowrap sm:text-sm"
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
                <a href={wa} target="_blank" rel="noreferrer" className="hover:underline">
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

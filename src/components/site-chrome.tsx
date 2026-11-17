import Link from "next/link";

import { whatsappLink } from "@/lib/money";
import type { StoreSettings } from "@/lib/settings";

export function SiteHeader({ store }: { store: StoreSettings }) {
  const wa = store.whatsapp
    ? whatsappLink(store.whatsapp, "Olá! Vi o site e quero saber mais.")
    : null;

  return (
    <header className="border-border/60 bg-background/80 sticky top-0 z-40 border-b backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4">
        <Link href="/" className="text-lg font-semibold tracking-tight">
          {store.name}
        </Link>
        <nav className="flex items-center gap-4 text-sm">
          <Link href="/#catalogo" className="text-muted-foreground hover:text-foreground">
            Catálogo
          </Link>
          {wa ? (
            <a
              href={wa}
              target="_blank"
              rel="noreferrer"
              className="bg-foreground text-background rounded-full px-4 py-2 font-medium"
            >
              WhatsApp
            </a>
          ) : null}
        </nav>
      </div>
    </header>
  );
}

export function SiteFooter({ store }: { store: StoreSettings }) {
  return (
    <footer className="border-border/60 mt-auto border-t">
      <div className="text-muted-foreground mx-auto flex w-full max-w-6xl flex-col gap-2 px-4 py-8 text-sm sm:flex-row sm:items-center sm:justify-between">
        <p>
          © {new Date().getFullYear()} {store.name}
        </p>
        <p className="flex flex-col gap-1 sm:text-right">
          {store.address ? <span>{store.address}</span> : null}
          {store.hours ? <span>{store.hours}</span> : null}
        </p>
      </div>
    </footer>
  );
}

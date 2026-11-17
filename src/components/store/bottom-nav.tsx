"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, MessageCircle, PackageSearch, Search } from "lucide-react";

const ITEMS = [
  { href: "/", label: "Início", icon: Home },
  { href: "/pesquisa", label: "Pesquisar", icon: Search },
  { href: "/pedido", label: "Pedido", icon: PackageSearch },
];

export function BottomNav({ whatsapp }: { whatsapp: string | null }) {
  const pathname = usePathname();

  return (
    <nav className="border-border/60 bg-background/95 fixed inset-x-0 bottom-0 z-40 border-t backdrop-blur sm:hidden">
      <div className="flex items-stretch">
        {ITEMS.map(({ href, label, icon: Icon }) => {
          const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-1 flex-col items-center gap-0.5 py-2 text-[10px] font-medium ${
                active ? "text-foreground" : "text-muted-foreground"
              }`}
            >
              <Icon className="size-5" strokeWidth={active ? 2.2 : 1.8} />
              {label}
            </Link>
          );
        })}

        {whatsapp ? (
          <a
            href={`https://wa.me/${whatsapp.replace(/\D/g, "")}`}
            target="_blank"
            rel="noreferrer"
            className="text-muted-foreground flex flex-1 flex-col items-center gap-0.5 py-2 text-[10px] font-medium"
          >
            <MessageCircle className="size-5" strokeWidth={1.8} />
            Apoio
          </a>
        ) : null}
      </div>
    </nav>
  );
}

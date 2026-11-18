"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";
import {
  Activity,
  Boxes,
  Coins,
  Image as ImageIcon,
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  PanelLeftClose,
  PanelLeftOpen,
  Settings,
  X,
} from "lucide-react";

import { logoutAction } from "@/app/actions/admin";
import { Button } from "@/components/ui/button";

const NAV = [
  { href: "/admin", label: "Pedidos", icon: LayoutDashboard },
  { href: "/admin/produtos", label: "Produtos", icon: Package },
  { href: "/admin/banners", label: "Banners", icon: ImageIcon },
  { href: "/admin/estoque", label: "Stock", icon: Boxes },
  { href: "/admin/cambios", label: "Câmbios", icon: Coins },
  { href: "/admin/telemetria", label: "Telemetria", icon: Activity },
  { href: "/admin/definicoes", label: "Definições", icon: Settings },
];

export function AdminShell({ email, children }: { email: string; children: ReactNode }) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const isActive = (href: string) =>
    href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);

  const items = (compact: boolean, onNavigate?: () => void) =>
    NAV.map(({ href, label, icon: Icon }) => {
      const active = isActive(href);
      return (
        <Link
          key={href}
          href={href}
          onClick={onNavigate}
          title={compact ? label : undefined}
          className={`flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition ${
            active
              ? "bg-muted text-foreground font-medium"
              : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
          } ${compact ? "justify-center" : ""}`}
        >
          <Icon className="size-4 shrink-0" />
          {!compact ? <span className="truncate">{label}</span> : null}
        </Link>
      );
    });

  return (
    <div className="flex min-h-dvh">
      <aside
        className={`border-border/60 sticky top-0 hidden h-dvh shrink-0 flex-col border-r transition-[width] duration-200 md:flex ${
          collapsed ? "w-[68px]" : "w-60"
        }`}
      >
        <div className="flex h-14 items-center gap-2 px-3">
          {!collapsed ? (
            <Link href="/admin" className="text-sm font-bold tracking-tight">
              Vendaz
            </Link>
          ) : null}
          <button
            type="button"
            onClick={() => setCollapsed((value) => !value)}
            aria-label={collapsed ? "Expandir menu" : "Colapsar menu"}
            aria-expanded={!collapsed}
            className="text-muted-foreground hover:bg-muted hover:text-foreground ml-auto rounded-md p-1.5 transition"
          >
            {collapsed ? (
              <PanelLeftOpen className="size-4" />
            ) : (
              <PanelLeftClose className="size-4" />
            )}
          </button>
        </div>

        <nav className="flex flex-1 flex-col gap-1 overflow-y-auto px-2 py-2">
          {items(collapsed)}
        </nav>

        <div className="border-border/60 space-y-1 border-t p-2">
          {!collapsed ? (
            <p className="text-muted-foreground truncate px-2 text-[11px]">{email}</p>
          ) : null}
          <form action={logoutAction}>
            <Button
              type="submit"
              variant="ghost"
              size="sm"
              className={`text-muted-foreground w-full ${collapsed ? "justify-center px-0" : "justify-start"}`}
            >
              <LogOut className="size-4" />
              {!collapsed ? "Sair" : null}
            </Button>
          </form>
        </div>
      </aside>

      {mobileOpen ? (
        <div className="fixed inset-0 z-50 md:hidden">
          <button
            type="button"
            aria-label="Fechar menu"
            onClick={() => setMobileOpen(false)}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          <div className="bg-background border-border/60 absolute inset-y-0 left-0 flex w-64 flex-col border-r">
            <div className="flex h-14 items-center justify-between px-3">
              <span className="text-sm font-bold">Vendaz</span>
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                aria-label="Fechar menu"
                className="hover:bg-muted rounded-md p-1.5"
              >
                <X className="size-4" />
              </button>
            </div>

            <nav className="flex flex-1 flex-col gap-1 overflow-y-auto px-2 py-2">
              {items(false, () => setMobileOpen(false))}
            </nav>

            <div className="border-border/60 space-y-1 border-t p-2">
              <p className="text-muted-foreground truncate px-2 text-[11px]">{email}</p>
              <form action={logoutAction}>
                <Button type="submit" variant="ghost" size="sm" className="w-full justify-start">
                  <LogOut className="size-4" />
                  Sair
                </Button>
              </form>
            </div>
          </div>
        </div>
      ) : null}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="border-border/60 bg-background/90 sticky top-0 z-30 flex h-14 items-center gap-3 border-b px-4 backdrop-blur md:hidden">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            aria-label="Abrir menu"
            className="hover:bg-muted rounded-md p-1.5"
          >
            <Menu className="size-5" />
          </button>
          <span className="text-sm font-bold">Vendaz</span>
        </header>

        <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}

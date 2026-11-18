"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

import { track } from "@/lib/track";

/** Conta uma visita por mudança de rota. Sem cookies e sem identificadores pessoais. */
export function PageView() {
  const pathname = usePathname();
  const last = useRef<string | null>(null);

  useEffect(() => {
    if (last.current === pathname) return;
    last.current = pathname;

    // o back-office não é comportamento de cliente
    if (pathname.startsWith("/admin") || pathname.startsWith("/api")) return;

    track("page_view");
  }, [pathname]);

  return null;
}

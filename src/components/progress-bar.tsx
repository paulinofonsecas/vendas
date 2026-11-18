"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useRef, useState } from "react";

function Bar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [visible, setVisible] = useState(false);
  const [progress, setProgress] = useState(0);

  const active = useRef(false);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const safetyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const finish = useCallback(() => {
    if (!active.current) return;
    active.current = false;

    if (hideTimer.current) clearTimeout(hideTimer.current);
    if (safetyTimer.current) clearTimeout(safetyTimer.current);

    setProgress(100);
    hideTimer.current = setTimeout(() => {
      setVisible(false);
      setProgress(0);
    }, 240);
  }, []);

  const start = useCallback(() => {
    if (active.current) return;
    active.current = true;

    if (hideTimer.current) clearTimeout(hideTimer.current);
    setVisible(true);
    setProgress(9);

    // se a navegação falhar, a barra não fica presa no ecrã
    if (safetyTimer.current) clearTimeout(safetyTimer.current);
    safetyTimer.current = setTimeout(() => {
      if (active.current) finish();
    }, 8000);
  }, [finish]);

  // progresso assintótico: acelera no início, abranda perto dos 92%
  useEffect(() => {
    if (!visible || !active.current) return;

    const tick = setInterval(() => {
      setProgress((current) => current + (92 - current) * 0.16);
    }, 140);

    return () => clearInterval(tick);
  }, [visible]);

  // navegação concluída (pathname ou query mudaram)
  useEffect(() => {
    finish();
  }, [pathname, searchParams, finish]);

  useEffect(() => {
    function isInternalNav(anchor: HTMLAnchorElement): boolean {
      if (anchor.target === "_blank" || anchor.hasAttribute("download")) return false;

      const url = new URL(anchor.href, window.location.href);
      if (url.origin !== window.location.origin) return false;
      if (url.pathname === window.location.pathname && url.search === window.location.search) {
        return false;
      }
      return true;
    }

    function onClick(event: MouseEvent) {
      if (event.defaultPrevented || event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

      const anchor = (event.target as HTMLElement | null)?.closest?.("a[href]");
      if (!(anchor instanceof HTMLAnchorElement)) return;
      if (!isInternalNav(anchor)) return;

      start();
    }

    function onSubmit() {
      start();
    }

    function onPopState() {
      start();
    }

    document.addEventListener("click", onClick, true);
    document.addEventListener("submit", onSubmit, true);
    window.addEventListener("popstate", onPopState);

    return () => {
      document.removeEventListener("click", onClick, true);
      document.removeEventListener("submit", onSubmit, true);
      window.removeEventListener("popstate", onPopState);
    };
  }, [start]);

  useEffect(() => {
    return () => {
      if (hideTimer.current) clearTimeout(hideTimer.current);
      if (safetyTimer.current) clearTimeout(safetyTimer.current);
    };
  }, []);

  return (
    <div
      aria-hidden
      className={`pointer-events-none fixed inset-x-0 top-0 z-[100] h-[3px] transition-opacity duration-200 ${
        visible ? "opacity-100" : "opacity-0"
      }`}
    >
      <div
        className="h-full rounded-r-full bg-gradient-to-r from-rose-500 via-fuchsia-500 to-sky-400 shadow-[0_0_14px_rgba(217,70,239,0.7)] transition-[width] duration-200 ease-out"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}

export function ProgressBar() {
  return (
    <Suspense fallback={null}>
      <Bar />
    </Suspense>
  );
}

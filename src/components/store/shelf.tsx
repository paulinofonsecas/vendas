"use client";

import Link from "next/link";
import { useEffect, useRef, type ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

export function Shelf({
  title,
  subtitle,
  href,
  children,
  autoScroll = false,
}: {
  title: string;
  subtitle?: string;
  href?: string;
  children: ReactNode;
  autoScroll?: boolean;
}) {
  const trackRef = useRef<HTMLDivElement>(null);

  function scrollBy(direction: 1 | -1) {
    const track = trackRef.current;
    if (!track) return;
    track.scrollBy({ left: direction * track.clientWidth * 0.8, behavior: "smooth" });
  }

  /**
   * Movimento automático em vaivém: avança até ao fim, inverte, volta ao início.
   * Pausa ao passar o rato, ao tocar ou ao navegar por teclado.
   */
  useEffect(() => {
    if (!autoScroll) return;
    const track = trackRef.current;
    if (!track) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let frame = 0;
    let last = performance.now();
    let direction = 1;
    let paused = false;

    const pause = () => {
      paused = true;
    };
    const resume = () => {
      paused = false;
    };

    track.addEventListener("pointerenter", pause);
    track.addEventListener("pointerleave", resume);
    track.addEventListener("pointerdown", pause);
    track.addEventListener("pointerup", resume);
    track.addEventListener("focusin", pause);
    track.addEventListener("focusout", resume);

    const step = (now: number) => {
      const delta = Math.min(now - last, 64);
      last = now;

      const max = track.scrollWidth - track.clientWidth;
      if (!paused && max > 4) {
        track.scrollLeft += direction * 0.045 * delta;
        if (track.scrollLeft >= max - 1) direction = -1;
        if (track.scrollLeft <= 1) direction = 1;
      }

      frame = requestAnimationFrame(step);
    };

    frame = requestAnimationFrame(step);

    return () => {
      cancelAnimationFrame(frame);
      track.removeEventListener("pointerenter", pause);
      track.removeEventListener("pointerleave", resume);
      track.removeEventListener("pointerdown", pause);
      track.removeEventListener("pointerup", resume);
      track.removeEventListener("focusin", pause);
      track.removeEventListener("focusout", resume);
    };
  }, [autoScroll]);

  return (
    <section className="mx-auto max-w-7xl overflow-hidden px-2 py-4 sm:px-6 sm:py-5">
      <div className="mb-4 flex items-end justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight sm:text-2xl">{title}</h2>
          {subtitle ? (
            <p className="text-muted-foreground mt-1 text-xs sm:text-sm">{subtitle}</p>
          ) : null}
        </div>

        <div className="flex items-center gap-2">
          {href ? (
            <Link
              href={href}
              className="text-muted-foreground hover:text-foreground text-xs font-medium whitespace-nowrap sm:text-sm"
            >
              Ver tudo
            </Link>
          ) : null}

          <div className="hidden gap-1 sm:flex">
            <button
              type="button"
              onClick={() => scrollBy(-1)}
              aria-label="Anterior"
              className="border-border hover:bg-muted rounded-full border p-1.5"
            >
              <ChevronLeft className="size-4" />
            </button>
            <button
              type="button"
              onClick={() => scrollBy(1)}
              aria-label="Seguinte"
              className="border-border hover:bg-muted rounded-full border p-1.5"
            >
              <ChevronRight className="size-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="relative">
        <div
          ref={trackRef}
          className="flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-smooth pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {children}
        </div>
      </div>
    </section>
  );
}

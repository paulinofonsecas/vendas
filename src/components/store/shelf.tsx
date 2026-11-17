"use client";

import Link from "next/link";
import { useRef, type ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

export function Shelf({
  title,
  subtitle,
  href,
  children,
}: {
  title: string;
  subtitle?: string;
  href?: string;
  children: ReactNode;
}) {
  const trackRef = useRef<HTMLDivElement>(null);

  function scrollBy(direction: 1 | -1) {
    const track = trackRef.current;
    if (!track) return;
    track.scrollBy({ left: direction * track.clientWidth * 0.8, behavior: "smooth" });
  }

  return (
    <section className="mx-auto max-w-7xl overflow-hidden px-2 py-4 sm:px-6 sm:py-5">
      <div className="mb-4 flex items-end justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold tracking-tight sm:text-xl">{title}</h2>
          {subtitle ? (
            <p className="text-muted-foreground mt-0.5 text-xs sm:text-sm">{subtitle}</p>
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

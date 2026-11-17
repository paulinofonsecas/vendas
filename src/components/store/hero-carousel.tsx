"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

export type Banner = {
  title: string;
  subtitle: string;
  cta: string;
  href: string;
  badge?: string;
};

export function HeroCarousel({ banners, tiles }: { banners: Banner[]; tiles: string[] }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused || banners.length <= 1) return;
    const timer = setInterval(() => setIndex((i) => (i + 1) % banners.length), 6500);
    return () => clearInterval(timer);
  }, [paused, banners.length]);

  if (banners.length === 0) return null;

  const go = (direction: 1 | -1) =>
    setIndex((i) => (i + direction + banners.length) % banners.length);

  return (
    <section
      aria-label="Destaques"
      className="group relative w-full overflow-hidden"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* parede de capas, desfocada pelo escurecimento */}
      <div aria-hidden className="absolute inset-0 overflow-hidden bg-black">
        <div className="absolute inset-0 -rotate-3 scale-125">
          <div className="grid h-full w-full auto-rows-fr grid-cols-6 gap-1.5 sm:grid-cols-10 lg:grid-cols-12">
            {tiles.map((gradient, i) => (
              <div
                key={i}
                className={`rounded-[3px] bg-gradient-to-br ${gradient} opacity-40`}
              >
                <div className="h-full w-full rounded-[3px] bg-black/25" />
              </div>
            ))}
          </div>
        </div>

        <div className="absolute inset-0 bg-gradient-to-r from-black via-black/85 to-black/40" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-black/20 to-black/70" />
      </div>

      <div className="relative h-[40vh] max-h-[600px] min-h-[340px] w-full">
        {banners.map((banner, i) => (
          <div
            key={banner.href + i}
            aria-hidden={i !== index}
            className={`absolute inset-0 transition-opacity duration-700 ${
              i === index ? "z-10 opacity-100" : "pointer-events-none z-0 opacity-0"
            }`}
          >
            <div className="mx-auto flex h-full max-w-7xl flex-col justify-center px-5 sm:px-6">
              {banner.badge ? (
                <span className="mb-3 w-fit rounded-full border border-white/25 bg-white/10 px-2.5 py-1 text-[10px] font-bold tracking-[0.14em] text-white/90 uppercase backdrop-blur-sm sm:text-xs">
                  {banner.badge}
                </span>
              ) : null}

              <h1 className="max-w-2xl text-3xl leading-[1.05] font-bold tracking-tight text-white sm:text-5xl">
                {banner.title}
              </h1>
              <p className="mt-3 max-w-lg text-sm text-white/70 sm:text-lg">{banner.subtitle}</p>

              <Link
                href={banner.href}
                className="mt-6 inline-flex h-12 w-fit items-center rounded-full bg-white px-7 text-sm font-semibold text-neutral-900 shadow-lg shadow-black/30 transition hover:bg-white/90 sm:text-base"
              >
                {banner.cta}
              </Link>
            </div>
          </div>
        ))}

        {banners.length > 1 ? (
          <>
            <button
              type="button"
              onClick={() => go(-1)}
              aria-label="Banner anterior"
              className="absolute top-1/2 left-2 z-20 hidden -translate-y-1/2 rounded-full bg-black/40 p-2.5 text-white opacity-0 backdrop-blur-sm transition duration-200 group-hover:opacity-100 hover:bg-black/70 focus-visible:opacity-100 sm:block sm:left-4"
            >
              <ChevronLeft className="size-5" />
            </button>
            <button
              type="button"
              onClick={() => go(1)}
              aria-label="Banner seguinte"
              className="absolute top-1/2 right-2 z-20 hidden -translate-y-1/2 rounded-full bg-black/40 p-2.5 text-white opacity-0 backdrop-blur-sm transition duration-200 group-hover:opacity-100 hover:bg-black/70 focus-visible:opacity-100 sm:block sm:right-4"
            >
              <ChevronRight className="size-5" />
            </button>

            <div className="absolute inset-x-0 bottom-4 z-20 flex justify-center gap-1.5">
              {banners.map((banner, i) => (
                <button
                  key={banner.href + i}
                  type="button"
                  onClick={() => setIndex(i)}
                  aria-label={`Ir para o banner ${i + 1}`}
                  className={`h-1.5 rounded-full transition-all ${
                    i === index ? "w-7 bg-white" : "w-1.5 bg-white/40 hover:bg-white/70"
                  }`}
                />
              ))}
            </div>
          </>
        ) : null}
      </div>
    </section>
  );
}

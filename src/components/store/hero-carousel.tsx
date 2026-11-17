"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

export type Banner = {
  title: string;
  subtitle: string;
  cta: string;
  href: string;
  gradient: string;
  badge?: string;
};

export function HeroCarousel({ banners }: { banners: Banner[] }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused || banners.length <= 1) return;
    const timer = setInterval(() => setIndex((i) => (i + 1) % banners.length), 6000);
    return () => clearInterval(timer);
  }, [paused, banners.length]);

  if (banners.length === 0) return null;

  const go = (direction: 1 | -1) =>
    setIndex((i) => (i + direction + banners.length) % banners.length);

  return (
    <section
      aria-label="Destaques"
      className="relative w-full"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="relative h-[40vh] max-h-[560px] min-h-[300px] w-full overflow-hidden">
        {banners.map((banner, i) => (
          <div
            key={banner.href + i}
            aria-hidden={i !== index}
            className={`absolute inset-0 transition-opacity duration-500 ${
              i === index ? "z-10 opacity-100" : "pointer-events-none z-0 opacity-0"
            }`}
          >
            <div className={`relative h-full w-full bg-gradient-to-br ${banner.gradient}`}>
              <div
                aria-hidden
                className="absolute inset-0 bg-[radial-gradient(circle_at_85%_-20%,rgba(255,255,255,0.42),transparent_60%)]"
              />
              <div
                aria-hidden
                className="absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent"
              />

              <div className="relative mx-auto flex h-full max-w-7xl flex-col justify-center px-5 sm:px-6">
                {banner.badge ? (
                  <span className="mb-3 w-fit rounded-full bg-white/20 px-2.5 py-1 text-[10px] font-bold tracking-widest text-white uppercase backdrop-blur-sm sm:text-xs">
                    {banner.badge}
                  </span>
                ) : null}

                <h1 className="max-w-xl text-2xl leading-tight font-semibold text-white drop-shadow-sm sm:text-4xl">
                  {banner.title}
                </h1>
                <p className="mt-2 max-w-md text-sm text-white/90 sm:text-base">{banner.subtitle}</p>

                <Link
                  href={banner.href}
                  className="mt-5 inline-flex h-11 w-fit items-center rounded-full bg-white px-6 text-sm font-semibold text-neutral-900 shadow-sm transition hover:bg-white/90"
                >
                  {banner.cta}
                </Link>
              </div>
            </div>
          </div>
        ))}

        {banners.length > 1 ? (
          <>
            <button
              type="button"
              onClick={() => go(-1)}
              aria-label="Banner anterior"
              className="absolute top-1/2 left-2 z-20 -translate-y-1/2 rounded-full bg-black/25 p-2 text-white backdrop-blur-sm transition hover:bg-black/45 sm:left-4"
            >
              <ChevronLeft className="size-4 sm:size-5" />
            </button>
            <button
              type="button"
              onClick={() => go(1)}
              aria-label="Banner seguinte"
              className="absolute top-1/2 right-2 z-20 -translate-y-1/2 rounded-full bg-black/25 p-2 text-white backdrop-blur-sm transition hover:bg-black/45 sm:right-4"
            >
              <ChevronRight className="size-4 sm:size-5" />
            </button>

            <div className="absolute inset-x-0 bottom-3 z-20 flex justify-center gap-1.5">
              {banners.map((banner, i) => (
                <button
                  key={banner.href + i}
                  type="button"
                  onClick={() => setIndex(i)}
                  aria-label={`Ir para o banner ${i + 1}`}
                  className={`h-1.5 rounded-full transition-all ${
                    i === index ? "w-6 bg-white" : "w-1.5 bg-white/50 hover:bg-white/80"
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

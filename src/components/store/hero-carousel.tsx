"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

export type Banner = {
  title: string;
  subtitle: string;
  cta: string;
  href: string;
  badge?: string;
  image?: string;
};

/**
 * Carrossel de flyers largos (1920x400).
 * A imagem é o flyer inteiro; o texto só aparece se for preenchido,
 * e nesse caso ganha um gradiente à esquerda para ficar legível.
 */
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
      className="group relative w-full overflow-hidden bg-black"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="relative h-[clamp(200px,32vw,400px)] w-full">
        {banners.map((banner, i) => {
          const hasText = Boolean(banner.title);
          const slide = (
            <>
              {banner.image ? (
                <Image
                  src={banner.image}
                  alt={banner.title || `Destaque ${i + 1}`}
                  fill
                  priority={i === 0}
                  sizes="100vw"
                  className="object-cover"
                />
              ) : (
                <div className="absolute inset-0 overflow-hidden bg-black">
                  <div className="absolute inset-0 grid auto-rows-fr grid-cols-6 gap-1.5 sm:grid-cols-10 lg:grid-cols-12">
                    {tiles.map((gradient, tile) => (
                      <div
                        key={tile}
                        className={`rounded-[3px] bg-gradient-to-br ${gradient} opacity-40`}
                      >
                        <div className="h-full w-full rounded-[3px] bg-black/25" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {hasText ? (
                <>
                  <div className="absolute inset-0 bg-gradient-to-r from-black via-black/70 to-transparent" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />

                  <div className="relative mx-auto flex h-full max-w-7xl flex-col justify-center px-5 sm:px-6">
                    {banner.badge ? (
                      <span className="mb-2 w-fit rounded-full border border-white/25 bg-white/10 px-2.5 py-1 text-[10px] font-bold tracking-[0.14em] text-white/90 uppercase backdrop-blur-sm sm:text-xs">
                        {banner.badge}
                      </span>
                    ) : null}

                    <p className="max-w-2xl text-2xl leading-tight font-bold tracking-tight text-white sm:text-4xl">
                      {banner.title}
                    </p>
                    {banner.subtitle ? (
                      <p className="mt-2 max-w-lg text-sm text-white/75 sm:text-base">
                        {banner.subtitle}
                      </p>
                    ) : null}

                    {banner.cta ? (
                      <Link
                        href={banner.href}
                        className="mt-4 inline-flex h-10 w-fit items-center rounded-full bg-white px-6 text-sm font-semibold text-neutral-900 shadow-lg shadow-black/30 transition hover:bg-white/90"
                      >
                        {banner.cta}
                      </Link>
                    ) : null}
                  </div>
                </>
              ) : null}
            </>
          );

          return (
            <div
              key={(banner.image ?? "") + i}
              aria-hidden={i !== index}
              className={`absolute inset-0 transition-opacity duration-500 ${
                i === index ? "z-10 opacity-100" : "pointer-events-none z-0 opacity-0"
              }`}
            >
              {!hasText && banner.href ? (
                <Link href={banner.href} aria-label={`Destaque ${i + 1}`} className="block size-full">
                  {slide}
                </Link>
              ) : (
                slide
              )}
            </div>
          );
        })}

        {banners.length > 1 ? (
          <>
            <button
              type="button"
              onClick={() => go(-1)}
              aria-label="Banner anterior"
              className="absolute top-1/2 left-2 z-20 hidden -translate-y-1/2 rounded-full bg-black/40 p-2.5 text-white opacity-0 backdrop-blur-sm transition duration-200 group-hover:opacity-100 hover:bg-black/70 focus-visible:opacity-100 sm:block sm:left-3"
            >
              <ChevronLeft className="size-5" />
            </button>
            <button
              type="button"
              onClick={() => go(1)}
              aria-label="Banner seguinte"
              className="absolute top-1/2 right-2 z-20 hidden -translate-y-1/2 rounded-full bg-black/40 p-2.5 text-white opacity-0 backdrop-blur-sm transition duration-200 group-hover:opacity-100 hover:bg-black/70 focus-visible:opacity-100 sm:block sm:right-3"
            >
              <ChevronRight className="size-5" />
            </button>

            <div className="absolute inset-x-0 bottom-2.5 z-20 flex justify-center gap-1.5">
              {banners.map((banner, i) => (
                <button
                  key={(banner.image ?? "") + i}
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

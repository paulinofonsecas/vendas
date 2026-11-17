"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";

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
    <div
      className="mx-auto max-w-7xl px-2 pt-2 sm:px-6 sm:pt-8"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="relative overflow-hidden rounded-xl">
        {banners.map((banner, i) => (
          <div
            key={banner.href + i}
            aria-hidden={i !== index}
            className={`${i === index ? "relative" : "hidden"} transition-opacity`}
          >
            <div className={`relative overflow-hidden bg-gradient-to-br ${banner.gradient}`}>
              <div
                aria-hidden
                className="absolute inset-0 bg-[radial-gradient(circle_at_80%_-20%,rgba(255,255,255,0.4),transparent_60%)]"
              />

              <div className="relative flex min-h-[190px] flex-col justify-center px-5 py-7 sm:min-h-[260px] sm:px-10 sm:py-12">
                {banner.badge ? (
                  <span className="mb-3 w-fit rounded-full bg-white/20 px-2.5 py-1 text-[10px] font-bold tracking-wide text-white uppercase backdrop-blur-sm sm:text-xs">
                    {banner.badge}
                  </span>
                ) : null}

                <h1 className="max-w-lg text-xl leading-tight font-semibold text-white sm:text-3xl">
                  {banner.title}
                </h1>
                <p className="mt-2 max-w-md text-sm text-white/85 sm:text-base">{banner.subtitle}</p>

                <Link
                  href={banner.href}
                  className={buttonVariants({
                    size: "lg",
                    className: "mt-5 w-fit bg-white text-black hover:bg-white/90",
                  })}
                >
                  {banner.cta}
                </Link>
              </div>
            </div>
          </div>
        ))}

        {banners.length > 1 ? (
          <>
            <div className="pointer-events-none absolute inset-y-0 left-0 z-10 flex items-center pl-2">
              <button
                type="button"
                onClick={() => go(-1)}
                aria-label="Banner anterior"
                className="pointer-events-auto rounded-full bg-black/20 p-1.5 text-white backdrop-blur-sm hover:bg-black/35"
              >
                <ChevronLeft className="size-3 sm:size-5" />
              </button>
            </div>
            <div className="pointer-events-none absolute inset-y-0 right-0 z-10 flex items-center pr-2">
              <button
                type="button"
                onClick={() => go(1)}
                aria-label="Banner seguinte"
                className="pointer-events-auto rounded-full bg-black/20 p-1.5 text-white backdrop-blur-sm hover:bg-black/35"
              >
                <ChevronRight className="size-3 sm:size-5" />
              </button>
            </div>

            <div className="absolute inset-x-0 bottom-2 z-10 flex justify-center gap-1.5">
              {banners.map((banner, i) => (
                <button
                  key={banner.href + i}
                  type="button"
                  onClick={() => setIndex(i)}
                  aria-label={`Ir para o banner ${i + 1}`}
                  className={`h-1.5 rounded-full transition-all ${
                    i === index ? "w-5 bg-white" : "w-1.5 bg-white/50"
                  }`}
                />
              ))}
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}

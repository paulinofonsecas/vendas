"use client";

import { useState } from "react";
import { Check, Link2, Send, Share2 } from "lucide-react";

import { WhatsAppIcon } from "@/components/whatsapp-icon";
import { track } from "@/lib/track";

const FACEBOOK_APP_ID = process.env.NEXT_PUBLIC_FACEBOOK_APP_ID ?? "";

function isLocalHost(url: string): boolean {
  return /localhost|127\.0\.0\.1|0\.0\.0\.0/.test(url);
}

/** Abre o diálogo num popup — o sharer do Facebook bloqueia em iframes e às vezes em _blank. */
function openPopup(href: string) {
  const width = 640;
  const height = 600;
  const left = window.screenX + (window.outerWidth - width) / 2;
  const top = window.screenY + (window.outerHeight - height) / 2;

  window.open(
    href,
    "vz-share",
    `popup=yes,width=${width},height=${height},left=${left},top=${top},noopener,noreferrer`,
  );
}

export function ShareButtons({ url, text }: { url: string; text: string }) {
  const [copied, setCopied] = useState(false);
  const local = isLocalHost(url);

  const whatsapp = `https://wa.me/?text=${encodeURIComponent(`${text}\n${url}`)}`;
  const facebook = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
  const messenger = FACEBOOK_APP_ID
    ? `https://www.facebook.com/dialog/send?app_id=${FACEBOOK_APP_ID}&link=${encodeURIComponent(
        url,
      )}&redirect_uri=${encodeURIComponent(url)}`
    : null;

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  async function nativeShare() {
    if (typeof navigator === "undefined" || !navigator.share) return;
    try {
      await navigator.share({ title: text, text, url });
    } catch {
      /* cancelado */
    }
  }

  return (
    <div className="border-border/60 rounded-xl border p-4">
      <p className="text-sm font-semibold">Partilhar</p>
      <p className="text-muted-foreground mt-0.5 text-xs">
        A imagem e o texto aparecem automaticamente no WhatsApp e no Facebook.
      </p>

      {local ? (
        <p className="mt-2 rounded-md border border-amber-500/40 bg-amber-500/10 p-2 text-[11px] text-amber-300">
          Estás em localhost. O Facebook não consegue ler esta URL, por isso o preview só aparece
          depois de publicares o site (ou de usares um túnel público).
        </p>
      ) : null}

      <div className="mt-3 flex flex-wrap gap-2">
        <a
          href={whatsapp}
          target="_blank"
          rel="noreferrer"
          onClick={() => track("share_click", { meta: { channel: "whatsapp" } })}
          className="inline-flex h-9 items-center gap-2 rounded-full bg-[#25D366] px-4 text-sm font-semibold text-white transition hover:bg-[#1fb457]"
        >
          <WhatsAppIcon className="size-4" />
          WhatsApp
        </a>

        <button
          type="button"
          onClick={() => {
            track("share_click", { meta: { channel: "facebook" } });
            openPopup(facebook);
          }}
          className="inline-flex h-9 items-center gap-2 rounded-full bg-[#1877F2] px-4 text-sm font-semibold text-white transition hover:bg-[#0f65d6]"
        >
          <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden className="size-4">
            <path d="M13.5 21v-7.6h2.6l.4-3h-3V8.5c0-.9.24-1.5 1.5-1.5h1.6V4.2c-.28-.04-1.24-.12-2.36-.12-2.33 0-3.94 1.42-3.94 4.04v2.25H7.5v3h2.8V21h3.2Z" />
          </svg>
          Publicar
        </button>

        {messenger ? (
          <button
            type="button"
            onClick={() => {
              track("share_click", { meta: { channel: "messenger" } });
              openPopup(messenger);
            }}
            className="border-border hover:bg-muted inline-flex h-9 items-center gap-2 rounded-full border px-4 text-sm font-medium transition"
          >
            <Send className="size-4" />
            Mensagem
          </button>
        ) : null}

        <button
          type="button"
          onClick={copy}
          className="border-border hover:bg-muted inline-flex h-9 items-center gap-2 rounded-full border px-4 text-sm font-medium transition"
        >
          {copied ? <Check className="size-4 text-emerald-400" /> : <Link2 className="size-4" />}
          {copied ? "Copiado" : "Copiar link"}
        </button>

        {typeof navigator !== "undefined" && "share" in navigator ? (
          <button
            type="button"
            onClick={nativeShare}
            aria-label="Partilhar"
            className="border-border hover:bg-muted inline-flex size-9 items-center justify-center rounded-full border transition sm:hidden"
          >
            <Share2 className="size-4" />
          </button>
        ) : null}
      </div>
    </div>
  );
}

"use client";

const SESSION_KEY = "vz:sid";

function sessionId(): string | null {
  try {
    const existing = localStorage.getItem(SESSION_KEY);
    if (existing) return existing;

    const id = crypto.randomUUID();
    localStorage.setItem(SESSION_KEY, id);
    return id;
  } catch {
    return null;
  }
}

function doNotTrack(): boolean {
  return (
    typeof navigator !== "undefined" &&
    (navigator.doNotTrack === "1" || (window as { doNotTrack?: string }).doNotTrack === "1")
  );
}

export type TrackPayload = {
  path?: string;
  productId?: string;
  meta?: Record<string, string | number | boolean | null>;
};

/**
 * Envia um evento para /api/track. Sem cookies, sem PII: só sessão anónima,
 * caminho e metadados que o próprio chamador decide.
 */
export function track(name: string, payload: TrackPayload = {}): void {
  if (typeof window === "undefined" || doNotTrack()) return;

  const body = JSON.stringify({
    name,
    path: payload.path ?? window.location.pathname,
    productId: payload.productId,
    meta: payload.meta ?? {},
    sessionId: sessionId(),
  });

  try {
    if (navigator.sendBeacon) {
      navigator.sendBeacon("/api/track", new Blob([body], { type: "application/json" }));
      return;
    }
  } catch {
    /* cai para fetch */
  }

  void fetch("/api/track", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body,
    keepalive: true,
  }).catch(() => {});
}

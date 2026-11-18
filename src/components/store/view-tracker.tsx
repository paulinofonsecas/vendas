"use client";

import { useEffect } from "react";

import { track } from "@/lib/track";

/**
 * Regista a visualização uma vez por produto e por sessão.
 * O servidor volta a limitar por IP, por isso abrir em várias abas não inflaciona.
 */
export function ViewTracker({ productId }: { productId: string }) {
  useEffect(() => {
    track("product_view", { productId });

    const key = `vz:viewed:${productId}`;

    try {
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, "1");
    } catch {
      // modo privado sem storage: conta na mesma, o servidor limita
    }

    void fetch("/api/views", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ productId }),
      keepalive: true,
    });
  }, [productId]);

  return null;
}

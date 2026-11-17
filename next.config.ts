import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Cache Components (dynamicIO) fica desligado de propósito: o checkout e o admin
  // dependem de cookies e dados sempre frescos, e o modo por omissão do Next 15
  // (sem cache automático de fetch) é mais previsível para este projecto.
  cacheComponents: false,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;

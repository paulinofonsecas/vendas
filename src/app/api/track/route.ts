import { NextResponse } from "next/server";
import { headers } from "next/headers";

import { EVENT_CATALOG, getAnalyticsConfig, type EventName } from "@/lib/analytics";
import { checkRateLimit, clientIp } from "@/lib/rate-limit";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Json } from "@/types/database";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type Body = {
  name?: unknown;
  path?: unknown;
  productId?: unknown;
  sessionId?: unknown;
  meta?: unknown;
};

function cleanMeta(meta: unknown): Json {
  if (!meta || typeof meta !== "object" || Array.isArray(meta)) return {};
  const entries = Object.entries(meta as Record<string, unknown>)
    .filter(([, value]) => ["string", "number", "boolean"].includes(typeof value))
    .slice(0, 8)
    .map(([key, value]) => [
      key.slice(0, 40),
      typeof value === "string" ? value.slice(0, 120) : (value as Json),
    ]);

  const json = Object.fromEntries(entries) as Json;
  return JSON.stringify(json).length > 800 ? {} : json;
}

export async function POST(request: Request) {
  const config = await getAnalyticsConfig();
  if (!config.enabled) return new NextResponse(null, { status: 204 });

  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return new NextResponse(null, { status: 400 });
  }

  const name = typeof body.name === "string" ? body.name : "";
  if (!(name in EVENT_CATALOG)) return new NextResponse(null, { status: 400 });
  if (!config.events[name]?.enabled) return new NextResponse(null, { status: 204 });

  const ip = clientIp(await headers());
  const gate = await checkRateLimit(`track:${ip}`, 240, 60 * 60);
  if (!gate.allowed) return new NextResponse(null, { status: 204 });

  const productId =
    typeof body.productId === "string" && UUID.test(body.productId) ? body.productId : null;

  const supabase = createAdminClient();
  await supabase.from("analytics_events").insert({
    name: name as EventName,
    path: typeof body.path === "string" ? body.path.slice(0, 200) : "",
    product_id: productId,
    session_id:
      typeof body.sessionId === "string" && UUID.test(body.sessionId) ? body.sessionId : null,
    meta: cleanMeta(body.meta),
  });

  return new NextResponse(null, { status: 204 });
}

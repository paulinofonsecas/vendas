import { NextResponse } from "next/server";
import { headers } from "next/headers";

import { checkRateLimit, clientIp } from "@/lib/rate-limit";
import { createAdminClient } from "@/lib/supabase/admin";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Conta uma visualização de produto. Chamado pelo ViewTracker no browser,
 * uma vez por sessão e limitado a uma por IP/produto/hora.
 */
export async function POST(request: Request) {
  let productId: unknown;

  try {
    ({ productId } = (await request.json()) as { productId?: unknown });
  } catch {
    return new NextResponse(null, { status: 400 });
  }

  if (typeof productId !== "string" || !UUID.test(productId)) {
    return new NextResponse(null, { status: 400 });
  }

  const ip = clientIp(await headers());
  const gate = await checkRateLimit(`view:${ip}:${productId}`, 1, 60 * 60);
  if (!gate.allowed) return new NextResponse(null, { status: 204 });

  const supabase = createAdminClient();
  await supabase.rpc("register_product_view", { p_product_id: productId });

  return new NextResponse(null, { status: 204 });
}

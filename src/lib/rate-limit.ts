import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Rate limit simples por chave (IP + acção), guardado em Postgres.
 * Sem Redis: para um checkout de loja única chega, e não acrescenta infra.
 */
export async function checkRateLimit(
  key: string,
  limit: number,
  windowSeconds: number,
): Promise<{ allowed: boolean; remaining: number }> {
  const supabase = createAdminClient();
  const now = new Date();

  const { data: existing } = await supabase
    .from("rate_limits")
    .select("hits, window_start")
    .eq("id", key)
    .maybeSingle();

  const windowExpired =
    !existing || now.getTime() - new Date(existing.window_start).getTime() > windowSeconds * 1000;

  if (windowExpired) {
    await supabase
      .from("rate_limits")
      .upsert({ id: key, hits: 1, window_start: now.toISOString() }, { onConflict: "id" });
    return { allowed: true, remaining: limit - 1 };
  }

  const hits = existing.hits + 1;
  await supabase.from("rate_limits").update({ hits }).eq("id", key);

  return { allowed: hits <= limit, remaining: Math.max(limit - hits, 0) };
}

export function clientIp(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]!.trim();
  return headers.get("x-real-ip") ?? "unknown";
}

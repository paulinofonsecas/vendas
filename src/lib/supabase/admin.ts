import { createClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database";

/**
 * Cliente com a secret key: ignora RLS por completo.
 *
 * Só para: checkout anónimo, upload de comprovativos e leitura de segredos cifrados.
 * NUNCA importar a partir de um Client Component ("use client").
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url) throw new Error("NEXT_PUBLIC_SUPABASE_URL não está definida.");
  if (!key) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY não está definida. Copia a secret key do projecto para .env.local.",
    );
  }

  return createClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}

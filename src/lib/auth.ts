import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

export type Staff = {
  email: string;
  name: string | null;
  userId: string;
};

/** Devolve o staff autenticado, ou null. A tabela `admins` é a allowlist. */
export async function getStaff(): Promise<Staff | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) return null;

  const { data: admin } = await supabase
    .from("admins")
    .select("email, name")
    .eq("email", user.email.toLowerCase())
    .maybeSingle();

  if (!admin) return null;

  return { email: admin.email, name: admin.name, userId: user.id };
}

/** Igual a getStaff, mas redirecciona para o login. Usar no início de cada Server Action de admin. */
export async function requireStaff(): Promise<Staff> {
  const staff = await getStaff();
  if (!staff) redirect("/admin/login");
  return staff;
}

import { AdminShell } from "@/components/admin/admin-shell";
import { requireStaff } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  const staff = await requireStaff();

  return <AdminShell email={staff.email}>{children}</AdminShell>;
}

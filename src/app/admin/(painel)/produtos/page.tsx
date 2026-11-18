import Link from "next/link";

import { ProductsTable } from "@/app/admin/(painel)/produtos/produtos-table";
import { buttonVariants } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ msg?: string }>;
}) {
  const { msg } = await searchParams;
  const supabase = await createClient();

  const { data: products } = await supabase
    .from("products")
    .select("*")
    .order("sort", { ascending: true });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Produtos</h1>
          <p className="text-muted-foreground mt-0.5 text-sm">
            {products?.length ?? 0} no catálogo
          </p>
        </div>

        <Link href="/admin/produtos/novo" className={buttonVariants()}>
          Novo produto
        </Link>
      </div>

      {msg ? <p className="bg-muted rounded-md px-4 py-3 text-sm">{decodeURIComponent(msg)}</p> : null}

      <ProductsTable products={products ?? []} />
    </div>
  );
}

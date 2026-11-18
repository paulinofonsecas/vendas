import Link from "next/link";
import { notFound } from "next/navigation";

import { ProductForm } from "@/app/admin/(painel)/produtos/product-form";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: product } = await supabase
    .from("products")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (!product) notFound();

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/produtos" className="text-muted-foreground text-sm hover:underline">
          ← Produtos
        </Link>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">{product.name}</h1>
        <p className="text-muted-foreground mt-0.5 font-mono text-sm">/{product.slug}</p>
      </div>

      <ProductForm product={product} />
    </div>
  );
}

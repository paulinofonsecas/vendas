import Link from "next/link";

import { ProductForm } from "@/app/admin/(painel)/produtos/product-form";

export const dynamic = "force-dynamic";

export const metadata = { title: "Novo produto" };

export default function NewProductPage() {
  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/produtos" className="text-muted-foreground text-sm hover:underline">
          ← Produtos
        </Link>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">Novo produto</h1>
        <p className="text-muted-foreground mt-0.5 text-sm">
          Os campos de configuração mudam com o tipo escolhido.
        </p>
      </div>

      <ProductForm />
    </div>
  );
}

import { saveFxRateAction } from "@/app/actions/admin";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function AdminFxPage({
  searchParams,
}: {
  searchParams: Promise<{ msg?: string }>;
}) {
  const { msg } = await searchParams;
  const supabase = await createClient();
  const { data: rates } = await supabase.from("fx_rates").select("*").order("base");

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">Câmbios</h1>

      {msg ? <p className="bg-muted rounded-md px-4 py-3 text-sm">{decodeURIComponent(msg)}</p> : null}

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <div className="space-y-4">
          {(rates ?? []).map((rate) => (
            <Card key={rate.id}>
              <CardHeader>
                <CardTitle className="text-base">
                  {rate.base} → {rate.quote}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form action={saveFxRateAction} className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <input type="hidden" name="id" value={rate.id} />
                  <input type="hidden" name="base" value={rate.base} />
                  <input type="hidden" name="quote" value={rate.quote} />

                  <div className="space-y-2">
                    <Label htmlFor={`buy-${rate.id}`}>Compra</Label>
                    <Input
                      id={`buy-${rate.id}`}
                      name="buy"
                      type="number"
                      step="0.0001"
                      defaultValue={rate.buy}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`sell-${rate.id}`}>Venda</Label>
                    <Input
                      id={`sell-${rate.id}`}
                      name="sell"
                      type="number"
                      step="0.0001"
                      defaultValue={rate.sell}
                    />
                  </div>

                  <div className="flex items-end">
                    <Button type="submit" size="sm" className="w-full">
                      Guardar
                    </Button>
                  </div>

                  <div className="text-muted-foreground flex items-end text-xs">
                    Actualizado{" "}
                    {new Intl.DateTimeFormat("pt-PT", {
                      dateStyle: "short",
                      timeStyle: "short",
                    }).format(new Date(rate.updated_at))}
                  </div>
                </form>
              </CardContent>
            </Card>
          ))}

          {(rates ?? []).length === 0 ? (
            <p className="text-muted-foreground text-sm">Sem cotações registadas.</p>
          ) : null}
        </div>

        <Card className="h-fit">
          <CardHeader>
            <CardTitle className="text-base">Nova cotação</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={saveFxRateAction} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="base">Base</Label>
                  <Input id="base" name="base" defaultValue="USD" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="quote">Contra</Label>
                  <Input id="quote" name="quote" defaultValue="AOA" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="buy">Compra</Label>
                  <Input id="buy" name="buy" type="number" step="0.0001" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sell">Venda</Label>
                  <Input id="sell" name="sell" type="number" step="0.0001" required />
                </div>
              </div>
              <Button type="submit" className="w-full">
                Guardar cotação
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

import { saveSettingsAction } from "@/app/actions/admin";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const KEYS = [
  { key: "store", title: "Loja e contacto" },
  { key: "payment", title: "Pagamentos" },
];

export default async function AdminSettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ msg?: string }>;
}) {
  const { msg } = await searchParams;
  const supabase = await createClient();
  const { data: settings } = await supabase.from("settings").select("*");

  const byKey = new Map((settings ?? []).map((row) => [row.key, row]));

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">Definições</h1>

      {msg ? <p className="bg-muted rounded-md px-4 py-3 text-sm">{decodeURIComponent(msg)}</p> : null}

      <div className="grid gap-6 lg:grid-cols-2">
        {KEYS.map(({ key, title }) => {
          const row = byKey.get(key);
          return (
            <Card key={key}>
              <CardHeader>
                <CardTitle className="text-base">{title}</CardTitle>
              </CardHeader>
              <CardContent>
                <form action={saveSettingsAction} className="space-y-3">
                  <input type="hidden" name="key" value={key} />
                  <div className="space-y-2">
                    <Label htmlFor={`value-${key}`}>JSON</Label>
                    <Textarea
                      id={`value-${key}`}
                      name="value"
                      rows={10}
                      defaultValue={JSON.stringify(row?.value ?? {}, null, 2)}
                      className="font-mono text-xs"
                    />
                  </div>
                  <Button type="submit" className="w-full">
                    Guardar
                  </Button>
                </form>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <p className="text-muted-foreground text-sm">
        Estes valores são públicos e aparecem no checkout. O IBAN e o WhatsApp devem estar
        correctos antes de divulgar a loja.
      </p>
    </div>
  );
}

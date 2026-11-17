import { TrackForm } from "@/app/pedido/track-form";
import { BottomNav } from "@/components/store/bottom-nav";
import { SiteFooter, SiteHeader } from "@/components/site-chrome";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getPublicSettings } from "@/lib/settings";

export const dynamic = "force-dynamic";

export const metadata = { title: "Acompanhar pedido" };

export default async function TrackPage() {
  const { store } = await getPublicSettings();

  return (
    <>
      <SiteHeader store={store} />

      <main className="flex-1 pb-16 sm:pb-0">
        <div className="mx-auto w-full max-w-md px-4 py-10 sm:py-16">
          <Card>
            <CardHeader>
              <CardTitle>Acompanhar pedido</CardTitle>
              <CardDescription>
                Usa o código que recebeste depois de criar o pedido e o mesmo número de WhatsApp.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <TrackForm />
            </CardContent>
          </Card>

          <p className="text-muted-foreground mt-4 text-center text-xs">
            O código tem o formato VD-AAAA-0000. Perdeste-o? Fala connosco no WhatsApp.
          </p>
        </div>
      </main>

      <SiteFooter store={store} />
      <BottomNav whatsapp={store.whatsapp} />
    </>
  );
}

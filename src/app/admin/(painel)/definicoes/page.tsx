import { saveBannersAction, savePaymentSettingsAction, saveStoreSettingsAction } from "@/app/actions/admin";
import { Field } from "@/components/admin/field";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { getPublicSettings } from "@/lib/settings";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ msg?: string }>;
}) {
  const { msg } = await searchParams;
  const { store, payment, banners } = await getPublicSettings();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Definições</h1>
        <p className="text-muted-foreground mt-0.5 text-sm">
          Estes valores aparecem no checkout e no rodapé da loja.
        </p>
      </div>

      {msg ? <p className="bg-muted rounded-md px-4 py-3 text-sm">{decodeURIComponent(msg)}</p> : null}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Carrossel da home</CardTitle>
          <p className="text-muted-foreground text-sm">
            Flyers de 1920×400. Deixa a imagem vazia para desactivar o slide. Sem título, o banner
            inteiro fica clicável.
          </p>
        </CardHeader>
        <CardContent>
          <form action={saveBannersAction} className="space-y-4">
            {[0, 1, 2, 3, 4].map((slot) => {
              const banner = banners[slot];
              const n = slot + 1;

              return (
                <div key={n} className="border-border/60 rounded-lg border p-3 sm:p-4">
                  <p className="text-muted-foreground mb-3 text-xs font-semibold tracking-wider uppercase">
                    Slide {n}
                  </p>

                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    <div className="lg:col-span-2">
                      <Field name={`banner_${n}_image`} label="Imagem (URL)">
                        <Input
                          id={`banner_${n}_image`}
                          name={`banner_${n}_image`}
                          defaultValue={banner?.image ?? ""}
                          placeholder="https://…/banner.jpg"
                        />
                      </Field>
                    </div>

                    <Field name={`banner_${n}_title`} label="Título (opcional)">
                      <Input
                        id={`banner_${n}_title`}
                        name={`banner_${n}_title`}
                        defaultValue={banner?.title ?? ""}
                      />
                    </Field>

                    <Field name={`banner_${n}_href`} label="Link">
                      <Input
                        id={`banner_${n}_href`}
                        name={`banner_${n}_href`}
                        defaultValue={banner?.href ?? ""}
                        placeholder="/categoria/profile"
                      />
                    </Field>
                  </div>
                </div>
              );
            })}

            <Button type="submit" className="w-full sm:w-auto">
              Guardar carrossel
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Loja e contacto</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={saveStoreSettingsAction} className="space-y-4">
              <Field name="name" label="Nome da loja">
                <Input id="name" name="name" defaultValue={store.name} required />
              </Field>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field name="whatsapp" label="WhatsApp" hint="Só dígitos, com indicativo. Ex: 244923000000">
                  <Input
                    id="whatsapp"
                    name="whatsapp"
                    inputMode="tel"
                    defaultValue={store.whatsapp}
                    required
                  />
                </Field>

                <Field name="email" label="Email de contacto">
                  <Input id="email" name="email" type="email" defaultValue={store.email} />
                </Field>
              </div>

              <Field name="address" label="Morada">
                <Input id="address" name="address" defaultValue={store.address} />
              </Field>

              <Field name="hours" label="Horário de atendimento">
                <Input id="hours" name="hours" defaultValue={store.hours} />
              </Field>

              <Button type="submit" className="w-full">
                Guardar loja
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Pagamentos</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={savePaymentSettingsAction} className="space-y-4">
              <div className="space-y-3">
                <label className="flex items-center gap-2 text-sm font-medium">
                  <input
                    type="checkbox"
                    name="transfer_enabled"
                    defaultChecked={payment.transfer.enabled}
                    className="size-4"
                  />
                  Aceitar transferência bancária
                </label>

                <div className="grid gap-4 sm:grid-cols-2">
                  <Field name="transfer_bank" label="Banco">
                    <Input
                      id="transfer_bank"
                      name="transfer_bank"
                      defaultValue={payment.transfer.bank}
                    />
                  </Field>
                  <Field name="transfer_holder" label="Titular da conta">
                    <Input
                      id="transfer_holder"
                      name="transfer_holder"
                      defaultValue={payment.transfer.holder}
                    />
                  </Field>
                </div>

                <Field name="transfer_iban" label="IBAN" hint="Aparece na página do pedido.">
                  <Input
                    id="transfer_iban"
                    name="transfer_iban"
                    defaultValue={payment.transfer.iban}
                    className="font-mono"
                  />
                </Field>

                <Field name="transfer_instructions" label="Instruções de transferência">
                  <Textarea
                    id="transfer_instructions"
                    name="transfer_instructions"
                    rows={2}
                    defaultValue={payment.transfer.instructions}
                  />
                </Field>
              </div>

              <div className="border-border/60 space-y-3 border-t pt-4">
                <label className="flex items-center gap-2 text-sm font-medium">
                  <input
                    type="checkbox"
                    name="cash_enabled"
                    defaultChecked={payment.cash.enabled}
                    className="size-4"
                  />
                  Aceitar pagamento em dinheiro
                </label>

                <Field name="cash_instructions" label="Instruções de pagamento presencial">
                  <Textarea
                    id="cash_instructions"
                    name="cash_instructions"
                    rows={2}
                    defaultValue={payment.cash.instructions}
                  />
                </Field>
              </div>

              <Button type="submit" className="w-full">
                Guardar pagamentos
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      <p className="text-muted-foreground text-xs">
        Se desactivares as duas formas de pagamento, o checkout deixa de permitir criar pedidos.
      </p>
    </div>
  );
}

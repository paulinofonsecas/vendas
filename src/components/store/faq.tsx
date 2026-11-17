import { Plus } from "lucide-react";

const ITEMS = [
  {
    q: "Como recebo o que comprei?",
    a: "Assim que confirmares o pagamento, enviamos tudo por WhatsApp. Perfis de streaming vêm com email, password e PIN; produtos digitais chegam como link de acesso.",
  },
  {
    q: "Que formas de pagamento aceitam?",
    a: "Transferência bancária (IBAN) ou pagamento em dinheiro no acto da entrega, em Luanda. Para transferência, envias o comprovativo na página do pedido.",
  },
  {
    q: "Quanto tempo demora a confirmação?",
    a: "Normalmente menos de 30 minutos em horário de atendimento. Pedidos fora de horas ficam em fila para a manhã seguinte.",
  },
  {
    q: "E se o perfil deixar de funcionar?",
    a: "Cada perfil tem um período de garantia indicado no produto. Dentro desse prazo, substituímos sem custo — basta enviar o código do pedido no WhatsApp.",
  },
  {
    q: "O câmbio tem taxa fixa?",
    a: "A cotação é a do momento em que crias o pedido e fica registada. Não muda depois, mesmo que o mercado se mova.",
  },
];

export function Faq() {
  return (
    <section className="mx-auto max-w-5xl px-2 py-6 sm:px-6 sm:py-20">
      <div className="mb-10 text-center">
        <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">Perguntas frequentes</h2>
        <p className="text-muted-foreground mt-2 text-sm sm:text-base">
          Se ficar alguma dúvida, falamos por WhatsApp.
        </p>
      </div>

      <div className="divide-border border-border divide-y rounded-xl border">
        {ITEMS.map((item) => (
          <details key={item.q} className="group px-4 py-4 sm:px-6">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-sm font-medium sm:text-base">
              {item.q}
              <Plus className="text-muted-foreground size-4 shrink-0 transition-transform group-open:rotate-45" />
            </summary>
            <p className="text-muted-foreground mt-3 text-sm">{item.a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}

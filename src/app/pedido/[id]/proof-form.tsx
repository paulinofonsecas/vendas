"use client";

import { useActionState } from "react";

import { uploadProofAction, type ProofState } from "@/app/actions/checkout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initial: ProofState = {};

export function ProofForm({ orderId }: { orderId: string }) {
  const [state, formAction, pending] = useActionState(uploadProofAction, initial);

  return (
    <form action={formAction} className="space-y-3">
      <input type="hidden" name="orderId" value={orderId} />
      <div className="space-y-2">
        <Label htmlFor="file">Comprovativo</Label>
        <Input
          id="file"
          name="file"
          type="file"
          accept="image/jpeg,image/png,image/webp,application/pdf"
          required
        />
        <p className="text-muted-foreground text-xs">JPG, PNG, WEBP ou PDF até 10 MB.</p>
      </div>

      {state.error ? <p className="text-destructive text-sm">{state.error}</p> : null}
      {state.success ? (
        <p className="text-sm text-emerald-700">
          Comprovativo enviado. Vamos confirmar e avisar-te por WhatsApp.
        </p>
      ) : null}

      <Button type="submit" disabled={pending}>
        {pending ? "A enviar…" : "Enviar comprovativo"}
      </Button>
    </form>
  );
}

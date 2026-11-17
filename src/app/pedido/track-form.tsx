"use client";

import { useActionState } from "react";

import { trackOrderAction, type TrackState } from "@/app/actions/track";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initial: TrackState = {};

export function TrackForm() {
  const [state, formAction, pending] = useActionState(trackOrderAction, initial);

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="code">Código do pedido</Label>
        <Input id="code" name="code" placeholder="VD-2026-0001" autoComplete="off" required />
      </div>

      <div className="space-y-2">
        <Label htmlFor="whatsapp">WhatsApp usado na compra</Label>
        <Input
          id="whatsapp"
          name="whatsapp"
          inputMode="tel"
          placeholder="923 000 000"
          autoComplete="tel"
          required
        />
      </div>

      {state.error ? <p className="text-destructive text-sm">{state.error}</p> : null}

      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "A procurar…" : "Ver pedido"}
      </Button>
    </form>
  );
}

"use client";

import { useActionState } from "react";
import { loginAction, type LoginActionState } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type LoginFormProps = {
  callbackUrl: string;
};

const initialState: LoginActionState = {
  success: false,
  message: "",
};

export function LoginForm({ callbackUrl }: LoginFormProps) {
  const [state, formAction, isPending] = useActionState(loginAction, initialState);

  return (
    <Card className="w-full border-border/60 bg-card/90 shadow-soft backdrop-blur">
      <CardHeader>
        <CardTitle>Entrar</CardTitle>
        <CardDescription>
          Use suas credenciais para acessar a área autenticada do RestaurantPro.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-4">
          <input type="hidden" name="callbackUrl" value={callbackUrl} />
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium">
              E-mail
            </label>
            <Input id="email" name="email" type="email" autoComplete="email" required placeholder="voce@restaurante.com" />
          </div>
          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-medium">
              Senha
            </label>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              placeholder="********"
            />
          </div>
          {state.message ? (
            <p className="rounded-xl border border-destructive/20 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {state.message}
            </p>
          ) : null}
          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? "Autenticando..." : "Entrar"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

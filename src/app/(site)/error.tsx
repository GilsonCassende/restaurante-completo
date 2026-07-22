"use client";

import { useEffect } from "react";
import { FeedbackState } from "@/components/design-system";

type SiteErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function SiteError({ error, reset }: SiteErrorProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] items-center justify-center p-6">
      <FeedbackState
        variant="error"
        title="Não foi possível carregar a landing"
        description="O sistema encontrou um erro ao montar os dados do restaurante. Podemos tentar novamente com segurança."
        actionLabel="Tentar novamente"
        onAction={reset}
        className="w-full max-w-xl"
      />
    </div>
  );
}


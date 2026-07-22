"use client";

import { FeedbackState } from "@/components/design-system";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <FeedbackState
      variant="error"
      title="Falha ao carregar settings"
      description={error.message || "Ocorreu um erro inesperado ao montar as configurações do restaurante."}
      actionLabel="Tentar novamente"
      onAction={reset}
    />
  );
}


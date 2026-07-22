"use client";

import { useMemo } from "react";
import type { ReservationFiltersInput } from "@/schemas";

type UseReservationFiltersProps = {
  filters: ReservationFiltersInput;
};

export function useReservationFilters({ filters }: UseReservationFiltersProps) {
  return useMemo(() => {
    const isActiveStatus = filters.status && filters.status !== "all";
    const isDatePeriod = filters.period !== "custom";

    return {
      filters,
      isActiveStatus,
      isDatePeriod,
      periodLabel:
        filters.period === "today"
          ? "Hoje"
          : filters.period === "tomorrow"
            ? "Amanhã"
            : filters.period === "week"
              ? "Semana"
              : filters.period === "month"
                ? "Mês"
                : "Personalizado",
    };
  }, [filters]);
}

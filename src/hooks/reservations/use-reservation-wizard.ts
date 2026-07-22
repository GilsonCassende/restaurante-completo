"use client";

import { useMemo, useState } from "react";

export type ReservationWizardStep = "intro" | "schedule" | "seats" | "review" | "complete";

export type ReservationWizardState = {
  step: ReservationWizardStep;
  reservationDate: string;
  reservationTime: string;
  guests: number;
  tableId: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  notes: string;
};

const STEPS: ReservationWizardStep[] = ["intro", "schedule", "seats", "review", "complete"];

export function useReservationWizard(initialState: Partial<ReservationWizardState> = {}) {
  const [state, setState] = useState<ReservationWizardState>({
    step: initialState.step ?? "intro",
    reservationDate: initialState.reservationDate ?? "",
    reservationTime: initialState.reservationTime ?? "",
    guests: initialState.guests ?? 2,
    tableId: initialState.tableId ?? "",
    customerName: initialState.customerName ?? "",
    customerPhone: initialState.customerPhone ?? "",
    customerEmail: initialState.customerEmail ?? "",
    notes: initialState.notes ?? "",
  });

  const stepIndex = STEPS.indexOf(state.step);

  const api = useMemo(
    () => ({
      state,
      canGoBack: stepIndex > 0,
      canGoNext: stepIndex < STEPS.length - 1,
      setReservationDate: (reservationDate: string) => setState((current) => ({ ...current, reservationDate })),
      setReservationTime: (reservationTime: string) => setState((current) => ({ ...current, reservationTime })),
      setGuests: (guests: number) => setState((current) => ({ ...current, guests })),
      setTableId: (tableId: string) => setState((current) => ({ ...current, tableId })),
      setCustomerName: (customerName: string) => setState((current) => ({ ...current, customerName })),
      setCustomerPhone: (customerPhone: string) => setState((current) => ({ ...current, customerPhone })),
      setCustomerEmail: (customerEmail: string) => setState((current) => ({ ...current, customerEmail })),
      setNotes: (notes: string) => setState((current) => ({ ...current, notes })),
      goToStep: (step: ReservationWizardStep) => setState((current) => ({ ...current, step })),
      nextStep: () =>
        setState((current) => ({
          ...current,
          step: STEPS[Math.min(STEPS.indexOf(current.step) + 1, STEPS.length - 1)],
        })),
      prevStep: () =>
        setState((current) => ({
          ...current,
          step: STEPS[Math.max(STEPS.indexOf(current.step) - 1, 0)],
        })),
      reset: () =>
        setState({
          step: "intro",
          reservationDate: "",
          reservationTime: "",
          guests: 2,
          tableId: "",
          customerName: "",
          customerPhone: "",
          customerEmail: "",
          notes: "",
        }),
    }),
    [state, stepIndex]
  );

  return api;
}

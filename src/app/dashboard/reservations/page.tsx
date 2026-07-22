import type { Metadata } from "next";
import { ROLES } from "@/permissions";
import { requireRole } from "@/lib/session";
import { listTablesByRestaurant, listReservationsByRestaurant } from "@/prisma";
import { ReservationsStudio } from "@/components/dashboard/reservations";
import { listReservationsForRestaurant } from "@/services/reservation";
import { reservationFiltersSchema } from "@/schemas";

export const metadata: Metadata = {
  title: "Reservas",
  description: "Gestão profissional de reservas, calendário, filtros e timeline.",
};

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function pickFirst(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function ReservationsPage({ searchParams }: PageProps) {
  const user = await requireRole([ROLES.SUPER_ADMIN, ROLES.OWNER, ROLES.MANAGER, ROLES.STAFF]);
  const resolvedSearchParams = (await searchParams) ?? {};
  const [tables, allReservations] = await Promise.all([
    listTablesByRestaurant(user.restaurantId),
    listReservationsByRestaurant(user.restaurantId),
  ]);

  const filters = reservationFiltersSchema.parse({
    page: pickFirst(resolvedSearchParams.page) ?? "1",
    perPage: pickFirst(resolvedSearchParams.perPage) ?? "10",
    search: pickFirst(resolvedSearchParams.search) ?? "",
    status: pickFirst(resolvedSearchParams.status) ?? "all",
    period: pickFirst(resolvedSearchParams.period) ?? "today",
    date: pickFirst(resolvedSearchParams.date) ?? undefined,
    view: pickFirst(resolvedSearchParams.view) ?? "day",
  });

  const result = await listReservationsForRestaurant(user.restaurantId, filters);

  return (
    <ReservationsStudio
      restaurantName={user.restaurant.name}
      tables={tables}
      reservations={allReservations}
      result={result}
      filters={filters}
    />
  );
}

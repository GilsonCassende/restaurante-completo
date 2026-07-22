import type { Metadata } from "next";
import { AppShell } from "@/components/layout/app-shell";
import { ReservationFlow } from "@/components/reservations";
import { ThemeLoader } from "@/context/theme";
import { getRuntimeConfig } from "@/lib/enterprise";
import { buildNextMetadata } from "@/lib/enterprise/seo";
import { normalizeSupportedLocale } from "@/lib/enterprise/i18n";
import { getRestaurantLanding } from "@/services/landing";
import { getThemeForRestaurant } from "@/services/theme";
import { listTablesByRestaurant } from "@/prisma";
import { listTodayReservationsForRestaurant, listUpcomingReservationsForRestaurant } from "@/services/reservation";

export async function generateMetadata(): Promise<Metadata> {
  const landing = await getRestaurantLanding();
  const runtime = getRuntimeConfig();
  const locale = normalizeSupportedLocale(landing.restaurant.language, "pt-BR");

  return buildNextMetadata({
    title: `Reservas | ${landing.restaurant.name}`,
    description: "Fluxo profissional para reserva de mesas com validação de horário, capacidade e mensagem automática.",
    canonicalPath: "/reservas",
    locale,
    siteUrl: runtime.metadataBaseUrl,
    type: "website",
    robots: {
      index: true,
      follow: true,
      archive: true,
      snippet: true,
    },
  });
}

export default async function ReservationsPage() {
  const landing = await getRestaurantLanding();
  const theme = await getThemeForRestaurant(landing.restaurant);
  const [tables, todayReservations, upcomingReservations] = await Promise.all([
    listTablesByRestaurant(landing.restaurant.id),
    listTodayReservationsForRestaurant(landing.restaurant.id),
    listUpcomingReservationsForRestaurant(landing.restaurant.id, 30),
  ]);

  return (
    <ThemeLoader theme={theme}>
      <AppShell className="py-8">
        <ReservationFlow
          restaurant={landing.restaurant}
          tables={tables}
          reservations={[...todayReservations, ...upcomingReservations]}
        />
      </AppShell>
    </ThemeLoader>
  );
}

import { ROLES } from "@/permissions";
import { requireRole } from "@/lib/session";
import { getAdminDashboardAction } from "@/actions/admin";
import { AdminStudio } from "@/components/dashboard/admin";

type PageProps = {
  searchParams?: Promise<{
    organizationId?: string;
  }>;
};

export default async function AdminDashboardPage({ searchParams }: PageProps) {
  await requireRole([ROLES.SUPER_ADMIN]);
  const params = await searchParams;
  const dashboard = await getAdminDashboardAction(params?.organizationId ?? null);
  return <AdminStudio dashboard={dashboard} />;
}

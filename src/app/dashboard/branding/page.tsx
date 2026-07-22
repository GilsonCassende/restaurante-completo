import type { Metadata } from "next";
import { ROLES } from "@/permissions";
import { requireRole } from "@/lib/session";
import { BrandingStudio } from "@/components/dashboard";

export const metadata: Metadata = {
  title: "Branding",
  description: "Controle visual white label do restaurante.",
};

export default async function DashboardBrandingPage() {
  const user = await requireRole([ROLES.SUPER_ADMIN, ROLES.OWNER]);

  return <BrandingStudio restaurant={user.restaurant} />;
}


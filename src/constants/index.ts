import type { NavItem } from "@/types";

export const APP_CONFIG = {
  name: "RestaurantPro",
  description:
    "SaaS profissional para restaurantes com uma base modular, escalável e preparada para evolução por fases.",
} as const;

export const NAV_LINKS: NavItem[] = [
  { label: "Estrutura", href: "#estrutura" },
  { label: "Stack", href: "#stack" },
  { label: "API", href: "/api/health" },
];

export const STORAGE_KEYS = {
  theme: "restaurantpro-theme",
} as const;


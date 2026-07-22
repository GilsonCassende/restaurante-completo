import { NextResponse } from "next/server";
import { getSystemHealth } from "@/lib/production";

export async function GET() {
  const health = await getSystemHealth();
  return NextResponse.json({
    name: "RestaurantPro",
    phase: "production-ready",
    ...health,
  });
}

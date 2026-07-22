import { NextResponse } from "next/server";
import { getSystemHealth } from "@/lib/production";

export async function GET() {
  const health = await getSystemHealth();
  return NextResponse.json({
    status: health.status,
    timestamp: health.timestamp,
    metrics: health.metrics,
    checks: health.checks,
    observability: {
      adapters: health.observability.adapters,
      recentEvents: health.observability.events.slice(0, 25),
      recentMetrics: health.observability.metrics.slice(0, 25),
    },
  });
}

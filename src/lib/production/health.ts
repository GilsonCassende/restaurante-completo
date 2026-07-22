import { prisma } from "@/prisma/client";
import { getObservabilitySnapshot, recordMetric } from "./observability";

export type HealthStatus = "ok" | "degraded" | "down";

export type SystemHealth = {
  status: HealthStatus;
  timestamp: string;
  uptimeSeconds: number;
  checks: {
    database: {
      status: HealthStatus;
      latencyMs: number | null;
      error: string | null;
    };
  };
  metrics: {
    memoryRssMb: number;
    heapUsedMb: number;
    activeHandles: number;
  };
  observability: ReturnType<typeof getObservabilitySnapshot>;
};

async function checkDatabase() {
  const startedAt = Date.now();
  try {
    await prisma.$runCommandRaw({ ping: 1 });
    const latencyMs = Date.now() - startedAt;
    return { status: "ok" as const, latencyMs, error: null };
  } catch (error) {
    return {
      status: "down" as const,
      latencyMs: null,
      error: error instanceof Error ? error.message : "Database check failed.",
    };
  }
}

export async function getSystemHealth(): Promise<SystemHealth> {
  const database = await checkDatabase();
  const memory = process.memoryUsage();
  const processWithHandles = process as NodeJS.Process & { _getActiveHandles?: () => unknown[] };
  const activeHandles = typeof processWithHandles._getActiveHandles === "function" ? processWithHandles._getActiveHandles().length : 0;

  const status: HealthStatus = database.status === "ok" ? "ok" : "degraded";
  recordMetric({ name: "system.health", value: status === "ok" ? 1 : 0, tags: { status } });

  return {
    status,
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.round(process.uptime()),
    checks: {
      database,
    },
    metrics: {
      memoryRssMb: Math.round(memory.rss / 1024 / 1024),
      heapUsedMb: Math.round(memory.heapUsed / 1024 / 1024),
      activeHandles,
    },
    observability: getObservabilitySnapshot(),
  };
}

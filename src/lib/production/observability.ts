export type ObservabilityLevel = "debug" | "info" | "warn" | "error";

export type ObservabilityEvent = {
  id: string;
  kind: "log" | "metric" | "audit" | "activity" | "login" | "permission";
  level: ObservabilityLevel;
  tenantId: string | null;
  restaurantId: string | null;
  name: string;
  message: string;
  metadata: Record<string, unknown> | null;
  createdAt: Date;
};

export type ObservabilityMetric = {
  name: string;
  value: number;
  tenantId: string | null;
  restaurantId: string | null;
  tags: Record<string, string>;
  createdAt: Date;
};

export type ObservabilityAdapter = {
  name: string;
  enabled: boolean;
  captureEvent?: (event: ObservabilityEvent) => void | Promise<void>;
  captureMetric?: (metric: ObservabilityMetric) => void | Promise<void>;
  captureError?: (error: Error, context?: Record<string, unknown>) => void | Promise<void>;
};

const MAX_EVENTS = 500;
const MAX_METRICS = 500;

const events: ObservabilityEvent[] = [];
const metrics: ObservabilityMetric[] = [];

const adapters = new Map<string, ObservabilityAdapter>();

function createId(prefix: string) {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

function pushBounded<T>(store: T[], value: T, limit: number) {
  store.push(value);
  while (store.length > limit) {
    store.shift();
  }
}

export function registerObservabilityAdapter(adapter: ObservabilityAdapter) {
  adapters.set(adapter.name, adapter);
  return adapter;
}

export function listObservabilityAdapters() {
  return Array.from(adapters.values());
}

export function createNoopAdapter(name: string): ObservabilityAdapter {
  return {
    name,
    enabled: false,
  };
}

export function createSentryAdapter() {
  return createNoopAdapter("sentry");
}

export function createOpenTelemetryAdapter() {
  return createNoopAdapter("opentelemetry");
}

export function createDatadogAdapter() {
  return createNoopAdapter("datadog");
}

export function createPrometheusAdapter() {
  return createNoopAdapter("prometheus");
}

export function createGrafanaAdapter() {
  return createNoopAdapter("grafana");
}

export function createNewRelicAdapter() {
  return createNoopAdapter("newrelic");
}

export function recordObservabilityEvent(input: {
  kind: ObservabilityEvent["kind"];
  level?: ObservabilityLevel;
  tenantId?: string | null;
  restaurantId?: string | null;
  name: string;
  message: string;
  metadata?: Record<string, unknown> | null;
}) {
  const event: ObservabilityEvent = {
    id: createId("evt"),
    kind: input.kind,
    level: input.level ?? "info",
    tenantId: input.tenantId ?? null,
    restaurantId: input.restaurantId ?? null,
    name: input.name,
    message: input.message,
    metadata: input.metadata ?? null,
    createdAt: new Date(),
  };

  pushBounded(events, event, MAX_EVENTS);

  for (const adapter of adapters.values()) {
    if (adapter.enabled && adapter.captureEvent) {
      void adapter.captureEvent(event);
    }
  }

  return event;
}

export function recordMetric(input: {
  name: string;
  value: number;
  tenantId?: string | null;
  restaurantId?: string | null;
  tags?: Record<string, string>;
}) {
  const metric: ObservabilityMetric = {
    name: input.name,
    value: input.value,
    tenantId: input.tenantId ?? null,
    restaurantId: input.restaurantId ?? null,
    tags: input.tags ?? {},
    createdAt: new Date(),
  };

  pushBounded(metrics, metric, MAX_METRICS);

  for (const adapter of adapters.values()) {
    if (adapter.enabled && adapter.captureMetric) {
      void adapter.captureMetric(metric);
    }
  }

  return metric;
}

export function recordAuditEvent(input: {
  tenantId: string;
  restaurantId: string;
  actorUserId?: string | null;
  action: string;
  resource: string;
  resourceId?: string | null;
  metadata?: Record<string, unknown> | null;
}) {
  return recordObservabilityEvent({
    kind: "audit",
    level: "info",
    tenantId: input.tenantId,
    restaurantId: input.restaurantId,
    name: input.action,
    message: `${input.action}:${input.resource}`,
    metadata: {
      actorUserId: input.actorUserId ?? null,
      resource: input.resource,
      resourceId: input.resourceId ?? null,
      ...input.metadata,
    },
  });
}

export function recordActivityEvent(input: {
  tenantId: string;
  restaurantId: string;
  action: string;
  resource?: string | null;
  metadata?: Record<string, unknown> | null;
}) {
  return recordObservabilityEvent({
    kind: "activity",
    level: "info",
    tenantId: input.tenantId,
    restaurantId: input.restaurantId,
    name: input.action,
    message: input.resource ? `${input.action}:${input.resource}` : input.action,
    metadata: input.metadata ?? null,
  });
}

export function recordLoginEvent(input: {
  tenantId: string | null;
  restaurantId: string | null;
  email: string;
  success: boolean;
  reason?: string | null;
}) {
  return recordObservabilityEvent({
    kind: "login",
    level: input.success ? "info" : "warn",
    tenantId: input.tenantId,
    restaurantId: input.restaurantId,
    name: input.success ? "login_success" : "login_failed",
    message: input.success ? "Autenticação concluída." : "Falha de autenticação.",
    metadata: {
      email: input.email,
      success: input.success,
      reason: input.reason ?? null,
    },
  });
}

export function recordPermissionEvent(input: {
  tenantId: string | null;
  restaurantId: string | null;
  userId?: string | null;
  action: string;
  allowed: boolean;
  resource?: string | null;
}) {
  return recordObservabilityEvent({
    kind: "permission",
    level: input.allowed ? "info" : "warn",
    tenantId: input.tenantId,
    restaurantId: input.restaurantId,
    name: input.action,
    message: input.allowed ? "Permissão concedida." : "Permissão negada.",
    metadata: {
      userId: input.userId ?? null,
      resource: input.resource ?? null,
      allowed: input.allowed,
    },
  });
}

export function getObservabilitySnapshot() {
  return {
    events: events.slice().reverse(),
    metrics: metrics.slice().reverse(),
    adapters: listObservabilityAdapters().map((adapter) => ({
      name: adapter.name,
      enabled: adapter.enabled,
    })),
  };
}


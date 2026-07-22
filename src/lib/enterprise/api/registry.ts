import "server-only";

import { createHmac, randomUUID } from "node:crypto";
import type {
  ApiAuditEntry,
  ApiEventLog,
  ApiEventPayload,
  ApiEventSubscription,
  ApiRateLimitDecision,
  ApiWebhookDelivery,
  EnterpriseApiKeyPolicy,
  EnterpriseApiVersion,
  OpenApiRoute,
  WebhookSubscription,
} from "./types";

type RateLimitBucket = {
  count: number;
  resetAt: number;
};

type ApiTenantStore = {
  keys: Map<string, EnterpriseApiKeyPolicy>;
  webhooks: WebhookSubscription[];
  subscriptions: ApiEventSubscription[];
  logs: ApiEventLog[];
  audit: ApiAuditEntry[];
  deliveries: ApiWebhookDelivery[];
  rateLimits: Map<string, RateLimitBucket>;
  routes: Map<string, OpenApiRoute>;
};

const stores = new Map<string, ApiTenantStore>();

function getStore(tenantId: string) {
  const current = stores.get(tenantId);
  if (current) return current;
  const store: ApiTenantStore = {
    keys: new Map(),
    webhooks: [],
    subscriptions: [],
    logs: [],
    audit: [],
    deliveries: [],
    rateLimits: new Map(),
    routes: new Map(),
  };
  stores.set(tenantId, store);
  return store;
}

function now() {
  return new Date();
}

function hashSecret(secret: string) {
  return createHmac("sha256", "restaurantpro-api-secret").update(secret).digest("hex");
}

export function createEnterpriseApiKeyPolicy(
  input: Omit<EnterpriseApiKeyPolicy, "createdAt" | "updatedAt"> & { createdAt?: Date; updatedAt?: Date }
) {
  return {
    ...input,
    createdAt: input.createdAt ?? now(),
    updatedAt: input.updatedAt ?? now(),
  };
}

export function registerEnterpriseApiKey(policy: EnterpriseApiKeyPolicy) {
  const store = getStore(policy.tenantId);
  store.keys.set(policy.keyId, policy);
  return policy;
}

export function getEnterpriseApiKey(tenantId: string, keyId: string) {
  return getStore(tenantId).keys.get(keyId) ?? null;
}

export function listEnterpriseApiKeys(tenantId: string) {
  return Array.from(getStore(tenantId).keys.values());
}

export function registerWebhookSubscription(
  input: Omit<WebhookSubscription, "createdAt" | "updatedAt"> & { createdAt?: Date; updatedAt?: Date }
) {
  const webhook: WebhookSubscription = {
    ...input,
    createdAt: input.createdAt ?? now(),
    updatedAt: input.updatedAt ?? now(),
  };
  getStore(input.tenantId).webhooks.push(webhook);
  return webhook;
}

export function listWebhookSubscriptions(tenantId: string) {
  return getStore(tenantId).webhooks.slice();
}

export function registerApiEventSubscription(
  input: Omit<ApiEventSubscription, "id" | "createdAt" | "updatedAt"> & { id?: string; createdAt?: Date; updatedAt?: Date }
) {
  const subscription: ApiEventSubscription = {
    ...input,
    id: input.id ?? randomUUID(),
    createdAt: input.createdAt ?? now(),
    updatedAt: input.updatedAt ?? now(),
  };
  getStore(input.tenantId).subscriptions.push(subscription);
  return subscription;
}

export function listApiEventSubscriptions(tenantId: string) {
  return getStore(tenantId).subscriptions.slice();
}

export function checkApiRateLimit(input: {
  tenantId: string;
  apiKeyId: string;
  scope?: string;
  limit?: number;
  windowMs?: number;
  now?: number;
}): ApiRateLimitDecision {
  const store = getStore(input.tenantId);
  const limit = input.limit ?? 60;
  const windowMs = input.windowMs ?? 60_000;
  const key = [input.apiKeyId, input.scope ?? "default"].join(":");
  const current = input.now ?? Date.now();
  const bucket = store.rateLimits.get(key);

  if (!bucket || bucket.resetAt <= current) {
    const resetAt = current + windowMs;
    store.rateLimits.set(key, { count: 1, resetAt });
    return {
      allowed: true,
      remaining: Math.max(limit - 1, 0),
      resetAt,
    };
  }

  bucket.count += 1;
  const allowed = bucket.count <= limit;
  store.rateLimits.set(key, bucket);
  return {
    allowed,
    remaining: Math.max(limit - bucket.count, 0),
    resetAt: bucket.resetAt,
  };
}

export function resetApiRateLimit(tenantId: string, apiKeyId?: string) {
  const store = getStore(tenantId);
  if (!apiKeyId) {
    store.rateLimits.clear();
    return;
  }

  for (const key of Array.from(store.rateLimits.keys())) {
    if (key.startsWith(`${apiKeyId}:`)) {
      store.rateLimits.delete(key);
    }
  }
}

export function recordApiEvent(input: Omit<ApiEventLog, "id" | "createdAt"> & { createdAt?: Date }) {
  const entry: ApiEventLog = {
    ...input,
    id: randomUUID(),
    createdAt: input.createdAt ?? now(),
  };
  getStore(input.tenantId).logs.push(entry);
  return entry;
}

export function listApiEvents(tenantId: string) {
  return getStore(tenantId).logs.slice().reverse();
}

export function recordApiAudit(
  input: Omit<ApiAuditEntry, "id" | "createdAt"> & { createdAt?: Date }
) {
  const entry: ApiAuditEntry = {
    ...input,
    id: randomUUID(),
    createdAt: input.createdAt ?? now(),
  };
  getStore(input.tenantId).audit.push(entry);
  return entry;
}

export function listApiAuditEvents(tenantId: string) {
  return getStore(tenantId).audit.slice().reverse();
}

export function recordWebhookDelivery(
  input: Omit<ApiWebhookDelivery, "id" | "createdAt" | "updatedAt"> & { id?: string; createdAt?: Date; updatedAt?: Date }
) {
  const delivery: ApiWebhookDelivery = {
    ...input,
    id: input.id ?? randomUUID(),
    createdAt: input.createdAt ?? now(),
    updatedAt: input.updatedAt ?? now(),
  };
  getStore(input.tenantId).deliveries.push(delivery);
  return delivery;
}

export function listWebhookDeliveries(tenantId: string) {
  return getStore(tenantId).deliveries.slice().reverse();
}

export function validateEnterpriseApiKey(tenantId: string, apiKeyId: string, secret: string) {
  const policy = getEnterpriseApiKey(tenantId, apiKeyId);
  if (!policy || policy.status !== "active") {
    return false;
  }

  if (policy.secretHash) {
    return hashSecret(secret) === policy.secretHash;
  }

  if (policy.webhookSigningSecret) {
    return secret === policy.webhookSigningSecret;
  }

  return false;
}

export function signWebhookPayload(secret: string, payload: string | Record<string, unknown>) {
  const body = typeof payload === "string" ? payload : JSON.stringify(payload);
  return createHmac("sha256", secret).update(body).digest("hex");
}

export function registerOpenApiRoute(input: OpenApiRoute & { tenantId: string; version?: EnterpriseApiVersion }) {
  const store = getStore(input.tenantId);
  const key = `${input.method.toUpperCase()} ${input.path}`;
  store.routes.set(key, input);
  return input;
}

export function listOpenApiRoutes(tenantId: string) {
  return Array.from(getStore(tenantId).routes.values());
}

export function buildOpenApiDocument(version: EnterpriseApiVersion, routes: OpenApiRoute[]) {
  return {
    openapi: "3.1.0",
    info: {
      title: "RestaurantPro Enterprise API",
      version,
      description: "Enterprise API infrastructure for versioning, keys, webhooks, logs and subscriptions.",
    },
    servers: [
      {
        url: `/api/${version}`,
      },
    ],
    components: {
      securitySchemes: {
        ApiKeyAuth: {
          type: "apiKey",
          in: "header",
          name: "x-api-key",
        },
      },
    },
    security: [
      {
        ApiKeyAuth: [],
      },
    ],
    paths: routes.reduce<Record<string, unknown>>((acc, route) => {
      const currentPath = (acc[route.path] ?? {}) as Record<string, unknown>;
      currentPath[route.method] = {
        summary: route.summary,
        description: route.description ?? route.summary,
        tags: route.tags ?? ["enterprise"],
        responses: {
          200: {
            description: "Success",
          },
        },
      };
      acc[route.path] = currentPath;
      return acc;
    }, {}),
  };
}

export function buildSwaggerDocument(version: EnterpriseApiVersion, routes: OpenApiRoute[]) {
  const openapi = buildOpenApiDocument(version, routes);
  return {
    swagger: "UI-ready",
    openapi,
  };
}

export function emitApiEvent(input: ApiEventPayload) {
  const log = recordApiEvent({
    tenantId: input.tenantId,
    restaurantId: input.restaurantId,
    apiKeyId: null,
    path: `/events/${input.event}`,
    method: "POST",
    statusCode: 202,
    durationMs: 0,
    metadata: {
      source: input.source,
      data: input.data,
      ...(input.metadata ?? {}),
    },
  });

  const store = getStore(input.tenantId);
  for (const subscription of store.subscriptions) {
    if (!subscription.active || subscription.event !== input.event) continue;
    recordWebhookDelivery({
      tenantId: subscription.tenantId,
      restaurantId: subscription.restaurantId,
      event: subscription.event,
      targetUrl: subscription.targetUrl,
      status: "queued",
      signature: signWebhookPayload(subscription.secret, input.data),
      metadata: {
        eventLogId: log.id,
        source: input.source,
      },
    });
  }

  return log;
}

export function createEnterpriseApiInfrastructure(version: EnterpriseApiVersion, routes: OpenApiRoute[] = []) {
  const openapi = buildOpenApiDocument(version, routes);
  const swagger = buildSwaggerDocument(version, routes);

  return {
    version,
    openapi,
    swagger,
    createEnterpriseApiKeyPolicy,
    registerEnterpriseApiKey,
    getEnterpriseApiKey,
    listEnterpriseApiKeys,
    registerWebhookSubscription,
    listWebhookSubscriptions,
    registerApiEventSubscription,
    listApiEventSubscriptions,
    checkApiRateLimit,
    resetApiRateLimit,
    recordApiEvent,
    listApiEvents,
    recordApiAudit,
    listApiAuditEvents,
    recordWebhookDelivery,
    listWebhookDeliveries,
    validateEnterpriseApiKey,
    signWebhookPayload,
    registerOpenApiRoute,
    listOpenApiRoutes,
    emitApiEvent,
  };
}

export type EnterpriseApiVersion = "v1";

export type ApiSubscriptionStatus = "active" | "paused" | "revoked" | "expired";

export type EnterpriseApiKeyPolicy = {
  tenantId: string;
  restaurantId: string;
  keyId: string;
  name: string;
  status: ApiSubscriptionStatus;
  scopes: string[];
  rateLimitPerMinute: number;
  secretHash?: string | null;
  webhookSigningSecret: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type OpenApiRoute = {
  path: string;
  method: "get" | "post" | "put" | "patch" | "delete";
  summary: string;
  description?: string;
  tags?: string[];
};

export type WebhookSubscription = {
  tenantId: string;
  restaurantId: string;
  event: string;
  targetUrl: string;
  secret: string;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type ApiEventLog = {
  id: string;
  tenantId: string;
  restaurantId: string;
  apiKeyId: string | null;
  path: string;
  method: string;
  statusCode: number;
  durationMs: number;
  createdAt: Date;
  metadata: Record<string, unknown> | null;
};

export type ApiRateLimitDecision = {
  allowed: boolean;
  remaining: number;
  resetAt: number;
};

export type ApiEventSubscription = {
  id: string;
  tenantId: string;
  restaurantId: string;
  event: string;
  targetUrl: string;
  secret: string;
  active: boolean;
  version: EnterpriseApiVersion;
  createdAt: Date;
  updatedAt: Date;
};

export type ApiEventPayload = {
  tenantId: string;
  restaurantId: string;
  event: string;
  source: string;
  data: Record<string, unknown>;
  metadata?: Record<string, unknown> | null;
};

export type ApiAuditEntry = {
  id: string;
  tenantId: string;
  restaurantId: string;
  apiKeyId: string | null;
  action: string;
  resource: string;
  status: "allowed" | "blocked";
  createdAt: Date;
  metadata: Record<string, unknown> | null;
};

export type ApiWebhookDelivery = {
  id: string;
  tenantId: string;
  restaurantId: string;
  event: string;
  targetUrl: string;
  status: "queued" | "delivered" | "failed";
  signature: string;
  createdAt: Date;
  updatedAt: Date;
  metadata: Record<string, unknown> | null;
};

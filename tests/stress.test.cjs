const assert = require("node:assert/strict");
const test = require("node:test");
const { loadSource, resetRuntime } = require("./test-harness.cjs");

test("stress: observability stores stay bounded", { timeout: 120000 }, async () => {
  resetRuntime();

  const observability = loadSource("lib/production/observability");

  for (let index = 0; index < 750; index += 1) {
    observability.recordObservabilityEvent({
      kind: "metric",
      name: `event-${index}`,
      message: "stress",
    });
    observability.recordMetric({
      name: `metric-${index}`,
      value: index,
    });
  }

  const snapshot = observability.getObservabilitySnapshot();
  assert.equal(snapshot.events.length, 500);
  assert.equal(snapshot.metrics.length, 500);
});

test("stress: api registry rate limits are isolated by tenant", { timeout: 120000 }, async () => {
  resetRuntime();

  const api = loadSource("lib/enterprise/api/registry");
  api.registerEnterpriseApiKey(api.createEnterpriseApiKeyPolicy({
    tenantId: "tenant-a",
    restaurantId: "restaurant-a",
    keyId: "key-a",
    name: "Main",
    status: "active",
    scopes: ["read"],
    rateLimitPerMinute: 60,
    secretHash: null,
    webhookSigningSecret: null,
  }));

  const first = api.checkApiRateLimit({ tenantId: "tenant-a", apiKeyId: "key-a", limit: 2, windowMs: 60_000, now: 1000 });
  const second = api.checkApiRateLimit({ tenantId: "tenant-a", apiKeyId: "key-a", limit: 2, windowMs: 60_000, now: 1000 });
  const third = api.checkApiRateLimit({ tenantId: "tenant-a", apiKeyId: "key-a", limit: 2, windowMs: 60_000, now: 1000 });

  assert.equal(first.allowed, true);
  assert.equal(second.allowed, true);
  assert.equal(third.allowed, false);
});


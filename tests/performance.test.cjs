const assert = require("node:assert/strict");
const test = require("node:test");
const { loadSource, resetRuntime } = require("./test-harness.cjs");

test("performance: rate limits remain stable under repeated calls", { timeout: 120000 }, async () => {
  resetRuntime();

  const security = loadSource("lib/production/security");
  const key = security.createRateLimitKey("checkout", "tenant-a");

  let allowedCount = 0;
  for (let index = 0; index < 1000; index += 1) {
    const result = security.checkRateLimit(key, 25, 60_000, 1_000_000);
    if (result.allowed) allowedCount += 1;
  }

  assert.equal(allowedCount, 25);
});

test("performance: markdown sanitization handles large payloads", { timeout: 120000 }, async () => {
  resetRuntime();

  const security = loadSource("lib/production/security");
  const payload = Array.from({ length: 2500 }, (_, index) => `<p data-i="${index}" onclick="evil()">Item ${index}</p>`).join("");
  const sanitized = security.sanitizeMarkdown(payload);

  assert.equal(sanitized.includes("onclick"), false);
  assert.equal(sanitized.includes("javascript:"), false);
});


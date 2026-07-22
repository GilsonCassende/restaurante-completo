const assert = require("node:assert/strict");
const test = require("node:test");
const { loadSource, resetRuntime } = require("./test-harness.cjs");

test("smoke: security headers and route rules stay intact", { timeout: 120000 }, async () => {
  resetRuntime();

  const security = loadSource("lib/production/security");
  const middleware = loadSource("middleware");

  const headers = security.buildSecurityHeaders();

  assert.equal(headers["X-Frame-Options"], "DENY");
  assert.equal(headers["X-Content-Type-Options"], "nosniff");
  assert.equal(headers["Content-Security-Policy"].includes("unsafe-eval"), false);
  assert.equal(middleware.isPublicPath("/"), true);
  assert.equal(middleware.getRouteAccessRule("/dashboard")?.prefix, "/dashboard");
  assert.equal(middleware.getLoginRedirect("/checkout"), "/login?callbackUrl=%2Fcheckout");
});

test("smoke: slug, upload and sanitization helpers behave safely", { timeout: 120000 }, async () => {
  resetRuntime();

  const slug = loadSource("lib/slug");
  const security = loadSource("lib/production/security");

  assert.equal(slug.slugify("Frango grelhado premium"), "frango-grelhado-premium");
  assert.equal(slug.createUniqueSlug("Pao de alho", ["pao-de-alho"]), "pao-de-alho-2");
  assert.equal(security.validateUploadFile({
    filename: "menu.pdf",
    mimeType: "application/pdf",
    size: 1024,
  }).allowed, true);
  assert.equal(security.validateUploadFile({
    filename: "../menu.pdf",
    mimeType: "application/pdf",
    size: 1024,
  }).allowed, false);
  assert.equal(security.sanitizeHtml('<script>alert(1)</script><p>ok</p>').includes("script"), false);
});

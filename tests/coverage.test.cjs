const assert = require("node:assert/strict");
const test = require("node:test");
const { loadSource, mockModule, resetRuntime } = require("./test-harness.cjs");

test("coverage: credential checks accept valid users", { timeout: 120000 }, async () => {
  resetRuntime();

  const now = new Date("2026-01-01T00:00:00.000Z");
  mockModule("@/prisma", {
    ensureDevelopmentSeed: async () => undefined,
    findUserByEmail: async () => ({
      id: "user-a",
      restaurantId: "restaurant-a",
      name: "Owner",
      email: "owner@example.com",
      password: "hash",
      image: null,
      role: "OWNER",
      active: true,
      createdAt: now,
      updatedAt: now,
    }),
    findRestaurantById: async () => ({
      id: "restaurant-a",
      name: "Restaurant A",
      slug: "restaurant-a",
      logo: null,
      favicon: null,
      banner: null,
      coverImage: null,
      primaryColor: null,
      secondaryColor: null,
      accentColor: null,
      backgroundColor: null,
      surfaceColor: null,
      textColor: null,
      successColor: null,
      warningColor: null,
      errorColor: null,
      fontFamily: null,
      borderRadius: null,
      buttonStyle: null,
      cardStyle: null,
      heroStyle: null,
      footerStyle: null,
      instagram: null,
      facebook: null,
      tiktok: null,
      youtube: null,
      linkedin: null,
      website: null,
      phone: null,
      supportPhone: null,
      whatsapp: null,
      email: null,
      address: null,
      slogan: null,
      history: null,
      mission: null,
      description: null,
      state: null,
      neighborhood: null,
      street: null,
      number: null,
      postalCode: null,
      latitude: null,
      longitude: null,
      openingHours: null,
      timezone: null,
      currency: null,
      language: null,
      country: null,
      city: null,
      weeklyHours: null,
      holidays: null,
      isOpen: true,
      minimumOrderAmount: null,
      deliveryFee: null,
      deliveryRadiusKm: null,
      averagePreparationTime: null,
      seoTitle: null,
      seoDescription: null,
      seoKeywords: null,
      ogImage: null,
      twitterTitle: null,
      twitterDescription: null,
      twitterImage: null,
      integrations: null,
      subscriptionPlan: "PRO",
      active: true,
      createdAt: now,
      updatedAt: now,
    }),
    verifyPassword: async () => true,
  });
  mockModule("@/lib/production", {
    recordLoginEvent: () => undefined,
  });

  const credentials = loadSource("auth/credentials");
  const user = await credentials.verifyCredentials({ email: "owner@example.com", password: "Password123!" });

  assert.equal(user?.email, "owner@example.com");
  assert.equal(user?.role, "OWNER");
});

test("coverage: permissions and middleware keep the tenant guardrails", { timeout: 120000 }, async () => {
  resetRuntime();

  const roles = loadSource("permissions/roles");
  const middleware = loadSource("middleware");

  assert.equal(roles.hasRoleAccess(roles.ROLES.OWNER, [roles.ROLES.OWNER]), true);
  assert.equal(roles.isRoleAtLeast(roles.ROLES.SUPER_ADMIN, roles.ROLES.OWNER), true);
  assert.equal(middleware.getRouteAccessRule("/dashboard/orders")?.roles.includes(roles.ROLES.STAFF), true);
});


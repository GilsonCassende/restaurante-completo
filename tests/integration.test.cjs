const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const Module = require("node:module");
const test = require("node:test");
const ts = require("typescript");

const projectRoot = path.resolve(__dirname, "..");
const srcRoot = path.join(projectRoot, "src");
const originalLoad = Module._load;
const originalResolveFilename = Module._resolveFilename;

const mockRegistry = new Map();

function transpile(source, filename) {
  return ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      esModuleInterop: true,
      jsx: ts.JsxEmit.ReactJSX,
    },
    fileName: filename,
  }).outputText;
}

function registerTypeScriptHook() {
  require.extensions[".ts"] = function compileTypeScript(module, filename) {
    const source = fs.readFileSync(filename, "utf8");
    module._compile(transpile(source, filename), filename);
  };

  require.extensions[".tsx"] = require.extensions[".ts"];
}

function resolveAlias(request) {
  const relative = request.slice(2);
  const basePath = path.join(srcRoot, relative);
  const candidates = [
    basePath,
    `${basePath}.ts`,
    `${basePath}.tsx`,
    `${basePath}.js`,
    path.join(basePath, "index.ts"),
    path.join(basePath, "index.tsx"),
    path.join(basePath, "index.js"),
  ];

  for (const candidate of candidates) {
    if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
      return candidate;
    }
  }

  return basePath;
}

function registerModuleHooks() {
  Module._resolveFilename = function resolveFilename(request, parent, isMain, options) {
    if (request.startsWith("@/")) {
      return originalResolveFilename.call(this, resolveAlias(request), parent, isMain, options);
    }

    return originalResolveFilename.call(this, request, parent, isMain, options);
  };

  Module._load = function load(request, parent, isMain) {
    if (mockRegistry.has(request)) {
      return mockRegistry.get(request);
    }

    return originalLoad.call(this, request, parent, isMain);
  };
}

function clearSrcCache() {
  for (const key of Object.keys(require.cache)) {
    if (key.startsWith(`${srcRoot}${path.sep}`)) {
      delete require.cache[key];
    }
  }
}

function resetRuntime() {
  clearSrcCache();
  mockRegistry.clear();
}

function mockModule(request, exports) {
  mockRegistry.set(request, exports);
}

function loadSource(relativePath) {
  return require(path.join(srcRoot, relativePath));
}

registerTypeScriptHook();
registerModuleHooks();

test("schemas, slug and qr helpers validate the domain inputs", { timeout: 120000 }, async () => {
  resetRuntime();

  const { createCategorySchema, updateCategorySchema, createProductSchema, updateProductSchema, createTableSchema, updateTableSchema } = loadSource("schemas");
  const { slugify, createUniqueSlug } = loadSource("lib/slug");
  const { buildQrCodeDataUrl } = loadSource("lib/qr");

  assert.equal(slugify("Frango grelhado com legumes"), "frango-grelhado-com-legumes");
  assert.equal(createUniqueSlug("Pao de alho", ["pao-de-alho"]), "pao-de-alho-2");
  assert.match(buildQrCodeDataUrl("tenant:table"), /^data:image\/svg\+xml;utf8,/);

  assert.ok(createCategorySchema.safeParse({
    name: "Entradas",
    description: "Starter dishes",
    image: "",
    active: true,
    sortOrder: "1",
  }).success);

  assert.ok(!createCategorySchema.safeParse({ name: "A" }).success);
  assert.ok(updateCategorySchema.safeParse({
    id: "64f1c7a1d1b9c7f2a7a1d1b9",
    name: "Pratos",
    active: false,
    sortOrder: 2,
  }).success);

  assert.ok(createProductSchema.safeParse({
    categoryId: "64f1c7a1d1b9c7f2a7a1d1b9",
    name: "Frango",
    description: "",
    image: "",
    price: "14500",
    promotionalPrice: "",
    active: true,
    featured: false,
    preparationTime: "15",
  }).success);

  assert.ok(!createProductSchema.safeParse({
    categoryId: "",
    name: "Fr",
    price: -1,
  }).success);

  assert.ok(updateProductSchema.safeParse({
    id: "64f1c7a1d1b9c7f2a7a1d1b9",
    categoryId: "64f1c7a1d1b9c7f2a7a1d1b9",
    name: "Frango especial",
    price: 15000,
    featured: true,
  }).success);

  assert.ok(createTableSchema.safeParse({ number: "1", active: true }).success);
  assert.ok(updateTableSchema.safeParse({ id: "64f1c7a1d1b9c7f2a7a1d1b9", number: 2, active: false }).success);
});

test("middleware, permissions and session enforce route and role access", { timeout: 120000 }, async () => {
  resetRuntime();

  const { ROLES, hasRoleAccess, isRoleAtLeast } = loadSource("permissions/roles");
  const middleware = loadSource("middleware");

  assert.equal(middleware.isPublicPath("/"), true);
  assert.equal(middleware.isPublicPath("/login"), true);
  assert.equal(middleware.isPublicPath("/dashboard"), false);
  assert.equal(middleware.getRouteAccessRule("/menu")?.roles.includes(ROLES.STAFF), true);
  assert.equal(middleware.getRouteAccessRule("/dashboard/orders")?.roles.includes(ROLES.STAFF), true);
  assert.equal(middleware.getRouteAccessRule("/dashboard/tracking")?.roles.includes(ROLES.DRIVER), true);
  assert.equal(middleware.getRouteAccessRule("/dashboard/products")?.prefix, "/dashboard");
  assert.equal(middleware.getLoginRedirect("/dashboard/products"), "/login?callbackUrl=%2Fdashboard%2Fproducts");

  assert.equal(hasRoleAccess(ROLES.OWNER, [ROLES.OWNER, ROLES.MANAGER]), true);
  assert.equal(hasRoleAccess(ROLES.STAFF, [ROLES.OWNER, ROLES.MANAGER]), false);
  assert.equal(hasRoleAccess(ROLES.DRIVER, [ROLES.DRIVER, ROLES.STAFF]), true);
  assert.equal(isRoleAtLeast(ROLES.OWNER, ROLES.MANAGER), true);
  assert.equal(isRoleAtLeast(ROLES.STAFF, ROLES.OWNER), false);

  const now = new Date("2026-01-01T00:00:00.000Z");
  const user = {
    id: "user-a",
    restaurantId: "restaurant-a",
    name: "Owner",
    email: "owner@example.com",
    password: "hash",
    image: null,
    role: ROLES.OWNER,
    active: true,
    createdAt: now,
    updatedAt: now,
  };
  const restaurant = {
    id: "restaurant-a",
    name: "Restaurant A",
    slug: "restaurant-a",
    logo: null,
    phone: null,
    email: null,
    address: null,
    subscriptionPlan: "PRO",
    active: true,
    createdAt: now,
    updatedAt: now,
  };
  let sessionUser = user;

  mockModule("@/auth", {
    auth: async () => ({ user: { id: sessionUser.id } }),
  });
  mockModule("@/prisma", {
    findUserById: async () => sessionUser,
    findRestaurantById: async () => restaurant,
  });
  mockModule("next/navigation", {
    redirect: (url) => {
      const error = new Error(`REDIRECT:${url}`);
      error.code = "REDIRECT";
      throw error;
    },
  });

  const session = loadSource("lib/session");
  const currentUser = await session.getCurrentUser();
  assert.deepEqual(currentUser?.restaurant, restaurant);
  assert.equal((await session.getCurrentRestaurant())?.slug, "restaurant-a");
  assert.equal((await session.requireRole([ROLES.OWNER]))?.id, "user-a");

  sessionUser = {
    ...user,
    role: ROLES.STAFF,
  };

  await assert.rejects(
    () => session.requireRole([ROLES.OWNER, ROLES.MANAGER]),
    /REDIRECT:\/unauthorized/
  );
});

test("credentials verify the seeded development users", { timeout: 120000 }, async () => {
  resetRuntime();

  const { verifyCredentials } = loadSource("auth/credentials");

  const valid = await verifyCredentials({
    email: "superadmin@restaurantpro.local",
    password: "Password123!",
  });
  assert.equal(valid?.email, "superadmin@restaurantpro.local");
  assert.equal(valid?.role, "SUPER_ADMIN");

  const invalid = await verifyCredentials({
    email: "superadmin@restaurantpro.local",
    password: "wrong-password",
  });
  assert.equal(invalid, null);
});

test("category actions create, edit, delete and isolate tenant data", { timeout: 120000 }, async () => {
  resetRuntime();

  const prisma = loadSource("prisma");
  await prisma.ensureDevelopmentSeed();

  const restaurantA = await prisma.findRestaurantBySlug("platform");
  const restaurantB = await prisma.findRestaurantBySlug("demo-restaurant");
  const superAdmin = await prisma.findUserByEmail("superadmin@restaurantpro.local");
  const owner = await prisma.findUserByEmail("owner@restaurantpro.local");
  const superAdminWithRestaurant = { ...superAdmin, restaurant: restaurantA };
  const ownerWithRestaurant = { ...owner, restaurant: restaurantB };
  const baseCountA = (await prisma.listCategoriesByRestaurant(restaurantA.id)).length;
  const baseCountB = (await prisma.listCategoriesByRestaurant(restaurantB.id)).length;

  assert.ok(restaurantA);
  assert.ok(restaurantB);
  assert.ok(superAdmin);
  assert.ok(owner);

  let currentUser = superAdmin;
  const revalidateCalls = [];

  mockModule("next/cache", {
    revalidatePath: (pathname) => {
      revalidateCalls.push(pathname);
    },
  });
  mockModule("@/lib/session", {
    requireRole: async () => currentUser,
  });

  const { createCategoryAction, updateCategoryAction, deleteCategoryAction } = loadSource("actions/category");

  const categoryA = await createCategoryAction({
    name: "Starters",
    description: "Tenant A starters",
    image: "",
    active: true,
    sortOrder: 1,
  });
  assert.equal(categoryA.ok, true);
  assert.equal(categoryA.data.restaurantId, restaurantA.id);
  assert.equal(categoryA.data.slug, "starters");

  currentUser = owner;
  const categoryB = await createCategoryAction({
    name: "Starters",
    description: "Tenant B starters",
    image: "",
    active: true,
    sortOrder: 1,
  });
  assert.equal(categoryB.ok, true);
  assert.equal(categoryB.data.restaurantId, restaurantB.id);
  assert.equal(categoryB.data.slug, "starters");

  const categoryBSecond = await createCategoryAction({
    name: "Starters",
    description: "Tenant B starters again",
    image: "",
    active: true,
    sortOrder: 2,
  });
  assert.equal(categoryBSecond.ok, true);
  assert.equal(categoryBSecond.data.slug, "starters-2");

  const listA = await prisma.listCategoriesByRestaurant(restaurantA.id);
  const listB = await prisma.listCategoriesByRestaurant(restaurantB.id);
  assert.equal(listA.some((item) => item.restaurantId === restaurantB.id), false);
  assert.equal(listB.some((item) => item.restaurantId === restaurantA.id), false);
  assert.equal(listA.length, baseCountA + 1);
  assert.equal(listB.length, baseCountB + 2);

  const updatedB = await updateCategoryAction({
    id: categoryB.data.id,
    name: "Grills",
    description: "Updated tenant B",
    image: "",
    active: false,
    sortOrder: 9,
  });
  assert.equal(updatedB.ok, true);
  assert.equal(updatedB.data.slug, "grills");
  assert.equal(updatedB.data.active, false);

  currentUser = superAdminWithRestaurant;
  const crossTenantUpdate = await updateCategoryAction({
    id: categoryB.data.id,
    name: "Should not work",
    description: "",
    image: "",
    active: true,
    sortOrder: 1,
  });
  assert.equal(crossTenantUpdate.ok, false);

  const deleted = await deleteCategoryAction({ id: categoryA.data.id });
  assert.equal(deleted.ok, true);
  assert.ok(revalidateCalls.includes("/dashboard/categories"));

  const listAAfterDelete = await prisma.listCategoriesByRestaurant(restaurantA.id);
  assert.equal(listAAfterDelete.length, baseCountA);
});

test("product actions enforce tenant category ownership and creation", { timeout: 120000 }, async () => {
  resetRuntime();

  const prisma = loadSource("prisma");
  await prisma.ensureDevelopmentSeed();

  const restaurantA = await prisma.findRestaurantBySlug("platform");
  const restaurantB = await prisma.findRestaurantBySlug("demo-restaurant");
  const superAdmin = await prisma.findUserByEmail("superadmin@restaurantpro.local");
  const owner = await prisma.findUserByEmail("owner@restaurantpro.local");
  const baseCountB = (await prisma.listProductsByRestaurant(restaurantB.id)).length;

  assert.ok(restaurantA);
  assert.ok(restaurantB);
  assert.ok(superAdmin);
  assert.ok(owner);

  let currentUser = superAdmin;
  const revalidateCalls = [];

  mockModule("next/cache", {
    revalidatePath: (pathname) => {
      revalidateCalls.push(pathname);
    },
  });
  mockModule("@/lib/session", {
    requireRole: async () => currentUser,
  });

  const { createCategoryAction } = loadSource("actions/category");
  const { createProductAction, updateProductAction, deleteProductAction } = loadSource("actions/product");

  const categoryA = await createCategoryAction({
    name: "A Menu",
    description: "",
    image: "",
    active: true,
    sortOrder: 1,
  });
  currentUser = owner;
  const categoryB = await createCategoryAction({
    name: "B Menu",
    description: "",
    image: "",
    active: true,
    sortOrder: 1,
  });

  currentUser = superAdmin;
  const wrongTenantProduct = await createProductAction({
    categoryId: categoryB.data.id,
    name: "Tenant mismatch",
    description: "",
    image: "",
    price: 1000,
    promotionalPrice: "",
    active: true,
    featured: false,
    preparationTime: "10",
  });
  assert.equal(wrongTenantProduct.ok, false);

  currentUser = owner;
  const productB = await createProductAction({
    categoryId: categoryB.data.id,
    name: "Frango grelhado",
    description: "Grilled chicken",
    image: "",
    price: 14500,
    promotionalPrice: "",
    active: true,
    featured: true,
    preparationTime: "20",
  });
  assert.equal(productB.ok, true);
  assert.equal(productB.data.restaurantId, restaurantB.id);
  assert.equal(productB.data.slug, "frango-grelhado");
});

test("product actions deduplicate product slugs and keep tenant listing isolated", { timeout: 120000 }, async () => {
  resetRuntime();

  const prisma = loadSource("prisma");
  await prisma.ensureDevelopmentSeed();

  const restaurantA = await prisma.findRestaurantBySlug("platform");
  const restaurantB = await prisma.findRestaurantBySlug("demo-restaurant");
  const superAdmin = await prisma.findUserByEmail("superadmin@restaurantpro.local");
  const owner = await prisma.findUserByEmail("owner@restaurantpro.local");
  const baseCountB = (await prisma.listProductsByRestaurant(restaurantB.id)).length;

  assert.ok(restaurantA);
  assert.ok(restaurantB);
  assert.ok(superAdmin);
  assert.ok(owner);

  let currentUser = superAdmin;
  const revalidateCalls = [];

  mockModule("next/cache", {
    revalidatePath: (pathname) => {
      revalidateCalls.push(pathname);
    },
  });
  mockModule("@/lib/session", {
    requireRole: async () => currentUser,
  });

  const { createCategoryAction } = loadSource("actions/category");
  const { createProductAction } = loadSource("actions/product");

  const categoryA = await createCategoryAction({
    name: "A Menu",
    description: "",
    image: "",
    active: true,
    sortOrder: 1,
  });
  currentUser = owner;
  const categoryB = await createCategoryAction({
    name: "B Menu",
    description: "",
    image: "",
    active: true,
    sortOrder: 1,
  });

  const productB = await createProductAction({
    categoryId: categoryB.data.id,
    name: "Frango grelhado",
    description: "Grilled chicken",
    image: "",
    price: 14500,
    promotionalPrice: "",
    active: true,
    featured: true,
    preparationTime: "20",
  });
  assert.equal(productB.ok, true);
  assert.equal(productB.data.restaurantId, restaurantB.id);
  assert.equal(productB.data.slug, "frango-grelhado");

  const productBSecond = await createProductAction({
    categoryId: categoryB.data.id,
    name: "Frango grelhado",
    description: "Same name",
    image: "",
    price: 15000,
    promotionalPrice: "",
    active: true,
    featured: false,
    preparationTime: "22",
  });
  assert.equal(productBSecond.ok, true);
  assert.equal(productBSecond.data.slug, "frango-grelhado-2");

  const productListB = await prisma.listProductsByRestaurant(restaurantB.id);
  assert.equal(productListB.length, baseCountB + 2);
  assert.equal(productListB.every((item) => item.restaurantId === restaurantB.id), true);
});

test("product actions update, delete and keep tenant isolation", { timeout: 120000 }, async () => {
  resetRuntime();

  const prisma = loadSource("prisma");
  await prisma.ensureDevelopmentSeed();

  const restaurantA = await prisma.findRestaurantBySlug("platform");
  const restaurantB = await prisma.findRestaurantBySlug("demo-restaurant");
  const superAdmin = await prisma.findUserByEmail("superadmin@restaurantpro.local");
  const owner = await prisma.findUserByEmail("owner@restaurantpro.local");

  assert.ok(restaurantA);
  assert.ok(restaurantB);
  assert.ok(superAdmin);
  assert.ok(owner);

  let currentUser = superAdmin;
  const revalidateCalls = [];

  mockModule("next/cache", {
    revalidatePath: (pathname) => {
      revalidateCalls.push(pathname);
    },
  });
  mockModule("@/lib/session", {
    requireRole: async () => currentUser,
  });

  const { createCategoryAction } = loadSource("actions/category");
  const { createProductAction, updateProductAction, deleteProductAction } = loadSource("actions/product");

  const categoryA = await createCategoryAction({
    name: "A Menu",
    description: "",
    image: "",
    active: true,
    sortOrder: 1,
  });
  currentUser = owner;
  const categoryB = await createCategoryAction({
    name: "B Menu",
    description: "",
    image: "",
    active: true,
    sortOrder: 1,
  });

  currentUser = owner;
  const productB = await createProductAction({
    categoryId: categoryB.data.id,
    name: "Frango grelhado",
    description: "Grilled chicken",
    image: "",
    price: 14500,
    promotionalPrice: "",
    active: true,
    featured: true,
    preparationTime: "20",
  });

  const productBSecond = await createProductAction({
    categoryId: categoryB.data.id,
    name: "Frango grelhado",
    description: "Same name",
    image: "",
    price: 15000,
    promotionalPrice: "",
    active: true,
    featured: false,
    preparationTime: "22",
  });

  const updatedProduct = await updateProductAction({
    id: productB.data.id,
    categoryId: categoryB.data.id,
    name: "Frango premium",
    description: "Updated",
    image: "",
    price: 16000,
    promotionalPrice: 15500,
    active: false,
    featured: false,
    preparationTime: "25",
  });
  assert.equal(updatedProduct.ok, true);
  assert.equal(updatedProduct.data.slug, "frango-premium");
  assert.equal(updatedProduct.data.active, false);

  currentUser = superAdmin;
  const crossTenantProductUpdate = await updateProductAction({
    id: productB.data.id,
    categoryId: categoryA.data.id,
    name: "Cross tenant",
    description: "",
    image: "",
    price: 1,
    promotionalPrice: "",
    active: true,
    featured: false,
    preparationTime: "5",
  });
  assert.equal(crossTenantProductUpdate.ok, false);

  const crossTenantProductDelete = await deleteProductAction({ id: productBSecond.data.id });
  assert.equal(crossTenantProductDelete.ok, false);

  currentUser = owner;
  const deleted = await deleteProductAction({ id: productBSecond.data.id });
  assert.equal(deleted.ok, true);
  assert.ok(revalidateCalls.includes("/dashboard/products"));

  const remainingProducts = await prisma.listProductsByRestaurant(restaurantB.id);
  assert.equal(remainingProducts.length, 3);
});

test("table actions create, update, delete and keep qr codes tenant scoped", { timeout: 120000 }, async () => {
  resetRuntime();

  const prisma = loadSource("prisma");
  await prisma.ensureDevelopmentSeed();

  const restaurantA = await prisma.findRestaurantBySlug("platform");
  const restaurantB = await prisma.findRestaurantBySlug("demo-restaurant");
  const superAdmin = await prisma.findUserByEmail("superadmin@restaurantpro.local");
  const owner = await prisma.findUserByEmail("owner@restaurantpro.local");
  const baseCountA = (await prisma.listTablesByRestaurant(restaurantA.id)).length;
  const baseCountB = (await prisma.listTablesByRestaurant(restaurantB.id)).length;

  assert.ok(restaurantA);
  assert.ok(restaurantB);
  assert.ok(superAdmin);
  assert.ok(owner);

  let currentUser = superAdmin;
  const revalidateCalls = [];

  mockModule("next/cache", {
    revalidatePath: (pathname) => {
      revalidateCalls.push(pathname);
    },
  });
  mockModule("@/lib/session", {
    requireRole: async () => currentUser,
  });

  const { createTableAction, updateTableAction, deleteTableAction } = loadSource("actions/table");

  const tableA = await createTableAction({
    number: 1,
    active: true,
  });
  assert.equal(tableA.ok, true);
  assert.equal(tableA.data.restaurantId, restaurantA.id);
  assert.match(tableA.data.qrCode, /^data:image\/svg\+xml;utf8,/);

  currentUser = owner;
  const tableB = await createTableAction({
    number: 3,
    active: true,
  });
  assert.equal(tableB.ok, true);
  assert.equal(tableB.data.restaurantId, restaurantB.id);
  assert.match(tableB.data.qrCode, /^data:image\/svg\+xml;utf8,/);

  const duplicateTableB = await createTableAction({
    number: 3,
    active: true,
  });
  assert.equal(duplicateTableB.ok, false);

  const updatedTable = await updateTableAction({
    id: tableB.data.id,
    number: 4,
    active: false,
  });
  assert.equal(updatedTable.ok, true);
  assert.equal(updatedTable.data.number, 4);
  assert.equal(updatedTable.data.active, false);
  assert.match(updatedTable.data.qrCode, /^data:image\/svg\+xml;utf8,/);

  const listA = await prisma.listTablesByRestaurant(restaurantA.id);
  const listB = await prisma.listTablesByRestaurant(restaurantB.id);
  assert.equal(listA.length, baseCountA + 1);
  assert.equal(listB.length, baseCountB + 1);
  assert.equal(listA.every((item) => item.restaurantId === restaurantA.id), true);
  assert.equal(listB.every((item) => item.restaurantId === restaurantB.id), true);

  currentUser = superAdmin;
  const crossTenantTableUpdate = await updateTableAction({
    id: tableB.data.id,
    number: 3,
    active: true,
  });
  assert.equal(crossTenantTableUpdate.ok, false);

  const deleted = await deleteTableAction({ id: tableA.data.id });
  assert.equal(deleted.ok, true);
  assert.ok(revalidateCalls.includes("/dashboard/tables"));

  const remainingA = await prisma.listTablesByRestaurant(restaurantA.id);
  assert.equal(remainingA.length, baseCountA);
});

test("cart helpers, order actions and whatsapp payloads stay tenant-safe", { timeout: 120000 }, async () => {
  resetRuntime();

  const prisma = loadSource("prisma");
  await prisma.ensureDevelopmentSeed();

  const restaurantA = await prisma.findRestaurantBySlug("platform");
  const restaurantB = await prisma.findRestaurantBySlug("demo-restaurant");
  const superAdmin = await prisma.findUserByEmail("superadmin@restaurantpro.local");
  const owner = await prisma.findUserByEmail("owner@restaurantpro.local");

  assert.ok(restaurantA);
  assert.ok(restaurantB);
  assert.ok(superAdmin);
  assert.ok(owner);

  const cartHelpers = loadSource("context/cart");
  const whatsapp = loadSource("lib/whatsapp");
  let currentUser = superAdmin;
  const revalidateCalls = [];

  mockModule("next/cache", {
    revalidatePath: (pathname) => {
      revalidateCalls.push(pathname);
    },
  });
  mockModule("@/lib/session", {
    requireRole: async () => currentUser,
  });

  const { createCategoryAction } = loadSource("actions/category");
  const { createProductAction } = loadSource("actions/product");
  const { createTableAction } = loadSource("actions/table");
  const { createOrderAction, updateOrderStatusAction } = loadSource("actions/order");

  const categoryA = await createCategoryAction({
    name: "Menu A",
    description: "",
    image: "",
    active: true,
    sortOrder: 1,
  });
  const tableA = await createTableAction({
    number: 7,
    active: true,
  });
  const productA = await createProductAction({
    categoryId: categoryA.data.id,
    name: "Burger A",
    description: "",
    image: "",
    price: 10000,
    promotionalPrice: 8000,
    active: true,
    featured: false,
    preparationTime: "12",
  });

  currentUser = owner;
  const categoryB = await createCategoryAction({
    name: "Menu B",
    description: "",
    image: "",
    active: true,
    sortOrder: 1,
  });
  const tableB = await createTableAction({
    number: 9,
    active: true,
  });
  const productB = await createProductAction({
    categoryId: categoryB.data.id,
    name: "Burger B",
    description: "",
    image: "",
    price: 12000,
    promotionalPrice: "",
    active: true,
    featured: true,
    preparationTime: "14",
  });

  const cartBase = [
    {
      restaurantId: restaurantB.id,
      productId: productB.data.id,
      name: productB.data.name,
      slug: productB.data.slug,
      image: null,
      price: productB.data.promotionalPrice ?? productB.data.price,
      quantity: 1,
    },
  ];
  const cartTotals = cartHelpers.calculateCartTotals(cartHelpers.addCartItem([], restaurantB.id, productB.data, 1));
  assert.equal(cartTotals.subtotal, productB.data.promotionalPrice ?? productB.data.price);
  assert.equal(cartTotals.quantity, 1);
  assert.equal(cartHelpers.removeCartItem(cartBase, productB.data.id).length, 0);
  assert.equal(cartHelpers.setCartItemQuantity(cartBase, productB.data.id, 2)[0].quantity, 2);

  const whatsappMessage = whatsapp.buildWhatsAppOrderMessage({
    customerName: "Ana",
    customerPhone: "+244900000000",
    table: { number: tableB.data.number },
    items: [
      {
        name: productB.data.name,
        quantity: 2,
        price: productB.data.promotionalPrice ?? productB.data.price,
      },
    ],
    total: (productB.data.promotionalPrice ?? productB.data.price) * 2,
    notes: "Sem cebola",
  });
  assert.match(whatsappMessage, /Nome: Ana/);
  assert.match(whatsappMessage, /Mesa: 9/);
  assert.match(whatsappMessage, /Quantidade: 2/);
  assert.match(whatsappMessage, /Observações: Sem cebola/);
  assert.match(whatsapp.buildWhatsAppOrderUrl("+244900000000", whatsappMessage) ?? "", /^https:\/\/wa\.me\/244900000000\?text=/);

  currentUser = owner;
  const orderB = await createOrderAction({
    customerName: "Ana",
    customerPhone: "+244900000000",
    tableId: tableB.data.id,
    notes: "Sem cebola",
    items: [
      {
        productId: productB.data.id,
        quantity: 2,
      },
    ],
  });
  assert.equal(orderB.ok, true);
  assert.equal(orderB.data.order.restaurantId, restaurantB.id);
  assert.equal(orderB.data.order.total, (productB.data.promotionalPrice ?? productB.data.price) * 2);
  assert.match(orderB.data.whatsappMessage, /Nome: Ana/);
  assert.match(orderB.data.whatsappMessage, /Mesa: 9/);
  assert.match(orderB.data.whatsappMessage, /Total:/);
  assert.match(orderB.data.whatsappUrl ?? "", /^https:\/\/wa\.me\/244900000000\?text=/);

  const ordersB = await prisma.listOrdersByRestaurant(restaurantB.id);
  assert.equal(ordersB.length, 1);
  assert.equal(ordersB[0].items.length, 1);
  assert.equal(ordersB[0].items[0].productId, productB.data.id);

  currentUser = superAdmin;
  const orderA = await createOrderAction({
    customerName: "João",
    customerPhone: "+244910000000",
    tableId: tableA.data.id,
    notes: "",
    items: [
      {
        productId: productA.data.id,
        quantity: 1,
      },
    ],
  });
  assert.equal(orderA.ok, true);
  assert.equal(orderA.data.order.restaurantId, restaurantA.id);

  const crossTenantOrder = await createOrderAction({
    customerName: "Cross",
    customerPhone: "000",
    tableId: tableA.data.id,
    notes: "",
    items: [
      {
        productId: productB.data.id,
        quantity: 1,
      },
    ],
  });
  assert.equal(crossTenantOrder.ok, false);

  currentUser = owner;
  const updateB = await updateOrderStatusAction({
    id: orderB.data.order.id,
    status: "READY",
  });
  assert.equal(updateB.ok, true);
  assert.equal(updateB.data.status, "READY");

  currentUser = superAdmin;
  const crossTenantStatusUpdate = await updateOrderStatusAction({
    id: orderB.data.order.id,
    status: "DELIVERED",
  });
  assert.equal(crossTenantStatusUpdate.ok, false);

  const ordersA = await prisma.listOrdersByRestaurant(restaurantA.id);
  assert.equal(ordersA.length, 1);
  assert.equal(ordersA[0].items[0].productId, productA.data.id);
  assert.equal(ordersA.some((order) => order.restaurantId === restaurantB.id), false);
  assert.equal(ordersB.some((order) => order.restaurantId === restaurantA.id), false);
  assert.ok(revalidateCalls.includes("/dashboard/orders"));
});

test("crm, loyalty, coupons and cashback stay isolated and permissioned", { timeout: 120000 }, async () => {
  resetRuntime();

  const prisma = loadSource("prisma");
  await prisma.ensureDevelopmentSeed();

  const restaurantA = await prisma.findRestaurantBySlug("platform");
  const restaurantB = await prisma.findRestaurantBySlug("demo-restaurant");
  const superAdmin = await prisma.findUserByEmail("superadmin@restaurantpro.local");
  const owner = await prisma.findUserByEmail("owner@restaurantpro.local");
  const staff = await prisma.findUserByEmail("staff@restaurantpro.local");

  assert.ok(restaurantA);
  assert.ok(restaurantB);
  assert.ok(superAdmin);
  assert.ok(owner);
  assert.ok(staff);

  await prisma.upsertCustomer({
    restaurantId: restaurantA.id,
    name: "João Cliente",
    phone: "+244900000100",
    email: "joao@demo.local",
    active: true,
  });
  await prisma.upsertCustomer({
    restaurantId: restaurantB.id,
    name: "Maria Cliente",
    phone: "+244900000200",
    email: "maria@demo.local",
    active: true,
  });

  let currentUser = superAdmin;
  const revalidateCalls = [];

  mockModule("next/cache", {
    revalidatePath: (pathname) => {
      revalidateCalls.push(pathname);
    },
  });
  mockModule("@/lib/session", {
    requireRole: async (roles) => {
      if (!roles.includes(currentUser.role)) {
        throw new Error("FORBIDDEN");
      }
      return currentUser;
    },
  });

  const { getCrmDashboardAction, listCrmCustomersAction, createCampaignAction, saveCampaignRecipientAction } = loadSource("actions/crm");
  const { createCouponAction, listCouponsAction, recordCouponUsageAction } = loadSource("actions/coupons");
  const { getLoyaltyDashboardAction, upsertLoyaltyAccountAction, addLoyaltyTransactionAction, listLoyaltyAccountsAction } = loadSource("actions/loyalty");
  const { getCashbackDashboardAction, upsertCashbackAccountAction, recordCashbackTransactionAction, redeemCashbackAction, listCashbackAccountsAction } = loadSource("actions/cashback");

  const crmDashboardA = await getCrmDashboardAction();
  assert.equal(crmDashboardA.kpis.customers, 1);

  const crmListA = await listCrmCustomersAction({ search: "joão", page: 1, perPage: 10, status: "all", segment: "all" });
  assert.equal(crmListA.total, 1);
  assert.equal(crmListA.items[0].restaurantId, restaurantA.id);

  const campaign = await createCampaignAction({
    name: "Aniversário VIP",
    channel: "WHATSAPP",
    status: "DRAFT",
    subject: "Promoção especial",
    message: "Olá João!",
    audience: [crmListA.items[0].id],
    scheduledAt: "",
    active: true,
  });
  assert.equal(campaign.ok, true);

  const recipient = await saveCampaignRecipientAction({
    campaignId: campaign.data.id,
    customerId: crmListA.items[0].id,
    status: "DELIVERED",
    deliveredAt: new Date().toISOString(),
  });
  assert.equal(recipient.ok, true);

  const coupon = await createCouponAction({
    code: "SUMMER2026",
    name: "Campanha de verão",
    type: "PERCENTAGE",
    value: 15,
    minimumOrderAmount: 10000,
    maxUses: 100,
    maxUsesPerCustomer: 1,
    startsAt: "",
    endsAt: "",
    stackable: false,
    active: true,
    segmentId: null,
  });
  assert.equal(coupon.ok, true);

  const couponListA = await listCouponsAction({ search: "SUMMER", page: 1, perPage: 10, type: "all" });
  assert.equal(couponListA.total, 1);
  assert.equal(couponListA.items[0].restaurantId, restaurantA.id);

  const couponUsage = await recordCouponUsageAction({
    couponId: coupon.data.id,
    customerId: crmListA.items[0].id,
    discountAmount: 1500,
  });
  assert.equal(couponUsage.ok, true);

  const loyaltyAccount = await upsertLoyaltyAccountAction({
    customerId: crmListA.items[0].id,
    pointsBalance: 120,
    pointsExpiryDays: 180,
    rewardTier: "Gold",
    active: true,
  });
  assert.equal(loyaltyAccount.ok, true);

  const loyaltyTransaction = await addLoyaltyTransactionAction({
    accountId: loyaltyAccount.data.id,
    customerId: crmListA.items[0].id,
    type: "EARN",
    points: 40,
    notes: "Pedido premiado",
  });
  assert.equal(loyaltyTransaction.ok, true);

  const loyaltyDashboardA = await getLoyaltyDashboardAction();
  assert.equal(loyaltyDashboardA.accounts.length, 1);

  const cashbackAccount = await upsertCashbackAccountAction({
    customerId: crmListA.items[0].id,
    balance: 0.0,
    expiresAt: "",
    active: true,
  });
  assert.equal(cashbackAccount.ok, true);

  const cashbackCredit = await recordCashbackTransactionAction({
    accountId: cashbackAccount.data.id,
    customerId: crmListA.items[0].id,
    type: "CREDIT",
    amount: 50,
    notes: "Cashback do pedido",
  });
  assert.equal(cashbackCredit.ok, true);

  const cashbackRedeem = await redeemCashbackAction({
    customerId: crmListA.items[0].id,
    amount: 20,
    notes: "Resgate parcial",
  });
  assert.equal(cashbackRedeem.ok, true);

  const cashbackDashboardA = await getCashbackDashboardAction();
  assert.equal(cashbackDashboardA.accounts.length, 1);

  currentUser = owner;
  const crmDashboardB = await getCrmDashboardAction();
  assert.equal(crmDashboardB.kpis.customers, 1);

  const couponB = await createCouponAction({
    code: "SUMMER2026",
    name: "Campanha B",
    type: "FIXED",
    value: 1000,
    minimumOrderAmount: 5000,
    maxUses: 50,
    maxUsesPerCustomer: 1,
    startsAt: "",
    endsAt: "",
    stackable: false,
    active: true,
    segmentId: null,
  });
  assert.equal(couponB.ok, true);

  const couponListB = await listCouponsAction({ search: "SUMMER", page: 1, perPage: 10, type: "all" });
  assert.equal(couponListB.total, 1);
  assert.equal(couponListB.items[0].restaurantId, restaurantB.id);

  const cashbackListB = await listCashbackAccountsAction({ search: "Maria", page: 1, perPage: 10 });
  assert.equal(cashbackListB.total, 1);
  assert.equal(cashbackListB.items[0].restaurantId, restaurantB.id);

  currentUser = staff;
  await assert.rejects(
    () => createCouponAction({
      code: "STAFFDENIED",
      name: "Não permitido",
      type: "FIXED",
      value: 100,
      minimumOrderAmount: 1000,
      maxUses: 1,
      maxUsesPerCustomer: 1,
      startsAt: "",
      endsAt: "",
      stackable: false,
      active: true,
      segmentId: null,
    }),
    /FORBIDDEN/
  );

  assert.ok(revalidateCalls.includes("/dashboard/crm"));
  assert.ok(revalidateCalls.includes("/dashboard/coupons"));
  assert.ok(revalidateCalls.includes("/dashboard/loyalty"));
  assert.ok(revalidateCalls.includes("/dashboard/cashback"));
});

test("analytics and reports dashboards aggregate KPIs, preserve tenant isolation and export files", { timeout: 120000 }, async () => {
  resetRuntime();

  const prisma = loadSource("prisma");
  await prisma.ensureDevelopmentSeed();

  const restaurantA = await prisma.findRestaurantBySlug("platform");
  const restaurantB = await prisma.findRestaurantBySlug("demo-restaurant");
  const superAdmin = await prisma.findUserByEmail("superadmin@restaurantpro.local");
  const owner = await prisma.findUserByEmail("owner@restaurantpro.local");
  const staff = await prisma.findUserByEmail("staff@restaurantpro.local");

  assert.ok(restaurantA);
  assert.ok(restaurantB);
  assert.ok(superAdmin);
  assert.ok(owner);
  assert.ok(staff);

  let currentUser = superAdmin;
  mockModule("next/cache", {
    revalidatePath: () => {},
  });
  mockModule("@/lib/session", {
    requireRole: async (allowedRoles) => {
      if (!allowedRoles.includes(currentUser.role)) {
        throw new Error("FORBIDDEN");
      }
      return currentUser;
    },
  });

  const { createCategoryAction } = loadSource("actions/category");
  const { createProductAction } = loadSource("actions/product");
  const { createTableAction } = loadSource("actions/table");
  const { createOrderAction } = loadSource("actions/order");
  const { getAnalyticsDashboardAction, exportAnalyticsAction } = loadSource("actions/analytics");
  const { getReportsDashboardAction, exportReportsAction } = loadSource("actions/reports");

  currentUser = owner;
  const categoryB = await createCategoryAction({
    name: "BI Menu",
    description: "Analytics tenant B",
    image: "",
    active: true,
    sortOrder: 1,
  });
  const productB = await createProductAction({
    categoryId: categoryB.data.id,
    name: "BI Burger",
    description: "Analytics burger",
    image: "",
    price: 15000,
    promotionalPrice: "",
    active: true,
    featured: true,
    preparationTime: "18",
  });
  const tableB = await createTableAction({
    number: 77,
    active: true,
  });

  currentUser = superAdmin;
  const dashboardABefore = await getAnalyticsDashboardAction({ period: "today" });

  currentUser = owner;
  const orderB = await createOrderAction({
    customerName: "BI Client",
    customerPhone: "+244900001111",
    tableId: tableB.data.id,
    notes: "Alta prioridade",
    items: [
      {
        productId: productB.data.id,
        quantity: 2,
      },
    ],
  });
  assert.equal(orderB.ok, true);

  const dashboardBAfter = await getAnalyticsDashboardAction({ period: "today" });
  assert.equal(dashboardBAfter.summary.orders, dashboardABefore.summary.orders + 1);
  assert.equal(dashboardBAfter.trends.categoryShare.length > 0, true);
  assert.equal(dashboardBAfter.insights.length > 0, true);
  assert.equal(dashboardBAfter.alerts.some((alert) => alert.status === "prepared"), true);

  currentUser = superAdmin;
  const dashboardAAfter = await getAnalyticsDashboardAction({ period: "today" });
  assert.equal(dashboardAAfter.summary.orders, dashboardABefore.summary.orders);

  const customToday = new Date().toISOString().slice(0, 10);
  const customDashboard = await getAnalyticsDashboardAction({
    period: "custom",
    startDate: customToday,
    endDate: customToday,
  });
  assert.equal(customDashboard.period.start, customToday);
  assert.equal(customDashboard.period.end, customToday);

  currentUser = owner;
  const reportsDashboard = await getReportsDashboardAction({ period: "today", report: "all" });
  assert.equal(reportsDashboard.sections.length, 9);
  assert.ok(reportsDashboard.sections.some((section) => section.key === "orders"));

  const analyticsCsv = await exportAnalyticsAction({
    period: "today",
    startDate: undefined,
    endDate: undefined,
    page: 1,
    perPage: 20,
    format: "csv",
  });
  assert.equal(analyticsCsv.ok, true);
  assert.equal(analyticsCsv.data.mimeType.startsWith("text/csv"), true);

  const reportsXlsx = await exportReportsAction({
    period: "today",
    report: "all",
    startDate: undefined,
    endDate: undefined,
    page: 1,
    perPage: 20,
    format: "xlsx",
  });
  assert.equal(reportsXlsx.ok, true);
  assert.equal(reportsXlsx.data.mimeType.includes("spreadsheetml"), true);

  const reportsPdf = await exportReportsAction({
    period: "today",
    report: "all",
    startDate: undefined,
    endDate: undefined,
    page: 1,
    perPage: 20,
    format: "pdf",
  });
  assert.equal(reportsPdf.ok, true);
  assert.equal(reportsPdf.data.mimeType, "application/pdf");

  currentUser = staff;
  await assert.rejects(
    () =>
      exportAnalyticsAction({
        period: "today",
        startDate: undefined,
        endDate: undefined,
        page: 1,
        perPage: 20,
        format: "csv",
      }),
    /FORBIDDEN/
  );
});

test("payments and finance stay isolated, permissioned and exportable", { timeout: 120000 }, async () => {
  resetRuntime();

  const prisma = loadSource("prisma");
  await prisma.ensureDevelopmentSeed();

  const restaurantA = await prisma.findRestaurantBySlug("platform");
  const restaurantB = await prisma.findRestaurantBySlug("demo-restaurant");
  const superAdmin = await prisma.findUserByEmail("superadmin@restaurantpro.local");
  const owner = await prisma.findUserByEmail("owner@restaurantpro.local");
  const staff = await prisma.findUserByEmail("staff@restaurantpro.local");

  assert.ok(restaurantA);
  assert.ok(restaurantB);
  assert.ok(superAdmin);
  assert.ok(owner);
  assert.ok(staff);

  let currentUser = superAdmin;
  const revalidateCalls = [];

  mockModule("next/cache", {
    revalidatePath: (pathname) => {
      revalidateCalls.push(pathname);
    },
  });
  mockModule("@/lib/session", {
    requireRole: async (roles) => {
      if (!roles.includes(currentUser.role)) {
        throw new Error("FORBIDDEN");
      }
      return currentUser;
    },
  });

  const paymentsActions = loadSource("actions/payments");
  const invoicesActions = loadSource("actions/invoices");
  const financeActions = loadSource("actions/finance");

  currentUser = superAdmin;
  const paymentMethodsA = await paymentsActions.listPaymentMethodsAction();
  const creditCardMethodA = paymentMethodsA.find((method) => method.code === "credit_card") ?? paymentMethodsA[0];
  assert.ok(creditCardMethodA);

  const checkoutSummary = await paymentsActions.buildCheckoutSummaryAction({
    paymentMethodId: creditCardMethodA.id,
    gatewayProvider: "STRIPE",
    subtotal: 12000,
    tax: 1500,
    discount: 500,
    couponCode: "WELCOME",
    couponDiscount: 250,
    cashbackDiscount: 150,
    deliveryFee: 300,
    serviceFee: 200,
    tip: 400,
    currency: "AOA",
    status: "PAID",
  });
  assert.equal(checkoutSummary.ok, true);
  assert.equal(checkoutSummary.data.total, 13500);

  const paymentA = await paymentsActions.createPaymentAction({
    orderId: null,
    customerId: null,
    invoiceId: null,
    paymentMethodId: creditCardMethodA.id,
    gatewayProvider: "STRIPE",
    status: "PAID",
    subtotal: 12000,
    tax: 1500,
    discount: 500,
    couponCode: "WELCOME",
    couponDiscount: 250,
    cashbackDiscount: 150,
    deliveryFee: 300,
    serviceFee: 200,
    tip: 400,
    paidAmount: 14000,
    changeAmount: 500,
    currency: "AOA",
    reference: "PAY-A-001",
    gatewayReference: null,
    paidAt: new Date().toISOString(),
    metadata: { channel: "counter" },
  });
  assert.equal(paymentA.ok, true);
  assert.equal(paymentA.data.payment.restaurantId, restaurantA.id);

  const invoiceA = await invoicesActions.createInvoiceAction({
    orderId: null,
    paymentId: paymentA.data.payment.id,
    customerId: null,
    number: undefined,
    status: "PAID",
    subtotal: 12000,
    tax: 1500,
    discount: 500,
    total: 13000,
    pdfUrl: null,
    emailedAt: null,
    metadata: { note: "Auto invoice" },
  });
  assert.equal(invoiceA.ok, true);
  assert.equal(invoiceA.data.restaurantId, restaurantA.id);

  const movementA = await financeActions.recordFinancialMovementAction({
    walletId: null,
    paymentId: paymentA.data.payment.id,
    invoiceId: invoiceA.data.id,
    refundId: null,
    type: "EXPENSE",
    category: "Marketing",
    amount: 500,
    balanceAfter: 0,
    costCenter: "Marketing",
    notes: "Campanha digital",
    metadata: { campaign: "social" },
  });
  assert.equal(movementA.ok, true);

  const webhookA = await paymentsActions.recordWebhookEventAction({
    gatewayProvider: "STRIPE",
    eventType: "PAYMENT_APPROVED",
    externalId: "evt_001",
    status: "PROCESSED",
    payload: { paymentId: paymentA.data.payment.id },
    processedAt: new Date().toISOString(),
    error: null,
    attempts: 1,
    retryAt: null,
  });
  assert.equal(webhookA.ok, true);

  const refundA = await paymentsActions.createRefundAction({
    paymentId: paymentA.data.payment.id,
    transactionId: null,
    gatewayProvider: "STRIPE",
    type: "PARTIAL",
    status: "SUCCEEDED",
    amount: 1000,
    reason: "Cliente desistiu de um item",
    metadata: { source: "frontdesk" },
  });
  assert.equal(refundA.ok, true);

  const paymentsDashboardA = await paymentsActions.getPaymentsDashboardAction({ period: "today" });
  assert.ok(paymentsDashboardA.kpis.revenueToday > 0);
  assert.ok(paymentsDashboardA.kpis.approvedPayments >= 1);
  assert.ok(paymentsDashboardA.gatewayLogs.length >= 2);
  assert.ok(paymentsDashboardA.webhookEvents.length >= 1);

  const financeDashboardA = await financeActions.getFinanceDashboardAction({ period: "today", movementType: "all", costCenter: "" });
  assert.ok(financeDashboardA.kpis.cashFlow !== 0);
  assert.ok(financeDashboardA.costCenters.length >= 1);

  const paymentsListA = await paymentsActions.listPaymentsAction({ period: "today", page: 1, perPage: 20 });
  assert.equal(paymentsListA.total, 1);
  const invoicesListA = await invoicesActions.listInvoicesAction({ period: "today", page: 1, perPage: 20 });
  assert.equal(invoicesListA.total, 1);
  const refundsListA = await paymentsActions.listRefundsAction({ period: "today", page: 1, perPage: 20 });
  assert.equal(refundsListA.total, 1);
  const movementsListA = await financeActions.listFinancialMovementsAction({ period: "today", page: 1, perPage: 20 });
  assert.ok(movementsListA.total >= 2);

  currentUser = owner;
  const paymentMethodsB = await paymentsActions.listPaymentMethodsAction();
  const pixMethodB = paymentMethodsB.find((method) => method.code === "pix") ?? paymentMethodsB[0];
  assert.ok(pixMethodB);

  const paymentB = await paymentsActions.createPaymentAction({
    orderId: null,
    customerId: null,
    invoiceId: null,
    paymentMethodId: pixMethodB.id,
    gatewayProvider: "MERCADO_PAGO",
    status: "PAID",
    subtotal: 6000,
    tax: 600,
    discount: 0,
    couponCode: null,
    couponDiscount: 0,
    cashbackDiscount: 0,
    deliveryFee: 0,
    serviceFee: 0,
    tip: 0,
    paidAmount: 6600,
    changeAmount: 0,
    currency: "AOA",
    reference: "PAY-B-001",
    gatewayReference: null,
    paidAt: new Date().toISOString(),
    metadata: { channel: "qr" },
  });
  assert.equal(paymentB.ok, true);
  assert.equal(paymentB.data.payment.restaurantId, restaurantB.id);

  const paymentsDashboardB = await paymentsActions.getPaymentsDashboardAction({ period: "today" });
  assert.equal(paymentsDashboardB.payments.length, 1);
  assert.equal(paymentsDashboardB.payments[0].restaurantId, restaurantB.id);

  const financeDashboardB = await financeActions.getFinanceDashboardAction({ period: "today", movementType: "all", costCenter: "" });
  assert.equal(financeDashboardB.payments.length, 1);
  assert.equal(financeDashboardB.payments[0].restaurantId, restaurantB.id);

  currentUser = staff;
  await assert.rejects(
    () =>
      paymentsActions.exportPaymentsAction({
        period: "today",
        page: 1,
        perPage: 20,
        format: "csv",
      }),
    /FORBIDDEN/
  );
  await assert.rejects(
    () =>
      financeActions.exportFinanceAction({
        period: "today",
        page: 1,
        perPage: 20,
        format: "csv",
      }),
    /FORBIDDEN/
  );

  assert.ok(revalidateCalls.includes("/dashboard/payments"));
  assert.ok(revalidateCalls.includes("/dashboard/finance"));
});

test("delivery, drivers and tracking preserve tenant isolation and simulated logistics flows", { timeout: 120000 }, async () => {
  resetRuntime();

  const { ROLES } = loadSource("permissions/roles");
  const revalidateCalls = [];
  let currentUser = {
    id: "owner-a",
    restaurantId: "restaurant-a",
    name: "Owner A",
    email: "owner-a@example.com",
    password: "hash",
    image: null,
    role: ROLES.OWNER,
    active: true,
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    updatedAt: new Date("2026-01-01T00:00:00.000Z"),
  };

  mockModule("next/cache", {
    revalidatePath: (pathname) => {
      revalidateCalls.push(pathname);
    },
  });
  mockModule("@/lib/session", {
    requireRole: async (roles) => {
      if (!roles.includes(currentUser.role)) {
        throw new Error("FORBIDDEN");
      }
      return currentUser;
    },
  });

  const deliveryActions = loadSource("actions/delivery");
  const driversActions = loadSource("actions/drivers");
  const trackingActions = loadSource("actions/tracking");
  const deliveryService = loadSource("services/delivery");
  const shippingService = loadSource("services/shipping");
  const mapsService = loadSource("services/maps");

  const providers = mapsService.listMapProviders();
  assert.equal(providers.length, 3);
  assert.equal(providers.some((provider) => provider.provider === "GOOGLE_MAPS"), true);

  const routeEstimate = mapsService.estimateRoute("GOOGLE_MAPS", {
    origin: { latitude: -8.8383, longitude: 13.2344 },
    destination: { latitude: -8.8183, longitude: 13.2744 },
    label: "Zona centro",
  });
  assert.ok(routeEstimate.distanceKm > 0);
  assert.ok(routeEstimate.durationMinutes > 0);

  const seededDashboard = deliveryService.getDeliveryDashboardCached(currentUser.restaurantId);
  const feeEstimate = shippingService.calculateDeliveryFee({
    orderTotal: 25000,
    distanceKm: 4.2,
    zone: seededDashboard.zones[0],
    fees: seededDashboard.fees,
  });
  assert.equal(feeEstimate.freeShipping, true);

  const settingsResult = await deliveryActions.saveDeliverySettingsAction({
    defaultDispatchMode: "AUTOMATIC",
    autoAssignDrivers: true,
    allowScheduledDelivery: true,
    defaultEstimatedMinutes: 32,
    mapProvider: "MAPBOX",
    notificationChannels: { push: true, whatsapp: true, sms: false, email: true },
    preparedForRealtimeTracking: true,
    active: true,
  });
  assert.equal(settingsResult.ok, true);

  const zoneResult = await deliveryActions.saveDeliveryZoneAction({
    name: "Zona Express",
    type: "RADIUS",
    description: "Cobertura premium",
    radiusKm: 5,
    centerLatitude: -8.8383,
    centerLongitude: 13.2344,
    priority: 1,
    minOrderAmount: 15000,
    active: true,
  });
  assert.equal(zoneResult.ok, true);

  const feeResult = await deliveryActions.saveDeliveryFeeAction({
    name: "Frete Expresso",
    type: "FIXED",
    zoneId: zoneResult.data.id,
    fixedAmount: 3500,
    perKmAmount: null,
    minimumOrderAmount: 12000,
    freeShippingThreshold: 30000,
    promotionLabel: "Entrega premium",
    active: true,
  });
  assert.equal(feeResult.ok, true);

  const driverResult = await driversActions.saveDriverAction({
    name: "João Entregador",
    phone: "+244 923 000 000",
    email: "joao@example.com",
    vehicleType: "Moto",
    vehiclePlate: "LD-00-AA",
    licenseNumber: "LIC-001",
    status: "AVAILABLE",
    currentZoneId: null,
    currentLatitude: -8.8383,
    currentLongitude: 13.2344,
    rating: 4.9,
    totalDeliveries: 12,
    totalDistanceKm: 48,
    active: true,
  });
  assert.equal(driverResult.ok, true);

  const shiftResult = await driversActions.saveDriverShiftAction({
    driverId: driverResult.data.id,
    startAt: new Date("2026-07-20T08:00:00.000Z"),
    endAt: new Date("2026-07-20T16:00:00.000Z"),
    status: "SCHEDULED",
    notes: "Turno principal",
  });
  assert.equal(shiftResult.ok, true);

  const dispatchResult = await deliveryActions.createDispatchAction({
    orderId: "order-123",
    driverId: driverResult.data.id,
    mode: "AUTOMATIC",
    status: "RECEIVED",
    priority: 1,
    queuePosition: 1,
    notes: "Pedido recebido",
  });
  assert.equal(dispatchResult.ok, true);

  const routeResult = await deliveryActions.createRouteAction({
    orderId: "order-123",
    dispatchId: dispatchResult.data.id,
    driverId: driverResult.data.id,
    provider: "MAPBOX",
    originLatitude: -8.8383,
    originLongitude: 13.2344,
    destinationLatitude: -8.8183,
    destinationLongitude: 13.2744,
    label: "Entrega 123",
    status: "PLANNED",
  });
  assert.equal(routeResult.ok, true);

  const eventResult = await trackingActions.recordTrackingEventAction({
    orderId: "order-123",
    dispatchId: dispatchResult.data.id,
    driverId: driverResult.data.id,
    routeId: routeResult.data.id,
    type: "DRIVER_ASSIGNED",
    title: "Entregador atribuído",
    description: "Entrega em preparação",
    latitude: -8.833,
    longitude: 13.241,
    etaMinutes: 25,
    actualAt: new Date("2026-07-20T10:00:00.000Z"),
    metadata: { simulated: true },
  });
  assert.equal(eventResult.ok, true);

  const statusResult = await deliveryActions.updateDispatchStatusAction({
    id: dispatchResult.data.id,
    orderId: "order-123",
    driverId: driverResult.data.id,
    mode: "AUTOMATIC",
    status: "DELIVERED",
    priority: 1,
    queuePosition: 1,
    notes: "Pedido entregue",
  });
  assert.equal(statusResult.ok, true);
  assert.equal(statusResult.data.status, "DELIVERED");

  const dashboardA = await deliveryActions.getDeliveryDashboardAction({ period: "last_7_days" });
  assert.equal(dashboardA.settings.mapProvider, "MAPBOX");
  assert.ok(dashboardA.kpis.completedDeliveries >= 1);
  assert.ok(dashboardA.routes.length >= 1);
  assert.ok(dashboardA.trackingEvents.length >= 1);

  const driversA = await driversActions.listDriversAction();
  assert.equal(driversA.some((driver) => driver.id === driverResult.data.id), true);

  const shiftsA = await driversActions.listDriverShiftsAction();
  assert.equal(shiftsA.some((shift) => shift.id === shiftResult.data.id), true);

  const zonesA = await deliveryActions.listDeliveryZonesAction();
  const feesA = await deliveryActions.listDeliveryFeesAction();
  const dispatchesA = await deliveryActions.listDispatchesAction();
  const routesA = await deliveryActions.listRoutesAction();
  const trackingA = await trackingActions.listTrackingEventsAction();
  assert.ok(zonesA.length >= 1);
  assert.ok(feesA.length >= 1);
  assert.ok(dispatchesA.length >= 1);
  assert.ok(routesA.length >= 1);
  assert.ok(trackingA.length >= 1);

  currentUser = {
    ...currentUser,
    role: ROLES.DRIVER,
  };
  const driverStatusResult = await driversActions.setDriverStatusAction(driverResult.data.id, "OFFLINE");
  assert.equal(driverStatusResult.ok, true);
  assert.equal(driverStatusResult.data.status, "OFFLINE");

  currentUser = {
    ...currentUser,
    id: "owner-b",
    restaurantId: "restaurant-b",
    name: "Owner B",
    email: "owner-b@example.com",
    role: ROLES.OWNER,
  };

  const dashboardB = await deliveryActions.getDeliveryDashboardAction({ period: "last_7_days" });
  assert.equal(dashboardB.drivers.some((driver) => driver.id === driverResult.data.id), false);

  assert.ok(revalidateCalls.includes("/dashboard/delivery"));
  assert.ok(revalidateCalls.includes("/dashboard/drivers"));
  assert.ok(revalidateCalls.includes("/dashboard/tracking"));
});

test("admin, subscriptions and plans keep SaaS isolation, permissions and billing flows", { timeout: 120000 }, async () => {
  resetRuntime();

  const { ROLES } = loadSource("permissions/roles");
  const revalidateCalls = [];
  let currentUser = {
    id: "super-admin",
    restaurantId: "restaurant-a",
    name: "Super Admin",
    email: "superadmin@restaurantpro.local",
    password: "hash",
    image: null,
    role: ROLES.SUPER_ADMIN,
    active: true,
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    updatedAt: new Date("2026-01-01T00:00:00.000Z"),
  };

  mockModule("next/cache", {
    revalidatePath: (pathname) => {
      revalidateCalls.push(pathname);
    },
  });
  mockModule("@/lib/session", {
    requireRole: async (roles) => {
      if (!roles.includes(currentUser.role)) {
        throw new Error("FORBIDDEN");
      }
      return currentUser;
    },
  });

  const adminActions = loadSource("actions/admin");
  const subscriptionActions = loadSource("actions/subscriptions");
  const licenseActions = loadSource("actions/licenses");

  const dashboard = await adminActions.getAdminDashboardAction();
  assert.ok(dashboard.organizations.length >= 2);
  assert.ok(dashboard.subscriptions.length >= 2);
  assert.ok(dashboard.plans.length >= 5);

  const [organizationA, organizationB] = dashboard.organizations;
  assert.ok(organizationA);
  assert.ok(organizationB);

  const summaryA = await adminActions.getOrganizationSummaryAction(organizationA.id);
  const summaryB = await adminActions.getOrganizationSummaryAction(organizationB.id);
  assert.equal(summaryA.organization?.id, organizationA.id);
  assert.equal(summaryB.organization?.id, organizationB.id);
  assert.equal(summaryA.subscription?.organizationId, organizationA.id);
  assert.equal(summaryB.subscription?.organizationId, organizationB.id);

  currentUser = {
    ...currentUser,
    role: ROLES.OWNER,
  };
  await assert.rejects(() => adminActions.getAdminDashboardAction(), /FORBIDDEN/);

  currentUser = {
    ...currentUser,
    role: ROLES.SUPER_ADMIN,
  };

  const plan = dashboard.plans.find((item) => item.code === "pro") ?? dashboard.plans[0];
  const savePlan = await subscriptionActions.savePlanAction({
    id: plan.id,
    code: plan.code,
    name: plan.name,
    description: plan.description ?? "",
    billingInterval: plan.billingInterval,
    monthlyPrice: plan.monthlyPrice,
    yearlyPrice: plan.yearlyPrice,
    trialDays: plan.trialDays,
    features: plan.features,
    limits: plan.limits,
    active: true,
  });
  assert.equal(savePlan.ok, true);

  const saveSubscription = await subscriptionActions.saveSubscriptionAction({
    id: dashboard.subscriptions[0].id,
    organizationId: organizationA.id,
    restaurantId: organizationA.restaurantId,
    planId: plan.id,
    status: "ACTIVE",
    billingInterval: "MONTHLY",
    trialEndsAt: new Date("2026-08-01T00:00:00.000Z"),
    currentPeriodStart: new Date("2026-07-01T00:00:00.000Z"),
    currentPeriodEnd: new Date("2026-08-01T00:00:00.000Z"),
    cancelAtPeriodEnd: false,
    seats: 50,
    metadata: { source: "integration-test" },
  });
  assert.equal(saveSubscription.ok, true);

  const invitation = await adminActions.createInvitationAction({
    organizationId: organizationB.id,
    restaurantId: organizationB.restaurantId,
    email: "billing@example.com",
    role: ROLES.MANAGER,
    invitedByUserId: currentUser.id,
  });
  assert.equal(invitation.ok, true);
  assert.equal(invitation.data.status, "PENDING");

  const acceptedInvitation = await adminActions.acceptInvitationAction(invitation.data.token);
  assert.equal(acceptedInvitation?.status, "ACCEPTED");

  const apiKey = await adminActions.createApiKeyAction({
    organizationId: organizationA.id,
    restaurantId: organizationA.restaurantId,
    name: "Admin Integration Key",
    prefix: "admin",
    scopes: ["read:all", "write:billing"],
    active: true,
  });
  assert.equal(apiKey.ok, true);

  const usage = await adminActions.recordUsageAction({
    organizationId: organizationA.id,
    restaurantId: organizationA.restaurantId,
    metric: "orders",
    period: "monthly",
    used: 1250,
    limit: 2500,
    resetAt: new Date("2026-08-01T00:00:00.000Z"),
    metadata: { source: "integration-test" },
  });
  assert.equal(usage.ok, true);

  const limit = await adminActions.upsertUsageLimitAction({
    planId: plan.id,
    metric: "orders",
    limit: 5000,
    hardLimit: true,
    warningThreshold: 4200,
    active: true,
  });
  assert.equal(limit.ok, true);

  const billing = await adminActions.createBillingHistoryAction({
    organizationId: organizationA.id,
    restaurantId: organizationA.restaurantId,
    subscriptionId: dashboard.subscriptions[0].id,
    invoiceNumber: "INV-TEST-2026-0001",
    status: "PAID",
    amount: 65000,
    currency: "AOA",
    description: "Integration billing",
    periodStart: new Date("2026-06-01T00:00:00.000Z"),
    periodEnd: new Date("2026-07-01T00:00:00.000Z"),
    metadata: { source: "integration-test" },
  });
  assert.equal(billing.ok, true);

  const audit = await adminActions.recordAuditLogAction("SAAS_TEST_EVENT", "subscription", saveSubscription.data.id);
  assert.equal(audit.action, "SAAS_TEST_EVENT");

  const licenseList = await licenseActions.listLicensesAction();
  assert.ok(licenseList.length >= 2);

  const switched = await adminActions.switchRestaurantAction({ organizationId: organizationB.id });
  assert.equal(switched.ok, true);
  assert.equal(switched.data.currentRestaurantId, organizationB.restaurantId);

  const refreshedDashboard = await adminActions.getAdminDashboardAction(organizationB.id);
  assert.equal(refreshedDashboard.selectedOrganizationId, organizationB.id);
  assert.equal(refreshedDashboard.subscriptions.some((item) => item.organizationId === organizationA.id), true);
  assert.equal(refreshedDashboard.licenses.some((item) => item.organizationId === organizationB.id), true);

  assert.ok(revalidateCalls.includes("/dashboard/admin"));
  assert.ok(revalidateCalls.includes("/dashboard/subscriptions"));
  assert.ok(revalidateCalls.includes("/dashboard/plans"));
});

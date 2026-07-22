const fs = require("node:fs");
const path = require("node:path");
const Module = require("node:module");
const ts = require("typescript");

const projectRoot = path.resolve(__dirname, "..");
const srcRoot = path.join(projectRoot, "src");
const originalLoad = Module._load;
const originalResolveFilename = Module._resolveFilename;
const mockRegistry = new Map();
let installed = false;

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
    if (request === "server-only") {
      return {};
    }

    if (mockRegistry.has(request)) {
      return mockRegistry.get(request);
    }

    return originalLoad.call(this, request, parent, isMain);
  };
}

function installHarness() {
  if (installed) return;
  installed = true;
  registerTypeScriptHook();
  registerModuleHooks();
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

installHarness();

module.exports = {
  loadSource,
  mockModule,
  resetRuntime,
  installHarness,
};

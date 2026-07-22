const path = require("node:path");
const Module = require("node:module");

const collectedTests = [];
const originalLoad = Module._load;

Module._load = function load(request, parent, isMain) {
  if (request === "node:test") {
    const test = (name, options, fn) => {
      if (typeof options === "function") {
        fn = options;
      }

      collectedTests.push({
        name,
        fn,
      });
    };

    test.test = test;
    return test;
  }

  return originalLoad.call(this, request, parent, isMain);
};

require(path.join(__dirname, "integration.test.cjs"));

async function run() {
  for (const { name, fn } of collectedTests) {
    try {
      await fn();
      console.log(`✔ ${name}`);
    } catch (error) {
      console.error(`✖ ${name}`);
      console.error(error);
      process.exitCode = 1;
      return;
    }
  }
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

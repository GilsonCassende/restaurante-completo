import path from "node:path";
import jitiFactory from "../node_modules/.pnpm/jiti@1.21.7/node_modules/jiti";

async function main() {
  const projectRoot = process.cwd();
  const jiti = jitiFactory(path.join(projectRoot, "prisma/seed.ts"), {
    alias: {
      "@/": `${path.join(projectRoot, "src")}/`,
    },
  });
  const { ensureDevelopmentSeed } = jiti(path.join(projectRoot, "src/prisma/index.ts"));
  await ensureDevelopmentSeed();
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

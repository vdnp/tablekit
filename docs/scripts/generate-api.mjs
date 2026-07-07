// Generates per-package Markdown API reference into docs/api-reference/<pkg>
// using TypeDoc + typedoc-plugin-markdown (programmatic API — cross-platform,
// no shell/bin resolution). Run via `pnpm docs:api`.
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { Application, TSConfigReader } from "typedoc";

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, "..", "..");

const packages = [
  { name: "core", dir: "packages/core" },
  { name: "react", dir: "packages/react" },
  { name: "react-native", dir: "packages/react-native" },
  { name: "theme", dir: "packages/theme" },
];

let failed = false;

// TypeDoc treats entryPoints as globs and rejects Windows "\" separators.
const toPosix = (p) => p.split("\\").join("/");

for (const pkg of packages) {
  const entry = toPosix(resolve(repoRoot, pkg.dir, "src/index.ts"));
  const tsconfig = resolve(repoRoot, pkg.dir, "tsconfig.json");
  const out = resolve(repoRoot, "docs/api-reference", pkg.name);

  const app = await Application.bootstrapWithPlugins(
    {
      entryPoints: [entry],
      tsconfig,
      plugin: ["typedoc-plugin-markdown"],
      readme: "none",
      githubPages: false,
      hideGenerator: true,
      excludeInternal: true,
      skipErrorChecking: true,
      // No public git remote configured yet — avoid emitting broken source links.
      disableSources: true,
      out,
      // typedoc-plugin-markdown options:
      entryFileName: "README.md",
      hidePageHeader: true,
      hideBreadcrumbs: true,
    },
    [new TSConfigReader()],
  );

  const project = await app.convert();
  if (!project) {
    console.error(`✗ @vdnp/tablekit-${pkg.name}: TypeDoc failed to convert`);
    failed = true;
    continue;
  }
  await app.generateOutputs(project);
  console.log(`✓ @vdnp/tablekit-${pkg.name} → docs/api-reference/${pkg.name}`);
}

if (failed) process.exit(1);

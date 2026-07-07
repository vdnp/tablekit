// Extracts fenced code blocks tagged for checking (```ts check / ```tsx check)
// from every Markdown file in the repo, writes each as a standalone module, and
// type-checks them with the project's TypeScript. Run via `pnpm docs:check-code`.
//
// Convention: only blocks whose info string contains the word "check" are
// compiled. Each such block must be a complete, self-contained module
// (imports + code). Illustrative partial snippets use a plain ```tsx fence and
// are skipped. React Native snippets are intentionally not tagged — `react-native`
// does not resolve from the repo root (see docs/troubleshooting.md).
import { fileURLToPath } from "node:url";
import { dirname, relative, resolve } from "node:path";
import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { spawnSync } from "node:child_process";

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, "..", "..");
const checkDir = resolve(repoRoot, ".codecheck");

const IGNORE_DIRS = new Set([
  "node_modules",
  ".git",
  "dist",
  ".turbo",
  ".next",
  ".codecheck",
  "api-reference", // generated
]);

/** Recursively collect .md files, skipping ignored directories. */
function findMarkdown(dir, out = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (!IGNORE_DIRS.has(entry.name)) findMarkdown(resolve(dir, entry.name), out);
    } else if (entry.name.endsWith(".md")) {
      out.push(resolve(dir, entry.name));
    }
  }
  return out;
}

const FENCE = /^```(\w+)([^\n]*)\n([\s\S]*?)^```/gm;

/** Extract checkable blocks: fence lang ts/tsx AND info string contains "check". */
function extractBlocks(source) {
  const blocks = [];
  let match;
  while ((match = FENCE.exec(source)) !== null) {
    const lang = match[1];
    const info = match[2] ?? "";
    if ((lang === "ts" || lang === "tsx") && /\bcheck\b/.test(info)) {
      const line = source.slice(0, match.index).split("\n").length;
      blocks.push({ lang, code: match[3], line });
    }
  }
  return blocks;
}

const files = findMarkdown(repoRoot).sort();
const manifest = [];
let index = 0;

rmSync(checkDir, { recursive: true, force: true });
mkdirSync(checkDir, { recursive: true });

for (const file of files) {
  const source = readFileSync(file, "utf8");
  for (const block of extractBlocks(source)) {
    const base = `block-${String(index).padStart(3, "0")}`;
    const fileName = `${base}.tsx`;
    writeFileSync(resolve(checkDir, fileName), block.code, "utf8");
    manifest.push({ fileName, source: relative(repoRoot, file), line: block.line });
    index += 1;
  }
}

if (manifest.length === 0) {
  console.log("No checkable code blocks found.");
  process.exit(0);
}

// tsconfig for the extracted blocks: paths point at package sources so nothing
// needs to be built first; react/@types/react resolve from the repo root.
const tsconfig = {
  compilerOptions: {
    target: "ES2020",
    module: "ESNext",
    moduleResolution: "Bundler",
    lib: ["ES2020", "DOM", "DOM.Iterable"],
    jsx: "react-jsx",
    strict: true,
    noUncheckedIndexedAccess: true,
    esModuleInterop: true,
    skipLibCheck: true,
    noEmit: true,
    types: ["react"],
    baseUrl: ".",
    paths: {
      "@tablekit/core": ["../packages/core/src/index.ts"],
      "@tablekit/react": ["../packages/react/src/index.ts"],
      "@tablekit/theme": ["../packages/theme/src/index.ts"],
      "@tablekit/react-native": ["../packages/react-native/src/index.ts"],
    },
  },
  include: ["*.tsx"],
};
writeFileSync(resolve(checkDir, "tsconfig.json"), JSON.stringify(tsconfig, null, 2));

const tscBin = resolve(repoRoot, "node_modules", "typescript", "bin", "tsc");
const result = spawnSync(process.execPath, [tscBin, "-p", resolve(checkDir, "tsconfig.json")], {
  cwd: checkDir,
  encoding: "utf8",
});

const output = `${result.stdout ?? ""}${result.stderr ?? ""}`.trim();

if (result.status === 0) {
  console.log(`✓ ${manifest.length} doc code block(s) type-checked clean.`);
  rmSync(checkDir, { recursive: true, force: true });
  process.exit(0);
}

// Map tsc diagnostics (block-NNN.tsx:line) back to source markdown files.
console.error(`✗ Doc code block type-check failed:\n`);
const remapped = output.replace(/block-(\d+)\.tsx/g, (whole, digits) => {
  const entry = manifest[Number(digits)];
  return entry ? `${entry.source} (block near line ${entry.line})` : whole;
});
console.error(remapped);
console.error(`\nExtracted blocks left in ${relative(repoRoot, checkDir)} for inspection.`);
process.exit(1);

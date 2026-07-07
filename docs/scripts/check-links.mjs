// Validates relative Markdown links (and image paths) across the repo: every
// [text](path) whose target is a local file must resolve to an existing file.
// External (http/https), anchors (#…), and mailto: links are skipped — this
// check is offline and deterministic. Run via `pnpm docs:check-links`.
import { fileURLToPath } from "node:url";
import { dirname, relative, resolve } from "node:path";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, "..", "..");

const IGNORE_DIRS = new Set([
  "node_modules",
  ".git",
  "dist",
  ".turbo",
  ".next",
  ".codecheck",
]);

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

// [text](target) — capture target, excluding images handled by the same shape.
const LINK = /!?\[[^\]]*\]\(([^)]+)\)/g;

function isExternal(target) {
  return (
    /^[a-z][a-z0-9+.-]*:/i.test(target) || // scheme: http, https, mailto, tel…
    target.startsWith("#") || // in-page anchor
    target.startsWith("//") // protocol-relative
  );
}

const files = findMarkdown(repoRoot).sort();
const problems = [];
let checked = 0;

for (const file of files) {
  const source = readFileSync(file, "utf8");
  let match;
  while ((match = LINK.exec(source)) !== null) {
    let target = match[1].trim();
    if (!target || isExternal(target)) continue;
    // Strip a trailing #anchor and any surrounding angle brackets / titles.
    target = target.replace(/^<|>$/g, "").split(/\s+/)[0];
    const withoutAnchor = target.split("#")[0];
    if (!withoutAnchor) continue; // pure anchor after normalization

    const line = source.slice(0, match.index).split("\n").length;
    const resolved = resolve(dirname(file), withoutAnchor);
    checked += 1;
    if (!existsSync(resolved)) {
      problems.push({
        file: relative(repoRoot, file),
        line,
        target,
      });
    }
  }
}

if (problems.length === 0) {
  console.log(`✓ ${checked} relative link(s) resolve.`);
  process.exit(0);
}

console.error(`✗ ${problems.length} broken relative link(s):\n`);
for (const problem of problems) {
  console.error(`  ${problem.file}:${problem.line} → ${problem.target}`);
}
process.exit(1);

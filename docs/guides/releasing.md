# Releasing TableKit

TableKit publishes to npm automatically through
[Changesets](https://github.com/changesets/changesets) +
[`changesets/action`](https://github.com/changesets/action). You never run
`npm publish` by hand.

- [How the pipeline works](#how-the-pipeline-works)
- [One-time setup (maintainers)](#one-time-setup-maintainers)
- [Day-to-day: adding a changeset](#day-to-day-adding-a-changeset)
- [The "Version Packages" PR](#the-version-packages-pr)
- [Beta / pre-release mode](#beta--pre-release-mode)
- [If a publish fails](#if-a-publish-fails)
- [First-release checklist](#first-release-checklist)

## How the pipeline works

Two GitHub workflows, kept separate on purpose:

- **`ci.yml`** — build, lint, typecheck, tests, docs checks on every push/PR.
- **`release.yml`** — runs **only on push to `main`** and drives releases via
  `changesets/action`:

```
push to main ──▶ release.yml ──▶ build + typecheck + test (quality gate)
                                        │
                    ┌───────────────────┴───────────────────┐
             changesets present?                     no changesets left?
                    │                                        │
        open/update "Version Packages" PR           pnpm release → publish to npm
        (bumps versions + CHANGELOGs)               (build + changeset publish)
```

So a normal release is **two merges**:

1. Merge a PR that **contains a changeset** → `release.yml` opens/updates a
   **"Version Packages"** PR.
2. Merge that **"Version Packages"** PR → `release.yml` publishes to npm.

The release workflow re-runs the **full quality gate** (`pnpm build`,
`pnpm typecheck`, `pnpm test` — the last is turbo-run Vitest *and* the
react-native Jest suite) before publishing, so it never trusts a stale green
CI. A failing test blocks the release.

## One-time setup (maintainers)

These are manual, done once. The pipeline can't do them for you.

### 1. Create an npm token for CI

Log in to [npmjs.com](https://www.npmjs.com/) with an account that has **publish**
rights on the `@vdnp` scope, then **Access Tokens → Generate New Token**. Either
token type bypasses the interactive 2FA/OTP prompt that would otherwise hang CI.

**Granular Access Token (recommended):**

| Field | Value |
| --- | --- |
| Name | e.g. `tablekit-ci-release` |
| Expiration | required — pick a date (max 365 days); set a rotation reminder, and update the `NPM_TOKEN` secret when it lapses |
| Allowed IP ranges | leave **empty** (GitHub runners use dynamic IPs) |
| Packages and scopes → Permissions | **Read and write** |
| Packages and scopes → selection | the **`@vdnp`** scope (covers new packages too). If the scope isn't selectable before the first publish, use **All packages** temporarily, then rotate to a scope-scoped token |
| Organizations → Permissions | **No access** (publishing needs package write, not org admin) |

**Classic Token (alternative):** choose **Automation** (not "Publish", which
prompts for an OTP).

Copy the token (starts with `npm_…`) — you won't see it again.

### 2. Add it to GitHub Secrets

- Repo → **Settings → Secrets and variables → Actions → New repository secret**.
- Name it **exactly** `NPM_TOKEN`. Paste the token as the value.
- The workflow reads it as `${{ secrets.NPM_TOKEN }}` — it is **never** written
  into any file.

### 3. Confirm the `@vdnp` scope exists

- The scope must exist and your account/org must be able to publish to it. If it
  doesn't exist yet, create the org/scope on npm, or rename the packages (see the
  first-release checklist).

### 4. Repository URL (required for provenance)

All four packages point `repository.url` / `homepage` / `bugs` at
**`https://github.com/vdnp/tablekit`**. Provenance validates this URL against the
GitHub repo it publishes from, so if you ever fork or rename the repo, update
these fields in every `packages/*/package.json` to match — a mismatch fails the
publish.

### 5. Provenance (already enabled)

`release.yml` sets `NPM_CONFIG_PROVENANCE: "true"` and grants `id-token: write`,
so each publish emits a signed [npm provenance](https://docs.npmjs.com/generating-provenance-statements)
attestation linking the package to the exact workflow run and commit. Requirements
(all satisfied by the workflow **except** the two manual ones):

- ✅ GitHub-hosted runner + `id-token: write` permission — set in `release.yml`.
- ✅ npm ≥ 9.5 — Node 20 on the runner ships a new enough npm.
- ⚠️ **Public repository** — provenance only works on public repos. If the repo
  is private at first publish, either make it public or remove
  `NPM_CONFIG_PROVENANCE` from `release.yml` for that release.
- ⚠️ **Matching `repository.url`** — see step 4.

## Day-to-day: adding a changeset

Any user-facing change needs a changeset (this is what feeds versions +
CHANGELOG):

```bash
pnpm changeset
```

1. **Select affected packages.** Because the `@vdnp/tablekit-*` packages are versioned
   in **lockstep** (see [CLAUDE.md → Release strategy](../../CLAUDE.md#release-strategy)),
   they all move to the same version anyway — but still select the ones your
   change actually affects so the CHANGELOG entries are accurate.
2. **Pick a bump level** per the change:

   | Bump | When | Example |
   | --- | --- | --- |
   | `patch` | Backward-compatible bug fix, no API change | Fix a sort comparator edge case |
   | `minor` | New backward-compatible feature / new optional prop | Add a `renderExpandedRow` prop |
   | `major` | Breaking API change | Rename/remove a prop, change a return shape |

   Pre-1.0 caveat: while the packages are `0.x`, a **breaking** change may ship as
   a `minor` (0.x semantics), but you must call it out clearly in the changeset
   summary. Post-1.0, breaking = `major`, always.
3. **Write a user-facing summary** — it becomes the CHANGELOG entry. Describe the
   change and any migration, not the implementation.
4. Commit the generated `.changeset/*.md` with your PR.

Check what a release would produce at any time:

```bash
pnpm release:status   # = changeset status --verbose
```

## The "Version Packages" PR

When a PR carrying changesets lands on `main`, `release.yml` opens (or updates) a
bot PR titled **"chore: version packages"**. It:

- consumes every `.changeset/*.md`,
- bumps all `@vdnp/tablekit-*` versions in lockstep,
- writes/updates each package's `CHANGELOG.md`,
- updates internal dependency ranges.

**Who merges it:** a maintainer, once the accumulated changes are ready to ship.
There's no rush — the PR keeps updating itself as more changesets land. Review the
version bump and CHANGELOGs, then merge. **Merging it triggers the publish.**

## Beta / pre-release mode

For a pre-release line (e.g. `0.1.0-beta.0`), enter **pre mode** before the
Version PR is created:

```bash
pnpm changeset pre enter beta   # writes .changeset/pre.json
git add .changeset/pre.json && git commit -m "chore: enter beta pre-release"
```

While in pre mode, the Version PR produces `-beta.N` versions and publishing tags
them on npm as `beta` (install with `npm i @vdnp/tablekit-react@beta`). Each release
increments the `.N`.

Leave pre mode when you're ready for the stable line:

```bash
pnpm changeset pre exit
git add .changeset/pre.json && git commit -m "chore: exit beta pre-release"
```

The next Version PR then produces the stable version (e.g. `0.1.0`).

> The `release.yml` workflow needs no changes for pre mode — `changesets/action`
> detects `.changeset/pre.json` automatically.

## If a publish fails

`changeset publish` publishes each package independently and **skips versions
already on npm**, so it's safe to re-run.

- **Transient failure (npm 5xx, network, runner died):** re-run the failed
  `release.yml` job from the GitHub Actions UI. Already-published packages are
  skipped; the rest go out.
- **Partial publish (some packages up, some not):** just re-run — publish is
  idempotent per version. Do **not** bump versions again; the tarballs for the
  un-published packages still need to go out at the *same* version.
- **Bad token / 403:** rotate the npm automation token, update the `NPM_TOKEN`
  secret, re-run.
- **Last-resort manual publish** (only if Actions is down), from a clean `main`
  at the versioned commit:

  ```bash
  pnpm install --frozen-lockfile
  pnpm build
  # authenticate locally first: npm whoami  (or set NODE_AUTH_TOKEN)
  pnpm changeset publish
  ```

  Then push the git tags Changesets created: `git push --follow-tags`.

## First-release checklist

The first publish has never happened — do this once, deliberately:

- [ ] **Scope confirmed** — `@vdnp` exists on npm and you can publish to it
      (or packages renamed everywhere: `package.json` names, imports, docs).
- [x] **`repository.url` / `homepage` / `bugs`** set to `github.com/vdnp/tablekit`
      in all four `packages/*/package.json`.
- [ ] **`NPM_TOKEN`** automation secret added (see one-time setup).
- [ ] **Provenance decision** — repo is public (keep provenance) or private
      (remove `NPM_CONFIG_PROVENANCE` for now).
- [ ] **LICENSE** present and correct (MIT, current year/owner).
- [ ] **Version target** — packages sit at `0.0.0`; the existing
      `initial-release` changeset (minor) makes the first release **`0.1.0`**.
      For a beta first line, `pnpm changeset pre enter beta` first → `0.1.0-beta.0`.
      Confirm with `pnpm release:status`.
- [ ] **Dry-run reviewed** — `pnpm release:status` shows all four at the intended
      version.
- [ ] **README npm badges** — after the first successful publish, uncomment the
      badge block at the top of the root `README.md` (they 404 until the packages
      exist on npm).
- [ ] Merge a changeset PR → review the auto-opened **Version Packages** PR →
      merge it → watch `release.yml` publish.

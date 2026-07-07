# TableKit — Expo example

Source-only example (deliberately **outside** the pnpm workspace so root
installs stay light; see `pnpm-workspace.yaml`).

To run it:

```bash
# 1. Build the packages from the repo root first
pnpm build

# 2. Install and start this app
cd examples/expo-app
pnpm install
pnpm start
```

Demonstrates: sorting, global search, selection + bulk actions, pagination,
dark mode via `colorScheme`, and FlashList injection through the
`ListComponent` prop for virtualized rendering of 250 rows.

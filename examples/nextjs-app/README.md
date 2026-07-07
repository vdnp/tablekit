# TableKit — Next.js App Router example

Doubles as the end-to-end SSR integration test: the page is a Server
Component that statically prerenders, and both tables hydrate on the client.

```bash
pnpm install        # from the repo root
pnpm build          # builds packages, then this app (turbo dependsOn)
pnpm -F nextjs-app dev
```

Demos:

- **Client-side mode** — static data; sorting (shift-click for multi-sort),
  global search, selection + bulk actions, edit/delete, grouping toggle,
  pagination, pinned + resizable columns, dark mode via tokens.
- **Server-side mode** — async `fetchData` with simulated latency, plus a
  failure toggle to exercise the skeleton → error → retry flow.

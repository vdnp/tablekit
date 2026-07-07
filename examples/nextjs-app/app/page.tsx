import { ClientTableDemo } from "./client-table-demo";
import { ServerTableDemo } from "./server-table-demo";

// This page itself is a Server Component: it renders during SSR and the
// tables hydrate on the client — proving the 'use client' boundaries hold.
export default function HomePage() {
  return (
    <main>
      <header>
        <h1>TableKit demos</h1>
        <p>
          One headless core (<code>@vdnp/tablekit-core</code>), rendered by{" "}
          <code>@vdnp/tablekit-react</code> inside the Next.js App Router.
        </p>
      </header>

      <section>
        <h2>Client-side mode</h2>
        <p className="hint">
          Static array data — sorting, global search, selection with bulk actions,
          edit/delete, pagination, dark mode. Shift-click headers for multi-sort.
        </p>
        <ClientTableDemo />
      </section>

      <section>
        <h2>Server-side mode</h2>
        <p className="hint">
          The same API driven by an async <code>fetchData</code> with simulated latency
          and a failure toggle — skeleton, error state and retry included.
        </p>
        <ServerTableDemo />
      </section>
    </main>
  );
}

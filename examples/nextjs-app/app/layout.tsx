import type { Metadata } from "next";
import type { ReactNode } from "react";
import "@tablekit/react/styles.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "TableKit — Next.js App Router example",
  description: "Client-side and server-side DataTable demos rendered with @tablekit/react.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "MJD Shopping Manager - Next-Gen Terminal & Web Shopping Assistant",
  description: "Comprehensive shopping management application with instant budget tracking, itemized sales taxes (Pueblo, Colorado), 5 styled receipt layouts, multi-list catalog, and live Python terminal integration.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="bg-slate-950 text-slate-100 antialiased min-h-screen selection:bg-cyan-500 selection:text-slate-950">
        {children}
      </body>
    </html>
  );
}

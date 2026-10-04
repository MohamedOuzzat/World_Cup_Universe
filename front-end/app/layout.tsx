import type { Metadata } from "next";
import { Unbounded, Figtree, Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { Nav } from "@/components/nav";

const display = Unbounded({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});
const figtree = Figtree({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-ui",
  display: "swap",
});

export const metadata: Metadata = {
  title: "World Cup 2026 Hub",
  description: "Live teams, matches, groups, predictions and model insights for FIFA World Cup 2026.",
  metadataBase: new URL("http://localhost:3000"),
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${display.variable} ${figtree.variable} ${inter.variable} antialiased bg-surface text-foreground`}>
        <ThemeProvider>
          <Nav />
          <main className="mx-auto flex w-full max-w-7xl flex-col gap-10 px-4 pb-16 pt-10 sm:px-6 lg:px-8">
            {children}
          </main>
          <footer className="border-t border-white/10 bg-surface/80">
            <div className="mx-auto flex w-full max-w-7xl flex-col gap-3 px-4 py-8 text-sm text-muted sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
              <p>World Cup 2026 Hub · API-resilient · Venue-neutral 1X2</p>
              <p className="text-xs">Java 8080 · Python AI 8000</p>
            </div>
          </footer>
        </ThemeProvider>
      </body>
    </html>
  );
}
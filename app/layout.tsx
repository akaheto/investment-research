import type { Metadata } from "next";
import "./globals.css";
import { Sidebar } from "@/components/sidebar";
import { ThemeProvider } from "@/components/theme-provider";

export const metadata: Metadata = {
  title: "Investment Research",
  description: "Personal investment research dashboard — data, scores, and context in one place.",
};

/**
 * App shell (VISUAL_STYLE_GUIDE §4/§5): fixed 220px left rail + content
 * column (max 1440px, 24px gutters) + persistent not-advice footer.
 * System sans only — no font imports, per the guide.
 */
export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased" suppressHydrationWarning>
      <body className="min-h-full">
        <ThemeProvider>
          <div className="flex min-h-screen">
            <Sidebar />
            <div className="flex min-w-0 flex-1 flex-col">
              <main className="mx-auto w-full max-w-[1440px] flex-1 px-6 py-6">{children}</main>
              <footer className="border-t border-hairline px-6 py-3 text-xs text-muted">
                Research aid, not investment advice. Data may be delayed; free-tier sources.
              </footer>
            </div>
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}

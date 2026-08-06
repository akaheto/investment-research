import type { Metadata } from "next";
import "./globals.css";
import { Sidebar } from "@/components/sidebar";
import { MobileNavBar } from "@/components/mobile-nav-bar";
import { ThemeProvider } from "@/components/theme-provider";

export const metadata: Metadata = {
  title: "Investment Research",
  description: "Personal investment research dashboard — data, scores, and context in one place.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased" suppressHydrationWarning>
      <body className="min-h-full">
        <ThemeProvider>
          <div className="flex min-h-screen">
            <Sidebar />
            <div className="flex min-w-0 flex-1 flex-col">
              <MobileNavBar />
              <main className="mx-auto w-full max-w-[1440px] flex-1 px-4 py-4 lg:px-6 lg:py-6">{children}</main>
              <footer className="border-t border-hairline px-4 py-3 text-xs text-muted lg:px-6">
                Research aid, not investment advice. Data may be delayed; free-tier sources.
              </footer>
            </div>
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}

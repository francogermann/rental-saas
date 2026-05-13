import type { Metadata } from "next";
import { Playfair_Display, Manrope } from "next/font/google";
import { cn } from "@/lib/utils";
import "./globals.css";

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Maison — Alquiler de Vestidos Exclusivos",
  description: "Descubrí prendas de diseñador para tus eventos más importantes. Reservá online y viví la experiencia premium.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={cn(playfair.variable, manrope.variable)}>
      <body>
        {/* Navbar */}
        <nav className="fixed top-0 inset-x-0 z-50 backdrop-blur-2xl bg-background/30 border-b border-white/10">
          <div className="container mx-auto max-w-7xl px-6 h-16 flex items-center justify-between">
            <a href="/catalog" className="font-display text-xl font-bold tracking-wide uppercase bg-gradient-to-r from-fuchsia-400 to-purple-400 bg-clip-text text-transparent">
              Maison
            </a>
            <div className="flex items-center gap-6">
              <a href="/catalog" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                Colección
              </a>
            </div>
          </div>
        </nav>

        {/* Page content */}
        <main className="pt-16">
          {children}
        </main>
      </body>
    </html>
  );
}

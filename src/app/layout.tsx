import type { Metadata } from "next";
import { Playfair_Display, Manrope } from "next/font/google";
import { cn } from "@/lib/utils";
import { CartProvider } from "@/components/cart/CartContext";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { CartNavButton } from "@/components/cart/CartNavButton";
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
  title: "Carpe Diem — Alquiler de Vestidos",
  description: "Tu mejor versión empieza acá. Alquilá vestidos de fiesta, graduación y gala en Montevideo y Colonia. Sin agenda previa.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={cn(playfair.variable, manrope.variable)}>
      <body>
        <CartProvider>
          {/* Navbar */}
          <nav className="fixed top-0 inset-x-0 z-50 backdrop-blur-2xl bg-background/30 border-b border-white/10">
            <div className="container mx-auto max-w-7xl px-6 h-16 flex items-center justify-between">
              <a href="/" className="font-display text-xl font-bold tracking-wide italic">
                CarpeDiem.
              </a>
              <div className="flex items-center gap-6">
                <a href="/catalog" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                  Colección
                </a>
                <a href="https://www.instagram.com/carpediemalquilerdevestidos/" target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-muted-foreground hover:text-fuchsia-400 transition-colors">
                  Instagram
                </a>
                <CartNavButton />
              </div>
            </div>
          </nav>

          {/* Page content */}
          <main className="pt-16">
            {children}
          </main>
          <CartDrawer />
        </CartProvider>
      </body>
    </html>
  );
}

import type { Metadata } from "next";
import { Suspense } from "react";
import { Playfair_Display, Manrope } from "next/font/google";
import { cn } from "@/lib/utils";
import { CartProvider } from "@/components/cart/CartContext";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { StoreNav } from "@/components/layout/StoreNav";
import { StoreNavAccount } from "@/components/layout/StoreNavAccount";
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
          <StoreNav
            accountLink={
              <Suspense fallback={null}>
                <StoreNavAccount />
              </Suspense>
            }
          />

          <main className="pt-16">
            {children}
          </main>
          <CartDrawer />
        </CartProvider>
      </body>
    </html>
  );
}

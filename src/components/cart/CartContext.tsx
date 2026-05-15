'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { z } from 'zod';
import type { GarmentSummary } from '@/types/domain';

export type CartItem = {
  garment: GarmentSummary;
  pickupDate: string;
  returnDate: string;
  /** Sede de retiro elegida en el catálogo; debe coincidir con garment.location_id en checkout. */
  pickupLocationId: string;
};

function normalizeCartItems(raw: unknown): CartItem[] {
  if (!Array.isArray(raw)) return [];
  const uuid = z.string().uuid();
  return raw
    .filter((i) => i && typeof i === 'object' && 'garment' in i)
    .map((i) => {
      const row = i as Record<string, unknown>;
      const garment = row.garment as GarmentSummary;
      const pickupDate = String(row.pickupDate ?? '');
      const returnDate = String(row.returnDate ?? '');
      let pickupLocationId = typeof row.pickupLocationId === 'string' ? row.pickupLocationId : '';
      if (!uuid.safeParse(pickupLocationId).success && typeof garment?.location_id === 'string') {
        pickupLocationId = garment.location_id;
      }
      return { garment, pickupDate, returnDate, pickupLocationId };
    })
    .filter((i) => uuid.safeParse(i.pickupLocationId).success && i.pickupDate && i.returnDate);
}

interface CartContextType {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (garmentId: string) => void;
  clearCart: () => void;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
  totalSubtotal: number;
  totalDeposit: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  // Load from local storage on mount
  useEffect(() => {
    setIsMounted(true);
    const saved = localStorage.getItem('carpediem_cart');
    if (saved) {
      try {
        setItems(normalizeCartItems(JSON.parse(saved)));
      } catch (e) {
        console.error('Failed to parse cart', e);
      }
    }
  }, []);

  // Save to local storage on change
  useEffect(() => {
    if (isMounted) {
      localStorage.setItem('carpediem_cart', JSON.stringify(items));
    }
  }, [items, isMounted]);

  const addItem = (newItem: CartItem) => {
    setItems((prev) => {
      // If already in cart, don't duplicate, just open cart
      if (prev.some((i) => i.garment.id === newItem.garment.id)) {
        return prev;
      }
      return [...prev, newItem];
    });
    setIsCartOpen(true);
  };

  const removeItem = (garmentId: string) => {
    setItems((prev) => prev.filter((i) => i.garment.id !== garmentId));
  };

  const clearCart = () => {
    setItems([]);
  };

  const totalSubtotal = items.reduce((acc, item) => acc + (item.garment.rental_price || 0), 0);
  // Note on deposit: usually the deposit might be sum, or just the max one if they are rented together.
  // Let's sum them for now unless business rules say otherwise. If summing:
  // const totalDeposit = items.reduce((acc, item) => acc + (item.garment.deposit_amount || 0), 0);

  // Let's sum everything to be safe.
  const totalDepositSum = items.reduce((acc, item) => acc + (item.garment.deposit_amount || 0), 0);

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        clearCart,
        isCartOpen,
        setIsCartOpen,
        totalSubtotal,
        totalDeposit: totalDepositSum,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}

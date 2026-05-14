'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { GarmentSummary } from '@/types/domain';

export type CartItem = {
  garment: GarmentSummary;
  pickupDate: string;
  returnDate: string;
};

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
        setItems(JSON.parse(saved));
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
  const totalDeposit = items.reduce((acc, item) => Math.max(acc, item.garment.deposit_amount || 0), 0);
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

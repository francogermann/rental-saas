'use client';

import { useCart } from './CartContext';

export function CartNavButton() {
  const { items, setIsCartOpen } = useCart();
  
  const quantity = items.length;

  return (
    <button 
      onClick={() => setIsCartOpen(true)}
      className="relative flex items-center justify-center p-2 text-muted-foreground hover:text-fuchsia-400 transition-colors"
      aria-label="Ver carrito"
    >
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="8" cy="21" r="1"/>
        <circle cx="19" cy="21" r="1"/>
        <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/>
      </svg>
      
      {quantity > 0 && (
        <span className="absolute top-0 right-0 w-4 h-4 bg-fuchsia-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full border-2 border-background">
          {quantity}
        </span>
      )}
    </button>
  );
}

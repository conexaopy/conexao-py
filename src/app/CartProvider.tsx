"use client";

import { createContext, useContext, useEffect, useState } from "react";
import type { Product } from "./data";

type CartItem = Product & { quantity: number };
type CartContextValue = { items: CartItem[]; addItem: (product: Product) => void; removeItem: (id: string) => void; increase: (id: string) => void; decrease: (id: string) => void; clearCart: () => void; hydrated: boolean; totalItems: number; subtotal: number };

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    try {
      const saved = localStorage.getItem("conexao-py-cart");
      if (saved) setItems(JSON.parse(saved));
    } finally {
      setHydrated(true);
    }
  }, []);
  useEffect(() => {
    if (hydrated) localStorage.setItem("conexao-py-cart", JSON.stringify(items));
  }, [hydrated, items]);
  const addItem = (product: Product) => setItems((current) => { const found = current.find((item) => item.id === product.id); return found ? current.map((item) => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item) : [...current, { ...product, quantity: 1 }]; });
  const removeItem = (id: string) => setItems((current) => current.filter((item) => item.id !== id));
  const increase = (id: string) => setItems((current) => current.map((item) => item.id === id ? { ...item, quantity: item.quantity + 1 } : item));
  const decrease = (id: string) => setItems((current) => current.flatMap((item) => item.id !== id ? item : item.quantity > 1 ? { ...item, quantity: item.quantity - 1 } : []));
  const clearCart = () => setItems([]);
  return <CartContext.Provider value={{ items, addItem, removeItem, increase, decrease, clearCart, hydrated, totalItems: items.reduce((sum, item) => sum + item.quantity, 0), subtotal: items.reduce((sum, item) => sum + item.price * item.quantity, 0) }}>{children}</CartContext.Provider>;
}

export function useCart() { const context = useContext(CartContext); if (!context) throw new Error("useCart must be used inside CartProvider"); return context; }

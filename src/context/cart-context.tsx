
'use client';

import type { Product } from '@/lib/types';
import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';

// Type for the lightweight cart item stored in localStorage
export type StoredCartItem = {
  productId: string;
  quantity: number;
  price: number;
};

interface CartContextType {
  storedCart: StoredCartItem[];
  addToCart: (product: Product, quantity?: number) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  updatePrice: (productId: string, price: number) => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
  totalItemsInCart: number;
  isCartLoaded: boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [storedCart, setStoredCart] = useState<StoredCartItem[]>([]);
  const [isCartLoaded, setIsCartLoaded] = useState(false);

  useEffect(() => {
    try {
      const savedCartJson = localStorage.getItem('posCart');
      if (savedCartJson) {
        const items: StoredCartItem[] = JSON.parse(savedCartJson);
        setStoredCart(items);
      }
    } catch (error) {
      console.error("Failed to load cart from localStorage:", error);
      localStorage.removeItem('posCart');
    }
    setIsCartLoaded(true);
  }, []);

  useEffect(() => {
    if (isCartLoaded) {
      try {
        localStorage.setItem('posCart', JSON.stringify(storedCart));
      } catch (error) {
        console.error("Failed to save cart to localStorage:", error);
      }
    }
  }, [storedCart, isCartLoaded]);

  const addToCart = useCallback((product: Product, quantity = 1) => {
    setStoredCart((prevCart) => {
      const itemInCart = prevCart.find((item) => item.productId === product.id);
      if (itemInCart) {
        return prevCart.map((item) =>
          item.productId === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      return [...prevCart, { productId: product.id!, quantity, price: product.price }];
    });
  }, []);

  const updateQuantity = useCallback((productId: string, quantity: number) => {
    setStoredCart((prevCart) => {
      if (quantity < 1) {
        return prevCart.filter((item) => item.productId !== productId);
      }
      return prevCart.map((item) =>
        item.productId === productId ? { ...item, quantity } : item
      );
    });
  }, []);
  
  const updatePrice = useCallback((productId: string, price: number) => {
    if (isNaN(price) || price < 0) return;
    setStoredCart((prevCart) =>
      prevCart.map((item) =>
        item.productId === productId ? { ...item, price } : item
      )
    );
  }, []);

  const removeFromCart = useCallback((productId: string) => {
    setStoredCart((prevCart) => prevCart.filter((item) => item.productId !== productId));
  }, []);

  const clearCart = useCallback(() => {
    setStoredCart([]);
  }, []);

  const totalItemsInCart = storedCart.reduce((total, item) => total + item.quantity, 0);

  const value = {
    storedCart,
    addToCart,
    updateQuantity,
    updatePrice,
    removeFromCart,
    clearCart,
    totalItemsInCart,
    isCartLoaded,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

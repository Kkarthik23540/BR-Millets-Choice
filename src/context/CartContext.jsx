import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';
import { useToast } from './ToastContext';

const CartContext = createContext({
  cart: null,
  cartCount: 0,
  refreshCart: async () => {},
  addToCart: async () => {},
  updateQuantity: async () => {},
  clearCart: async () => {},
});

export function CartProvider({ children }) {
  const [cart, setCart] = useState(null);
  const { showToast } = useToast();

  const refreshCart = useCallback(async () => {
    try {
      const data = await api('/api/cart');
      setCart(data.cart || { items: [], totalPaise: 0, subtotalPaise: 0 });
      return data.cart;
    } catch {
      return null;
    }
  }, []);

  useEffect(() => {
    refreshCart();
  }, [refreshCart]);

  const addToCart = useCallback(
    async (variantId, quantity = 1, options = {}) => {
      try {
        const data = await api('/api/cart/items', {
          method: 'POST',
          body: JSON.stringify({ variantId, quantity }),
        });
        setCart(data.cart);
        if (!options.silent) {
          showToast(`✓ Added to your basket.`);
        }
        return true;
      } catch (err) {
        showToast(err.message, true);
        return false;
      }
    },
    [showToast]
  );

  const updateQuantity = useCallback(
    async (variantId, quantity) => {
      try {
        const data = await api(`/api/cart/items/${encodeURIComponent(variantId)}`, {
          method: 'PATCH',
          body: JSON.stringify({ quantity }),
        });
        setCart(data.cart);
      } catch (err) {
        showToast(err.message, true);
      }
    },
    [showToast]
  );

  const clearCart = useCallback(async () => {
    try {
      await api('/api/cart', { method: 'DELETE' });
      setCart({ items: [], totalPaise: 0, subtotalPaise: 0 });
    } catch (err) {
      console.warn('Clear cart error:', err);
    }
  }, []);

  const cartCount = cart?.items?.reduce((sum, item) => sum + (item.quantity || 0), 0) || 0;

  return (
    <CartContext.Provider
      value={{
        cart,
        cartCount,
        refreshCart,
        addToCart,
        updateQuantity,
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  return useContext(CartContext);
}

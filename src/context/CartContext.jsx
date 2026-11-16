import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';
import { useToast } from './ToastContext';

const CartContext = createContext({
  cart: null,
  cartCount: 0,
  refreshCart: async () => {},
  addToCart: async () => false,
  updateQuantity: async () => false,
  removeFromCart: async () => false,
  clearCart: async () => false,
});

export function CartProvider({ children }) {
  const [cart, setCart] = useState(null);
  const { showToast } = useToast();

  const refreshCart = useCallback(async () => {
    try {
      const data = await api('/api/cart');
      const items = data.items || data.cart?.items || [];
      const subtotalPaise = data.subtotalPaise || data.cart?.subtotalPaise || 0;
      const totalPaise = data.totalPaise || data.cart?.totalPaise || subtotalPaise;
      const normalizedCart = {
        items,
        subtotalPaise,
        totalPaise,
      };
      setCart(normalizedCart);
      return normalizedCart;
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
        await api('/api/cart/items', {
          method: 'POST',
          body: JSON.stringify({ variantId, quantity: Math.max(1, Math.min(10, quantity)) }),
        });
        await refreshCart();
        if (!options.silent) {
          showToast('✓ Added to your cart.');
        }
        return true;
      } catch (err) {
        showToast(err.message, true);
        return false;
      }
    },
    [refreshCart, showToast]
  );

  const updateQuantity = useCallback(
    async (variantId, quantity) => {
      try {
        if (quantity <= 0) {
          await api(`/api/cart/items/${encodeURIComponent(variantId)}`, {
            method: 'DELETE',
          });
        } else {
          await api(`/api/cart/items/${encodeURIComponent(variantId)}`, {
            method: 'PATCH',
            body: JSON.stringify({ quantity: Math.min(10, quantity) }),
          });
        }
        await refreshCart();
        return true;
      } catch (err) {
        showToast(err.message, true);
        return false;
      }
    },
    [refreshCart, showToast]
  );

  const removeFromCart = useCallback(
    async (variantId) => {
      try {
        await api(`/api/cart/items/${encodeURIComponent(variantId)}`, {
          method: 'DELETE',
        });
        await refreshCart();
        showToast('Item removed from cart.');
        return true;
      } catch (err) {
        showToast(err.message, true);
        return false;
      }
    },
    [refreshCart, showToast]
  );

  const clearCart = useCallback(async () => {
    try {
      await api('/api/cart', { method: 'DELETE' });
      setCart({ items: [], totalPaise: 0, subtotalPaise: 0 });
      return true;
    } catch (err) {
      showToast(err.message, true);
      return false;
    }
  }, [showToast]);

  const cartCount = cart?.items?.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0) || 0;

  return (
    <CartContext.Provider
      value={{
        cart,
        cartCount,
        refreshCart,
        addToCart,
        updateQuantity,
        removeFromCart,
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

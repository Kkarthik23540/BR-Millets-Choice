import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [items, setItems] = useState([]);
  const [subtotalPaise, setSubtotalPaise] = useState('0');
  const [loading, setLoading] = useState(false);

  const refreshCart = useCallback(async () => {
    if (!user) {
      setItems([]);
      setSubtotalPaise('0');
      return;
    }
    try {
      setLoading(true);
      const data = await api('/api/cart');
      setItems(data.items || []);
      setSubtotalPaise(data.subtotalPaise || '0');
    } catch {
      setItems([]);
      setSubtotalPaise('0');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    refreshCart();
  }, [refreshCart]);

  const addToCart = async (variantId, quantity = 1) => {
    if (!user) {
      showToast('Please sign in to add items to your cart.', true, '/login');
      return false;
    }
    try {
      await api('/api/cart/items', {
        method: 'POST',
        body: JSON.stringify({ variantId, quantity }),
      });
      await refreshCart();
      showToast('Item added to cart! 🌾', false, '/cart');
      return true;
    } catch (err) {
      showToast(err.message, true);
      return false;
    }
  };

  const updateQuantity = async (variantId, quantity) => {
    if (quantity < 1) {
      return removeFromCart(variantId);
    }
    try {
      await api(`/api/cart/items/${variantId}`, {
        method: 'PATCH',
        body: JSON.stringify({ quantity }),
      });
      await refreshCart();
    } catch (err) {
      showToast(err.message, true);
    }
  };

  const removeFromCart = async (variantId) => {
    try {
      await api(`/api/cart/items/${variantId}`, {
        method: 'DELETE',
      });
      await refreshCart();
      showToast('Item removed from cart.');
    } catch (err) {
      showToast(err.message, true);
    }
  };

  const cartCount = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        subtotalPaise,
        cartCount,
        loading,
        refreshCart,
        addToCart,
        updateQuantity,
        removeFromCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}

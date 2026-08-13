import React, { createContext, useState, useEffect, useContext } from 'react';
import api from '../lib/api';
import { useAuth } from './AuthContext';
import { toast } from 'react-toastify';

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const { user } = useAuth();
  const [cart, setCart] = useState({ items: [], subtotal: 0 });
  const [loading, setLoading] = useState(true);
  const [isCartOpen, setIsCartOpen] = useState(false);

  const fetchCart = async () => {
    if (!user) {
      setCart({ items: [], subtotal: 0 });
      setLoading(false);
      return;
    }
    try {
      const res = await api.get('/api/me/cart');
      setCart(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCart();
  }, [user]);

  const addToCart = async (productId, quantity = 1) => {
    if (!user) {
      toast.error('Please login to add to cart');
      return;
    }
    try {
      const res = await api.post('/api/me/cart', { product_id: productId.toString(), quantity });
      setCart(res.data);
      toast.success('Added to cart');
      setIsCartOpen(true);
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to add item');
    }
  };

  const updateQuantity = async (productId, quantity) => {
    if (quantity <= 0) return removeFromCart(productId);
    try {
      const res = await api.put(`/api/me/cart/${productId}`, { product_id: productId.toString(), quantity });
      setCart(res.data);
    } catch (err) {
      toast.error('Failed to update cart');
    }
  };

  const removeFromCart = async (productId) => {
    try {
      const res = await api.delete(`/api/me/cart/${productId}`);
      setCart(res.data);
      toast.success('Item removed');
    } catch (err) {
      toast.error('Failed to remove item');
    }
  };
  
  const clearCart = async () => {
    try {
      const res = await api.delete(`/api/me/cart`);
      setCart(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const toggleCart = () => setIsCartOpen(!isCartOpen);

  return (
    <CartContext.Provider value={{ cart, loading, addToCart, updateQuantity, removeFromCart, clearCart, isCartOpen, toggleCart, setIsCartOpen, fetchCart }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);

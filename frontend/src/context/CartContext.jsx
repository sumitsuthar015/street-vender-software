import React, { createContext, useContext, useState, useEffect } from 'react';
import { cartService } from '../services/api';
import { useAuth } from './AuthContext';

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const { user } = useAuth();
  const [cart, setCart] = useState(null);
  const [cartTotal, setCartTotal] = useState(0);
  const [itemCount, setItemCount] = useState(0);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [loading, setLoading] = useState(false);

  const fetchCart = async () => {
    if (!user) {
      setCart(null);
      setCartTotal(0);
      setItemCount(0);
      setDiscountAmount(0);
      return;
    }

    try {
      setLoading(true);
      const res = await cartService.getCart();
      if (res.success && res.data) {
        setCart(res.data.cart);
        setCartTotal(res.data.finalAmount);
        setDiscountAmount(res.data.discountAmount);
        
        const count = res.data.cart?.items?.reduce((acc, item) => acc + item.quantity, 0) || 0;
        setItemCount(count);
      }
    } catch (err) {
      console.warn('Failed to load cart:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCart();
  }, [user]);

  const addToCart = async (vendorId, menuItemId, quantity, selectedCustomizations = [], specialInstruction = '', tableNo = '') => {
    try {
      const res = await cartService.addToCart({
        vendorId,
        menuItemId,
        quantity,
        selectedCustomizations,
        specialInstruction,
        tableNo
      });
      if (res.success) {
        await fetchCart();
      }
      return res;
    } catch (err) {
      throw err;
    }
  };

  const updateQuantity = async (itemId, newQuantity) => {
    try {
      const res = await cartService.updateCartItem(itemId, newQuantity);
      if (res.success) {
        await fetchCart();
      }
      return res;
    } catch (err) {
      throw err;
    }
  };

  const applyCoupon = async (code) => {
    try {
      const res = await cartService.applyCoupon(code);
      if (res.success) {
        await fetchCart();
      }
      return res;
    } catch (err) {
      throw err;
    }
  };

  const clearCart = async () => {
    try {
      await cartService.clearCart();
      await fetchCart();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <CartContext.Provider
      value={{
        cart,
        cartTotal,
        itemCount,
        discountAmount,
        loading,
        fetchCart,
        addToCart,
        updateQuantity,
        applyCoupon,
        clearCart
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);

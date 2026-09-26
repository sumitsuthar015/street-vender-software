import { useCallback, useEffect, useState } from 'react';
import { storage } from './storage';

/** Cart saved per shop, so refreshing the page doesn't empty it. Shape: { [itemId]: qty } */
export function useCart(slug) {
  const key = `cart:${slug}`;
  const [cart, setCart] = useState(() => storage.get(key, {}));

  useEffect(() => storage.set(key, cart), [key, cart]);

  const setQty = useCallback((itemId, qty) => {
    setCart((prev) => {
      const next = { ...prev };
      if (qty <= 0) delete next[itemId];
      else next[itemId] = Math.min(qty, 50);
      return next;
    });
  }, []);

  // Saved right away: clear() is called just before leaving the page, when the effect above wouldn't run anymore
  const clear = useCallback(() => {
    storage.set(key, {});
    setCart({});
  }, [key]);
  return { cart, setQty, clear };
}

/** Name/phone remembered on this phone so regular customers don't retype them. */
export const customerDetails = {
  get: () => storage.get('customerDetails', { name: '', phone: '' }),
  save: (details) => storage.set('customerDetails', details),
};

/** Orders placed from this phone, so customers can get back to their tracking page. */
export const myOrders = {
  list: () => storage.get('myOrders', []),
  add(order) {
    const list = myOrders.list().filter((o) => o.code !== order.code);
    storage.set('myOrders', [order, ...list].slice(0, 20));
  },
};

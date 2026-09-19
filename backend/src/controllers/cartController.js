const Cart = require('../models/Cart');
const MenuItem = require('../models/MenuItem');
const Coupon = require('../models/Coupon');
const apiResponse = require('../utils/apiResponse');
const asyncWrapper = require('../utils/asyncWrapper');

// Helper to recalculate cart total on backend safely
const calculateCartTotals = async (cart) => {
  let subtotal = 0;
  const processedItems = [];

  for (const item of cart.items) {
    const dbItem = await MenuItem.findById(item.menuItem);
    if (!dbItem || !dbItem.isAvailable || dbItem.stockQuantity < item.quantity) {
      continue; // Skip out of stock items
    }

    const basePrice = dbItem.discountPrice > 0 ? dbItem.discountPrice : dbItem.price;
    let extraPrice = 0;

    if (item.selectedCustomizations && item.selectedCustomizations.length > 0) {
      for (const c of item.selectedCustomizations) {
        extraPrice += c.extraPrice || 0;
      }
    }

    const itemUnitPrice = basePrice + extraPrice;
    const itemTotal = itemUnitPrice * item.quantity;
    subtotal += itemTotal;

    processedItems.push({
      _id: item._id,
      menuItem: dbItem,
      quantity: item.quantity,
      selectedCustomizations: item.selectedCustomizations,
      itemUnitPrice,
      totalPrice: itemTotal,
      specialInstruction: item.specialInstruction
    });
  }

  // Calculate discount if coupon applied
  let discountAmount = 0;
  if (cart.couponCode && subtotal > 0) {
    const coupon = await Coupon.findOne({ code: cart.couponCode.toUpperCase(), isActive: true });
    if (coupon && subtotal >= coupon.minOrderValue) {
      if (coupon.discountType === 'PERCENTAGE') {
        discountAmount = (subtotal * coupon.discountValue) / 100;
        if (coupon.maxDiscountAmount && discountAmount > coupon.maxDiscountAmount) {
          discountAmount = coupon.maxDiscountAmount;
        }
      } else {
        discountAmount = coupon.discountValue;
      }
    } else {
      cart.couponCode = '';
    }
  }

  cart.items = processedItems;
  cart.discountAmount = discountAmount;
  const finalAmount = Math.max(0, subtotal - discountAmount);

  return { cart, subtotal, discountAmount, finalAmount };
};

exports.getCart = asyncWrapper(async (req, res) => {
  let cart = await Cart.findOne({ user: req.user._id }).populate('vendor', 'stallName logo isOpen preparationTimeMin');

  if (!cart) {
    cart = await Cart.create({ user: req.user._id, items: [] });
  }

  const calculated = await calculateCartTotals(cart);
  await cart.save();

  return apiResponse.success(res, 'Cart fetched', {
    cart: calculated.cart,
    subtotal: calculated.subtotal,
    discountAmount: calculated.discountAmount,
    finalAmount: calculated.finalAmount
  });
});

exports.addToCart = asyncWrapper(async (req, res) => {
  const { vendorId, tableNo, menuItemId, quantity, selectedCustomizations, specialInstruction } = req.body;

  if (!vendorId || !menuItemId || !quantity) {
    return apiResponse.error(res, 'Vendor ID, Menu Item ID, and Quantity required.', null, 400);
  }

  const dbItem = await MenuItem.findById(menuItemId);
  if (!dbItem || !dbItem.isAvailable) {
    return apiResponse.error(res, 'Item is currently unavailable.', null, 400);
  }

  let cart = await Cart.findOne({ user: req.user._id });

  if (!cart) {
    cart = new Cart({
      user: req.user._id,
      vendor: vendorId,
      tableNo: tableNo || '',
      items: []
    });
  }

  const menuItemBelongsToVendor = dbItem.vendor.toString() === vendorId;
  if (!menuItemBelongsToVendor) {
    return apiResponse.error(res, 'This menu item does not belong to the selected vendor.', null, 400);
  }

  // Clear cart if ordering from a different vendor or if an older cart has
  // items that no longer match its stored vendor.
  const existingMenuItems = cart.items.length > 0
    ? await MenuItem.find({ _id: { $in: cart.items.map((item) => item.menuItem) } }).select('vendor')
    : [];
  const hasItemsFromAnotherVendor = existingMenuItems.some((item) => item.vendor.toString() !== vendorId);

  if ((cart.vendor && cart.vendor.toString() !== vendorId) || hasItemsFromAnotherVendor) {
    cart.vendor = vendorId;
    cart.tableNo = tableNo || '';
    cart.items = [];
    cart.couponCode = '';
  }

  if (tableNo) cart.tableNo = tableNo;

  const basePrice = dbItem.discountPrice > 0 ? dbItem.discountPrice : dbItem.price;
  const requestedCustomizations = selectedCustomizations || [];
  const requestedInstruction = specialInstruction || '';
  const existingItem = cart.items.find((item) => (
    item.menuItem.toString() === menuItemId
    && item.specialInstruction === requestedInstruction
    && JSON.stringify(item.selectedCustomizations || []) === JSON.stringify(requestedCustomizations)
  ));

  if (existingItem) {
    const nextQuantity = existingItem.quantity + quantity;
    if (dbItem.stockQuantity < nextQuantity) {
      return apiResponse.error(res, `Only ${dbItem.stockQuantity} items remaining in stock.`, null, 400);
    }
    existingItem.quantity = nextQuantity;
  } else {
    if (dbItem.stockQuantity < quantity) {
      return apiResponse.error(res, `Only ${dbItem.stockQuantity} items remaining in stock.`, null, 400);
    }
    cart.items.push({
      menuItem: menuItemId,
      quantity,
      selectedCustomizations: requestedCustomizations,
      itemUnitPrice: basePrice,
      specialInstruction: requestedInstruction
    });
  }

  await cart.save();
  const calculated = await calculateCartTotals(cart);
  await cart.save();

  return apiResponse.success(res, 'Item added to cart', calculated);
});

exports.updateCartItem = asyncWrapper(async (req, res) => {
  const { itemId } = req.params;
  const { quantity } = req.body;

  const cart = await Cart.findOne({ user: req.user._id });
  if (!cart) return apiResponse.error(res, 'Cart not found', null, 404);

  const itemIndex = cart.items.findIndex(i => i._id.toString() === itemId);
  if (itemIndex > -1) {
    if (quantity <= 0) {
      cart.items.splice(itemIndex, 1);
    } else {
      cart.items[itemIndex].quantity = quantity;
    }
  }

  await cart.save();
  const calculated = await calculateCartTotals(cart);
  await cart.save();

  return apiResponse.success(res, 'Cart item updated', calculated);
});

exports.applyCouponToCart = asyncWrapper(async (req, res) => {
  const { couponCode } = req.body;
  const cart = await Cart.findOne({ user: req.user._id });
  if (!cart || cart.items.length === 0) {
    return apiResponse.error(res, 'Cart is empty', null, 400);
  }

  const coupon = await Coupon.findOne({ code: couponCode.toUpperCase(), isActive: true });
  if (!coupon || new Date() > new Date(coupon.validTill)) {
    return apiResponse.error(res, 'Invalid or expired coupon code', null, 400);
  }

  cart.couponCode = coupon.code;
  await cart.save();

  const calculated = await calculateCartTotals(cart);
  if (calculated.discountAmount === 0) {
    cart.couponCode = '';
    await cart.save();
    return apiResponse.error(res, `Minimum order value ₹${coupon.minOrderValue} required for coupon`, null, 400);
  }

  return apiResponse.success(res, `Coupon ${coupon.code} applied! Saved ₹${calculated.discountAmount}`, calculated);
});

exports.clearCart = asyncWrapper(async (req, res) => {
  let cart = await Cart.findOne({ user: req.user._id });
  if (cart) {
    cart.items = [];
    cart.couponCode = '';
    cart.discountAmount = 0;
    await cart.save();
  }
  return apiResponse.success(res, 'Cart cleared');
});

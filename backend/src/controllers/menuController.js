const Category = require('../models/Category');
const MenuItem = require('../models/MenuItem');
const Vendor = require('../models/Vendor');
const apiResponse = require('../utils/apiResponse');
const asyncWrapper = require('../utils/asyncWrapper');
const { notifyVendorLowStock, notifyMenuUpdated } = require('../sockets/socketHandler');

// Retrieve the vendor profile for the logged-in user.
// Returns null if user is not authenticated or has no vendor profile.
// Does NOT auto-create vendors — that must go through the proper registration flow.
const getVendorForRequest = async (req) => {
  if (req.vendor) return req.vendor; // already attached by authMiddleware

  if (!req.user) return null;

  const v = await Vendor.findOne({ owner: req.user._id });
  if (v) {
    req.vendor = v;
    return v;
  }

  return null; // User exists but has no vendor profile — caller must handle
};

// --- Categories ---
exports.getCategories = asyncWrapper(async (req, res) => {
  let vendorId = req.params.vendorId;
  if (!vendorId) {
    const vendor = await getVendorForRequest(req);
    if (vendor) vendorId = vendor._id;
  }

  // No vendor found at all — return empty list
  if (!vendorId) {
    return apiResponse.success(res, 'No categories found', []);
  }

  const categories = await Category.find({ vendor: vendorId }).sort({ displayOrder: 1, name: 1 });
  return apiResponse.success(res, 'Categories fetched', categories);
});

exports.createCategory = asyncWrapper(async (req, res) => {
  const vendor = await getVendorForRequest(req);
  if (!vendor) {
    return apiResponse.error(res, 'Authentication required. Please log in first.', null, 401);
  }

  const { name, icon, displayOrder } = req.body;

  if (!name || !name.trim()) {
    return apiResponse.error(res, 'Category name is required', null, 400);
  }

  // Check for duplicate category name under this vendor
  const existing = await Category.findOne({
    vendor: vendor._id,
    name: { $regex: new RegExp(`^${name.trim()}$`, 'i') }
  });
  if (existing) {
    return apiResponse.error(res, `Category "${name.trim()}" already exists. Please use a different name.`, null, 409);
  }

  const category = await Category.create({
    vendor: vendor._id,
    name: name.trim(),
    icon: icon || 'Utensils',
    displayOrder: displayOrder || 0
  });

  // Emit real-time Socket event
  notifyMenuUpdated(vendor._id);

  return apiResponse.success(res, 'Category created successfully', category, 201);
});

exports.updateCategory = asyncWrapper(async (req, res) => {
  const { id } = req.params;
  const category = await Category.findByIdAndUpdate(id, req.body, { new: true });
  if (category) {
    notifyMenuUpdated(category.vendor);
  }
  return apiResponse.success(res, 'Category updated', category);
});

exports.deleteCategory = asyncWrapper(async (req, res) => {
  const { id } = req.params;
  const category = await Category.findByIdAndDelete(id);
  if (category) {
    await MenuItem.deleteMany({ category: id });
    notifyMenuUpdated(category.vendor);
  }
  return apiResponse.success(res, 'Category and associated items deleted');
});

// --- Menu Items ---
exports.getMenuItems = asyncWrapper(async (req, res) => {
  let vendorId = req.params.vendorId;
  if (!vendorId) {
    const vendor = await getVendorForRequest(req);
    if (vendor) vendorId = vendor._id;
  }

  // No vendor found — return empty list
  if (!vendorId) {
    return apiResponse.success(res, 'No items found', []);
  }

  const menuItems = await MenuItem.find({ vendor: vendorId }).populate('category', 'name');
  return apiResponse.success(res, 'Menu items fetched', menuItems);
});

exports.createMenuItem = asyncWrapper(async (req, res) => {
  const vendor = await getVendorForRequest(req);
  if (!vendor) {
    return apiResponse.error(res, 'Authentication required. Please log in first.', null, 401);
  }

  const { name, category, price, discountPrice, description, image, isVeg, preparationTime, stockQuantity, lowStockThreshold, tags, customizations } = req.body;

  if (!name || price === undefined) {
    return apiResponse.error(res, 'Name and price are required', null, 400);
  }

  let catId = category;
  if (!catId) {
    // Auto-create or pick default category if not selected
    let defaultCat = await Category.findOne({ vendor: vendor._id });
    if (!defaultCat) {
      defaultCat = await Category.create({ vendor: vendor._id, name: 'General Menu' });
    }
    catId = defaultCat._id;
  }

  const existingItem = await MenuItem.findOne({
    vendor: vendor._id,
    category: catId,
    name: { $regex: new RegExp(`^${name.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') }
  });
  if (existingItem) {
    return apiResponse.error(res, `Menu item "${name.trim()}" already exists in this category.`, null, 409);
  }

  const menuItem = await MenuItem.create({
    vendor: vendor._id,
    category: catId,
    name: name.trim(),
    price: Number(price),
    discountPrice: discountPrice ? Number(discountPrice) : 0,
    description: description || '',
    image: image || 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=500&auto=format&fit=crop&q=80',
    isVeg: isVeg !== undefined ? isVeg : true,
    preparationTime: preparationTime ? Number(preparationTime) : 10,
    stockQuantity: stockQuantity !== undefined ? Number(stockQuantity) : 50,
    lowStockThreshold: lowStockThreshold !== undefined ? Number(lowStockThreshold) : 5,
    tags: tags || [],
    customizations: customizations || []
  });

  notifyMenuUpdated(vendor._id);

  return apiResponse.success(res, 'Menu item created', menuItem, 201);
});

exports.updateMenuItem = asyncWrapper(async (req, res) => {
  const { id } = req.params;
  const menuItem = await MenuItem.findByIdAndUpdate(id, req.body, { new: true });

  if (menuItem) {
    if (menuItem.stockQuantity <= menuItem.lowStockThreshold) {
      notifyVendorLowStock(menuItem.vendor, menuItem);
    }
    notifyMenuUpdated(menuItem.vendor);
  }

  return apiResponse.success(res, 'Menu item updated', menuItem);
});

exports.deleteMenuItem = asyncWrapper(async (req, res) => {
  const { id } = req.params;
  const menuItem = await MenuItem.findByIdAndDelete(id);
  if (menuItem) {
    notifyMenuUpdated(menuItem.vendor);
  }
  return apiResponse.success(res, 'Menu item deleted');
});

// Update Inventory Stock Quick Toggle
exports.updateInventoryStock = asyncWrapper(async (req, res) => {
  const { id } = req.params;
  const { stockQuantity, isAvailable } = req.body;

  const menuItem = await MenuItem.findById(id);
  if (!menuItem) return apiResponse.error(res, 'Menu item not found', null, 404);

  if (stockQuantity !== undefined) menuItem.stockQuantity = Number(stockQuantity);
  if (isAvailable !== undefined) menuItem.isAvailable = isAvailable;

  if (menuItem.stockQuantity <= 0) {
    menuItem.isAvailable = false;
  }

  await menuItem.save();

  if (menuItem.stockQuantity <= menuItem.lowStockThreshold) {
    notifyVendorLowStock(menuItem.vendor, menuItem);
  }
  notifyMenuUpdated(menuItem.vendor);

  return apiResponse.success(res, 'Stock updated', menuItem);
});

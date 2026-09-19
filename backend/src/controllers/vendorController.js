const Vendor = require('../models/Vendor');
const Table = require('../models/Table');
const MenuItem = require('../models/MenuItem');
const Category = require('../models/Category');
const apiResponse = require('../utils/apiResponse');
const asyncWrapper = require('../utils/asyncWrapper');
const { generateVendorQRCode } = require('../services/qrService');
const { VENDOR_STATUS } = require('../config/constants');

// Public: Get all approved active vendors
exports.getPublicVendors = asyncWrapper(async (req, res) => {
  const { search, cuisine, isOpen } = req.query;

  let filter = { status: VENDOR_STATUS.APPROVED };

  if (search) {
    filter.stallName = { $regex: search, $options: 'i' };
  }
  if (cuisine) {
    filter.cuisineType = { $in: [cuisine] };
  }
  if (isOpen !== undefined) {
    filter.isOpen = isOpen === 'true';
  }

  const vendors = await Vendor.find(filter)
    .populate('owner', 'name mobile')
    .sort({ rating: -1, createdAt: -1 });

  return apiResponse.success(res, 'Vendors retrieved successfully', vendors);
});

// Public: Get single vendor storefront details & menu categories
exports.getVendorByIdOrSlug = asyncWrapper(async (req, res) => {
  const { identifier } = req.params;

  // A vendor's QR is available from the dashboard before admin approval.
  // Allow direct QR lookups for pending vendors, while keeping rejected and
  // suspended vendors hidden from the public storefront.
  let query = { status: VENDOR_STATUS.APPROVED };
  if (identifier.match(/^[0-9a-fA-F]{24}$/)) {
    query._id = identifier;
    query.status = { $in: [VENDOR_STATUS.PENDING, VENDOR_STATUS.APPROVED] };
  } else {
    query.slug = identifier;
  }

  const vendor = await Vendor.findOne(query);

  if (!vendor) {
    return apiResponse.error(res, 'Vendor not found or not approved.', null, 404);
  }

  // Fetch Categories & Menu items
  const categories = await Category.find({ vendor: vendor._id, isActive: true }).sort({ displayOrder: 1 });
  const menuItems = await MenuItem.find({ vendor: vendor._id, isAvailable: true }).populate('category', 'name');

  // Generate Stall QR
  const qr = await generateVendorQRCode(vendor._id);

  return apiResponse.success(res, 'Vendor storefront details', {
    vendor,
    qrCodeDataUrl: qr.dataUrl,
    targetUrl: qr.targetUrl,
    categories,
    menuItems
  });
});

// Vendor: Update Store Details (Hours, Open/Close status, description)
exports.updateVendorProfile = asyncWrapper(async (req, res) => {
  const vendor = req.vendor;
  if (!vendor) {
    return apiResponse.error(res, 'Vendor profile not found.', null, 404);
  }

  const { stallName, description, logo, coverImage, cuisineType, openingHours, isOpen, preparationTimeMin, bankDetails } = req.body;

  if (stallName) vendor.stallName = stallName;
  if (description !== undefined) vendor.description = description;
  if (logo) vendor.logo = logo;
  if (coverImage) vendor.coverImage = coverImage;
  if (cuisineType) vendor.cuisineType = cuisineType;
  if (openingHours) vendor.openingHours = openingHours;
  if (isOpen !== undefined) vendor.isOpen = isOpen;
  if (preparationTimeMin !== undefined) vendor.preparationTimeMin = preparationTimeMin;
  if (bankDetails) vendor.bankDetails = bankDetails;

  await vendor.save();

  return apiResponse.success(res, 'Vendor store profile updated successfully', vendor);
});

// Vendor: Manage Tables
exports.getVendorTables = asyncWrapper(async (req, res) => {
  const vendor = req.vendor;
  if (!vendor) return apiResponse.error(res, 'Vendor profile missing', null, 404);

  const tables = await Table.find({ vendor: vendor._id }).sort({ tableNo: 1 });
  return apiResponse.success(res, 'Tables fetched', tables);
});

exports.createVendorTable = asyncWrapper(async (req, res) => {
  const vendor = req.vendor;
  const { tableNo, capacity } = req.body;

  if (!tableNo) {
    return apiResponse.error(res, 'Table number is required', null, 400);
  }

  const existing = await Table.findOne({ vendor: vendor._id, tableNo });
  if (existing) {
    return apiResponse.error(res, `Table ${tableNo} already exists`, null, 400);
  }

  // Generate Table Specific QR code
  const qr = await generateVendorQRCode(vendor._id, tableNo);

  const table = await Table.create({
    vendor: vendor._id,
    tableNo,
    capacity: capacity || 4,
    qrCodeDataUrl: qr.dataUrl
  });

  return apiResponse.success(res, 'Table created with QR code', table, 201);
});

exports.deleteVendorTable = asyncWrapper(async (req, res) => {
  const { tableId } = req.params;
  await Table.findByIdAndDelete(tableId);
  return apiResponse.success(res, 'Table deleted successfully');
});

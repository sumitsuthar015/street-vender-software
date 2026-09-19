const User = require('../models/User');
const Vendor = require('../models/Vendor');
const Category = require('../models/Category');
const MenuItem = require('../models/MenuItem');
const Table = require('../models/Table');
const Coupon = require('../models/Coupon');
const Order = require('../models/Order');
const { generateVendorQRCode } = require('./qrService');
const { ROLES, VENDOR_STATUS, ORDER_STATUS, PAYMENT_STATUS, ORDER_TYPES } = require('../config/constants');

const repairOrphanedVendorProfiles = async () => {
  const vendorUsers = await User.find({ role: ROLES.VENDOR });

  for (const user of vendorUsers) {
    const existingVendor = await Vendor.findOne({ owner: user._id });
    if (existingVendor) continue;

    const baseSlug = (user.name || 'vendor')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '') || `vendor-${user._id}`;

    let slug = baseSlug;
    let suffix = 1;
    while (await Vendor.exists({ slug })) {
      slug = `${baseSlug}-${suffix}`;
      suffix += 1;
    }

    await Vendor.create({
      owner: user._id,
      registrationEmail: user.email || undefined,
      stallName: `${user.name || 'My'} Street Food Stall`,
      slug,
      description: 'Fresh local street food prepared daily.',
      cuisineType: ['Street Food', 'Snacks'],
      status: VENDOR_STATUS.PENDING
    });

    console.log(`[Database Repair]: Created missing vendor profile for ${user.email || user._id}`);
  }
};

const seedInitialDatabaseData = async () => {
  await repairOrphanedVendorProfiles();

  const userCount = await User.countDocuments();
  if (userCount > 0) {
    console.log('[Database Seed]: Database already populated. Skipping auto-seed.');
    return;
  }

  console.log('[Database Seed]: Populating initial demo data (Vendors, Categories, Menu Items, Tables, Coupons)...');

  // 1. Create Super Admin
  await User.create({
    name: 'Super Admin',
    mobile: '9999999999',
    email: 'admin@streetvendor.com',
    password: 'admin123',
    role: ROLES.ADMIN
  });

  // 2. Create Vendor 1 User & Profile
  const vendor1User = await User.create({
    name: 'Ramesh Sharma',
    mobile: '9876543210',
    email: 'ramesh@delhichaat.com',
    password: 'vendor123',
    role: ROLES.VENDOR
  });

  const vendor1Qr = await generateVendorQRCode('delhi-chaat-corner');

  const vendor1 = await Vendor.create({
    owner: vendor1User._id,
    registrationEmail: vendor1User.email,
    stallName: 'Delhi Chaat & Fast Food Corner',
    slug: 'delhi-chaat-corner',
    description: 'Famous spicy Vada Pav, Crispy Samosas, and Chole Bhature prepared fresh daily!',
    logo: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=300&auto=format&fit=crop&q=80',
    coverImage: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=1000&auto=format&fit=crop&q=80',
    cuisineType: ['North Indian', 'Chaat', 'Street Food', 'Snacks'],
    address: { street: 'Stall No. 14, Connaught Place Food Hub', city: 'New Delhi', pincode: '110001' },
    isOpen: true,
    preparationTimeMin: 10,
    status: VENDOR_STATUS.APPROVED,
    isVerified: true,
    qrCodeUrl: vendor1Qr.dataUrl,
    rating: 4.8,
    totalReviews: 142,
    bankDetails: { accountNumber: '918273645012', ifscCode: 'SBIN0001234', upiId: 'rameshchaat@upi' }
  });

  // Vendor 1 Tables
  const table1Qr = await generateVendorQRCode(vendor1._id.toString(), 'TABLE-01');
  const table2Qr = await generateVendorQRCode(vendor1._id.toString(), 'TABLE-02');

  await Table.create([
    { vendor: vendor1._id, tableNo: 'TABLE-01', capacity: 4, qrCodeDataUrl: table1Qr.dataUrl },
    { vendor: vendor1._id, tableNo: 'TABLE-02', capacity: 2, qrCodeDataUrl: table2Qr.dataUrl }
  ]);

  // Categories
  const catSnacks = await Category.create({ vendor: vendor1._id, name: 'Crispy Snacks', displayOrder: 1 });
  const catChaat = await Category.create({ vendor: vendor1._id, name: 'Special Chaat', displayOrder: 2 });
  const catBeverages = await Category.create({ vendor: vendor1._id, name: 'Cold Drinks & Tea', displayOrder: 3 });

  // Menu Items
  const samosaItem = await MenuItem.create({
    vendor: vendor1._id,
    category: catSnacks._id,
    name: 'Special Special Samosa (2 Pcs)',
    description: 'Hot crispy potato samosas served with sweet tamarind chutney and spicy green chutney.',
    price: 40,
    discountPrice: 35,
    isVeg: true,
    preparationTime: 5,
    stockQuantity: 40,
    lowStockThreshold: 5,
    image: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=500&auto=format&fit=crop&q=80',
    customizations: [
      {
        name: 'Extra Chutney',
        type: 'SINGLE',
        choices: [
          { label: 'Normal Chutney', extraPrice: 0 },
          { label: 'Extra Sweet Tamarind', extraPrice: 10 },
          { label: 'Extra Green Spicy Chutney', extraPrice: 10 }
        ]
      }
    ]
  });

  const vadaPavItem = await MenuItem.create({
    vendor: vendor1._id,
    category: catSnacks._id,
    name: 'Mumbai Style Vada Pav',
    description: 'Spicy potato vada stuffed in fresh pav bun with garlic chutney and fried green chili.',
    price: 50,
    discountPrice: 45,
    isVeg: true,
    preparationTime: 8,
    stockQuantity: 25,
    lowStockThreshold: 5,
    image: 'https://images.unsplash.com/photo-1626132647523-66f5bf380027?w=500&auto=format&fit=crop&q=80',
    customizations: [
      {
        name: 'Spice Level',
        type: 'SINGLE',
        choices: [
          { label: 'Medium Spicy', extraPrice: 0 },
          { label: 'Extra Fiery Spicy', extraPrice: 5 }
        ]
      },
      {
        name: 'Add-ons',
        type: 'MULTIPLE',
        choices: [
          { label: 'Extra Cheese Slice', extraPrice: 20 },
          { label: 'Extra Butter Pav', extraPrice: 15 }
        ]
      }
    ]
  });

  await MenuItem.create({
    vendor: vendor1._id,
    category: catChaat._id,
    name: 'Crispy Gol Gappe (6 Pcs)',
    description: 'Crunchy puris filled with potato mash, sweet tamarind and chilled spicy mint water.',
    price: 60,
    discountPrice: 50,
    isVeg: true,
    preparationTime: 5,
    stockQuantity: 30,
    image: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=500&auto=format&fit=crop&q=80'
  });

  await MenuItem.create({
    vendor: vendor1._id,
    category: catBeverages._id,
    name: 'Kulhad Masala Tea',
    description: 'Aromatic ginger cardamom milk tea served hot in earthen clay kulhad.',
    price: 25,
    discountPrice: 20,
    isVeg: true,
    preparationTime: 5,
    stockQuantity: 50,
    image: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=500&auto=format&fit=crop&q=80'
  });

  // 3. Create Vendor 2 (Royal Momos)
  const vendor2User = await User.create({
    name: 'Sonu Thapa',
    mobile: '9811223344',
    email: 'sonu@royalmomos.com',
    password: 'vendor123',
    role: ROLES.VENDOR
  });

  const vendor2Qr = await generateVendorQRCode('royal-momos-hub');

  const vendor2 = await Vendor.create({
    owner: vendor2User._id,
    registrationEmail: vendor2User.email,
    stallName: 'Royal Kurkure & Steamed Momos',
    slug: 'royal-momos-hub',
    description: 'Hot steamed momos, crunchy kurkure momos & spicy schezwan noodles.',
    logo: 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?w=300&auto=format&fit=crop&q=80',
    coverImage: 'https://images.unsplash.com/photo-1563245372-f21724e3856d?w=1000&auto=format&fit=crop&q=80',
    cuisineType: ['Tibetan', 'Chinese', 'Street Food'],
    address: { street: 'Stall No. 5, Sector 18 Market', city: 'Noida', pincode: '201301' },
    isOpen: true,
    preparationTimeMin: 12,
    status: VENDOR_STATUS.APPROVED,
    isVerified: true,
    qrCodeUrl: vendor2Qr.dataUrl,
    rating: 4.7,
    totalReviews: 89
  });

  const catMomos = await Category.create({ vendor: vendor2._id, name: 'Special Momos', displayOrder: 1 });

  await MenuItem.create({
    vendor: vendor2._id,
    category: catMomos._id,
    name: 'Crispy Kurkure Paneer Momos (8 Pcs)',
    description: 'Crunchy cornflake coated paneer momos served with fiery red chili sauce and mayonnaise.',
    price: 140,
    discountPrice: 120,
    isVeg: true,
    preparationTime: 12,
    stockQuantity: 20,
    image: 'https://images.unsplash.com/photo-1625220194771-7ebdea0b70b9?w=500&auto=format&fit=crop&q=80'
  });

  // Coupons
  await Coupon.create([
    {
      code: 'STREET20',
      discountType: 'PERCENTAGE',
      discountValue: 20,
      minOrderValue: 100,
      maxDiscountAmount: 50,
      validTill: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    },
    {
      code: 'WELCOME50',
      discountType: 'FIXED',
      discountValue: 50,
      minOrderValue: 150,
      validTill: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    }
  ]);

  // Customer User & Orders
  const customerUser = await User.create({
    name: 'Amit Kumar',
    mobile: '9123456789',
    email: 'amit@gmail.com',
    role: ROLES.CUSTOMER
  });

  await Order.create({
    orderNumber: '#SV-1001',
    customer: customerUser._id,
    vendor: vendor1._id,
    orderType: ORDER_TYPES.PICKUP,
    items: [
      {
        menuItem: samosaItem._id,
        name: 'Special Special Samosa (2 Pcs)',
        unitPrice: 35,
        quantity: 2,
        totalPrice: 70
      },
      {
        menuItem: vadaPavItem._id,
        name: 'Mumbai Style Vada Pav',
        unitPrice: 45,
        quantity: 1,
        totalPrice: 45
      }
    ],
    subtotal: 115,
    discountAmount: 20,
    taxAmount: 0,
    commissionAmount: 4.75,
    finalAmount: 95,
    couponCode: 'STREET20',
    orderStatus: ORDER_STATUS.COMPLETED,
    paymentStatus: PAYMENT_STATUS.PAID,
    paymentMethod: 'ONLINE_RAZORPAY',
    completedAt: new Date(Date.now() - 3600000)
  });

  console.log('[Database Seed]: Auto-seed finished successfully!');
};

module.exports = { seedInitialDatabaseData };

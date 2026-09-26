// Creates a demo vendor with a sample menu so you can try the app right away.
//   npm run seed            -> creates it if it doesn't exist yet
//   npm run seed -- --reset -> deletes the demo shop (and its orders/reviews) and creates it again
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const connectDB = require('./db');
const Vendor = require('./models/Vendor');
const MenuItem = require('./models/MenuItem');
const Order = require('./models/Order');
const Review = require('./models/Review');

const DEMO = {
  email: 'demo@vendor.com',
  password: 'demo1234',
  name: 'Ramesh Kumar',
  shopName: 'Demo Chaat Corner',
  slug: 'demo-chaat-corner',
  phone: '9876543210',
  description: 'Fresh chaat, rolls and chai since 2010',
  address: 'Stall 12, Food Street, Near City Mall',
  openingHours: '4 PM - 11 PM',
  tables: ['Table 1', 'Table 2', 'Table 3', 'Table 4'].map((name, i) => ({ code: `DEMO${i + 1}`, name })),
};

const MENU = [
  { name: 'Pani Puri', category: 'Chaat', price: 40, prepTime: 5, description: '6 crispy puris with spicy mint water' },
  { name: 'Sev Puri', category: 'Chaat', price: 60, prepTime: 7, description: 'Topped with potato, chutneys and sev' },
  { name: 'Dahi Bhalla', category: 'Chaat', price: 70, prepTime: 7, description: 'Soft lentil dumplings in sweet curd' },
  { name: 'Aloo Tikki Chaat', category: 'Chaat', price: 80, prepTime: 10 },
  { name: 'Vada Pav', category: 'Snacks', price: 30, prepTime: 5, description: 'Mumbai style, with fried chilli' },
  { name: 'Samosa (2 pcs)', category: 'Snacks', price: 30, prepTime: 5 },
  { name: 'Paneer Kathi Roll', category: 'Rolls', price: 120, prepTime: 12 },
  { name: 'Egg Roll', category: 'Rolls', price: 90, prepTime: 10, isVeg: false },
  { name: 'Chicken Tikka Roll', category: 'Rolls', price: 150, prepTime: 15, isVeg: false },
  { name: 'Masala Chai', category: 'Drinks', price: 20, prepTime: 5 },
  { name: 'Sweet Lassi', category: 'Drinks', price: 50, prepTime: 5 },
  { name: 'Fresh Lime Soda', category: 'Drinks', price: 40, prepTime: 5, isAvailable: false },
];

async function seed() {
  await connectDB();
  const reset = process.argv.includes('--reset');

  const existing = await Vendor.findOne({ email: DEMO.email });
  if (existing && !reset) {
    console.log(`Demo shop already exists. Log in with ${DEMO.email} / ${DEMO.password}`);
    return;
  }
  if (existing) {
    await Promise.all([
      MenuItem.deleteMany({ vendor: existing._id }),
      Order.deleteMany({ vendor: existing._id }),
      Review.deleteMany({ vendor: existing._id }),
    ]);
    await existing.deleteOne();
    console.log('Removed the old demo shop');
  }

  const { password, ...profile } = DEMO;
  const vendor = await Vendor.create({ ...profile, passwordHash: await bcrypt.hash(password, 10) });
  await MenuItem.insertMany(MENU.map((item) => ({ ...item, vendor: vendor._id })));

  console.log('Demo shop created!');
  console.log(`  Vendor login : ${DEMO.email} / ${DEMO.password}`);
  console.log(`  Customer menu: /s/${DEMO.slug}`);
}

seed()
  .catch((err) => {
    console.error('Seed failed:', err.message);
    process.exitCode = 1;
  })
  .finally(() => mongoose.disconnect());

const express = require('express');
const router = express.Router();

const authRoutes = require('./authRoutes');
const userRoutes = require('./userRoutes');
const aiRoutes = require('./aiRoutes');
const categoryRoutes = require('./categoryRoutes');
const productRoutes = require('./productRoutes');
const outfitRoutes = require('./outfitRoutes');
const cartRoutes = require('./cartRoutes');
const wishlistRoutes = require('./wishlistRoutes');
const orderRoutes = require('./orderRoutes');
const searchRoutes = require('./searchRoutes');
const newsletterRoutes = require('./newsletterRoutes');
const reviewRoutes = require('./reviewRoutes');
const couponRoutes = require('./couponRoutes');
const styleRoutes = require('./styleRoutes');
const adminCustomerRoutes = require('./adminCustomerRoutes');
const uploadRoutes = require('./uploadRoutes');
const mediaRoutes = require('./mediaRoutes');
const settingRoutes = require('./settingRoutes');
const paymentRoutes = require('./paymentRoutes');
const analyticsRoutes = require('./analyticsRoutes');
const storeRoutes = require('./storeRoutes');
const shippingRoutes = require('./shippingRoutes');
const { sendSuccess, sendError } = require('../utils/response');

// Health-check endpoint
router.get('/health', async (req, res) => {
  let dbStatus = 'disconnected';
  let productCount = 0;
  let currentDb = null;
  let dbError = null;

  try {
    const prisma = require('../config/prisma');
    const dbResult = await prisma.$queryRawUnsafe('SELECT DATABASE() as current_db');
    currentDb = dbResult?.[0]?.current_db || null;
    productCount = await prisma.product.count();
    dbStatus = 'connected';
  } catch (err) {
    dbStatus = 'error';
    dbError = err.message;
  }

  if (dbStatus !== 'connected') {
    console.error('[health] Database readiness check failed:', dbError);
    return sendError(
      res,
      'Routine Web Backend is running but the database is unavailable',
      503,
      {
        status: 'unhealthy',
        dbStatus,
        currentDb,
        productCount,
        service: 'Routine Web API',
        version: '1.4.1',
      }
    );
  }

  return sendSuccess(
    res,
    {
      status: 'healthy',
      dbStatus,
      currentDb,
      productCount,
      dbError,
      timestamp: new Date().toISOString(),
      service: 'Routine Web API',
      version: '1.4.1',
    },
    'Routine Web Backend is operational'
  );
});

// Mount modules
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/ai', aiRoutes);
// Alias hỗ trợ tương thích ngược cho endpoint smart-outfit/ai-stylist
router.use('/smart-outfit/ai-stylist', (req, res, next) => {
  req.url = '/chat';
  return aiRoutes(req, res, next);
});
router.use('/categories', categoryRoutes);
router.use('/styles', styleRoutes);
router.use('/products', productRoutes);
router.use('/outfits', outfitRoutes);
router.use('/cart', cartRoutes);
router.use('/wishlist', wishlistRoutes);
router.use('/orders', orderRoutes);
router.use('/search', searchRoutes);
router.use('/newsletter', newsletterRoutes);
router.use('/reviews', reviewRoutes);
router.use('/coupons', couponRoutes);
router.use('/admin/customers', adminCustomerRoutes);
router.use('/upload', uploadRoutes);
router.use('/media', mediaRoutes);
router.use('/uploads', mediaRoutes); // Alias tương thích ngược
router.use('/settings', settingRoutes);
router.use('/payment', paymentRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/stores', storeRoutes);
router.use('/shipping', shippingRoutes);

module.exports = router;

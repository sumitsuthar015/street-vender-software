const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/reviewController');
const { authenticate } = require('../middleware/authMiddleware');

router.get('/vendor/:vendorId', reviewController.getVendorReviews);
router.post('/create', authenticate, reviewController.createReview);
router.post('/:reviewId/report', authenticate, reviewController.reportReview);

module.exports = router;

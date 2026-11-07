const express = require('express');
const router = express.Router();
const wishlistController = require('../controllers/wishlistController');
const identifyUser = require('../middlewares/identifyUser');

// Tất cả các route wishlist đều đi qua identifyUser
router.use(identifyUser);

// Lấy danh sách sản phẩm yêu thích (kèm chi tiết sản phẩm)
router.get('/', wishlistController.getWishlist);

// Xóa sạch danh sách yêu thích
router.delete('/', wishlistController.clearWishlist);

// Bật/tắt trạng thái yêu thích (Toggle)
router.post('/toggle', wishlistController.toggleItem);

// Kiểm tra nhanh sản phẩm có trong wishlist không
router.get('/check/:productId', wishlistController.checkInWishlist);

// Thêm sản phẩm vào wishlist
router.post('/items', wishlistController.addItem);

// Xóa sản phẩm khỏi wishlist
router.delete('/items/:productId', wishlistController.removeItem);

// Gộp wishlist từ khách vào tài khoản user
router.post('/merge', wishlistController.mergeWishlist);

module.exports = router;

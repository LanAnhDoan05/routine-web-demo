const newsletterService = require('../services/newsletterService');
const { sendSuccess, sendError } = require('../utils/response');

/**
 * Đăng ký nhận tin
 */
async function subscribe(req, res, next) {
  try {
    const { email } = req.body;
    const result = await newsletterService.subscribeNewsletter(email);
    return sendSuccess(res, result, result.message, 201);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  subscribe,
};

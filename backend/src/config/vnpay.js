/**
 * Cấu hình tích hợp cổng thanh toán VNPay Sandbox
 */

module.exports = {
  vnp_TmnCode: process.env.VNP_TMN_CODE || '',
  vnp_HashSecret: process.env.VNP_HASH_SECRET || '',
  vnp_Url: process.env.VNP_URL || 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html',
  vnp_ApiUrl: process.env.VNP_API_URL || 'https://sandbox.vnpayment.vn/merchant_webapi/api/transaction',
  vnp_ReturnUrl: process.env.VNP_RETURN_URL || 'http://localhost:3000/checkout/payment/vnpay-return',
  vnp_Version: '2.1.0',
  vnp_Command: 'pay',
  vnp_CurrCode: 'VND',
};

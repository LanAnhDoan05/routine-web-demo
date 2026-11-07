const nodemailer = require('nodemailer');

/**
 * Khởi tạo Transporter cho Nodemailer
 * Nếu có biến môi trường SMTP thì gửi email thật, ngược lại ghi log ra console (Dev mode)
 */
let transporter = null;

if (process.env.SMTP_USER && process.env.SMTP_PASS) {
  try {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: Number(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS.replace(/\s+/g, ''),
      },
    });
    console.log('[emailService] SMTP Transporter đã sẵn sàng');
  } catch (err) {
    console.warn('[emailService] Không thể kết nối SMTP Transporter:', err.message);
  }
}

/**
 * Gửi email mã xác thực OTP
 */
async function sendOtpEmail(toEmail, otpCode, receiverName = 'Quý khách') {
  const subject = `[Routine] ${otpCode} là mã xác thực tài khoản của bạn`;
  
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; margin: 0; padding: 0; background-color: #f8fafc; color: #1e293b; }
        .container { max-width: 540px; margin: 30px auto; background: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 16px rgba(0,0,0,0.04); }
        .header { background: #0f172a; padding: 24px; text-align: center; }
        .header h1 { color: #ffffff; margin: 0; font-size: 22px; font-weight: 800; letter-spacing: 0.15em; }
        .content { padding: 32px 28px; }
        .greeting { font-size: 16px; font-weight: 600; margin-bottom: 12px; color: #0f172a; }
        .desc { font-size: 14px; line-height: 1.6; color: #475569; margin-bottom: 24px; }
        .otp-box { background: #f1f5f9; border: 2px dashed #cbd5e1; border-radius: 8px; padding: 18px; text-align: center; margin-bottom: 24px; }
        .otp-code { font-size: 32px; font-weight: 800; letter-spacing: 0.3em; color: #0f172a; font-family: monospace; }
        .warning { font-size: 13px; color: #ef4444; background: #fef2f2; border-radius: 6px; padding: 10px 14px; margin-bottom: 20px; line-height: 1.5; }
        .footer { background: #f8fafc; padding: 18px 24px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>ROUTINE</h1>
        </div>
        <div class="content">
          <div class="greeting">Xin chào ${receiverName},</div>
          <div class="desc">
            Chúng tôi nhận được yêu cầu xác thực hoặc đặt lại mật khẩu cho tài khoản Routine của bạn. Vui lòng nhập mã xác thực OTP dưới đây để tiếp tục:
          </div>
          <div class="otp-box">
            <div class="otp-code">${otpCode}</div>
          </div>
          <div class="warning">
            ⚠️ <strong>Lưu ý bảo mật:</strong> Mã xác thực có hiệu lực trong vòng <strong>5 phút</strong>. Tuyệt đối không chia sẻ mã này cho bất kỳ ai, kể cả nhân viên Routine.
          </div>
          <div class="desc" style="margin-bottom: 0;">
            Nếu bạn không yêu cầu thao tác này, bạn có thể yên tâm bỏ qua email này. Mật khẩu của bạn vẫn an toàn.
          </div>
        </div>
        <div class="footer">
          &copy; ${new Date().getFullYear()} Routine Vietnam. Mọi quyền được bảo lưu.<br>
          Thời trang tối giản, phong cách hiện đại.
        </div>
      </div>
    </body>
    </html>
  `;

  // Luôn in ra console để dễ dàng kiểm thử ngay cả khi không có SMTP
  console.log('\n======================================================');
  console.log(`[ROUTINE EMAIL OTP] Gửi tới: ${toEmail}`);
  console.log(`>>> MÃ OTP XÁC THỰC: ${otpCode} <<< (Hạn 5 phút)`);
  console.log('======================================================\n');

  if (transporter) {
    try {
      const info = await transporter.sendMail({
        from: process.env.SMTP_FROM || '"Routine Fashion" <no-reply@routine.vn>',
        to: toEmail,
        subject,
        html: htmlContent,
      });
      console.log('[emailService] Đã gửi email thành công, messageId:', info.messageId);
      return { success: true, messageId: info.messageId };
    } catch (err) {
      console.error('[emailService] Lỗi khi gửi email qua SMTP:', err.message);
      return { success: false, error: err.message };
    }
  }

  if (process.env.NODE_ENV === 'production') {
    return { success: false, error: 'Email SMTP chưa được cấu hình' };
  }

  return { success: true, devMode: true };
}

/**
 * Gửi email thông báo đổi mật khẩu thành công
 */
async function sendPasswordResetSuccessEmail(toEmail, receiverName = 'Quý khách') {
  const subject = '[Routine] Mật khẩu tài khoản của bạn đã được cập nhật thành công';
  
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f8fafc; color: #1e293b; }
        .container { max-width: 540px; margin: 30px auto; background: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden; }
        .header { background: #0f172a; padding: 24px; text-align: center; color: #ffffff; }
        .content { padding: 32px 28px; font-size: 14px; line-height: 1.6; }
        .success-badge { color: #166534; background: #dcfce7; padding: 10px 14px; border-radius: 6px; font-weight: 600; margin-bottom: 16px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h2 style="margin:0; letter-spacing:0.15em;">ROUTINE</h2>
        </div>
        <div class="content">
          <div class="success-badge">✓ Mật khẩu đã được thay đổi thành công</div>
          <p>Xin chào ${receiverName},</p>
          <p>Mật khẩu cho tài khoản Routine của bạn (${toEmail}) vừa được cập nhật vào lúc ${new Date().toLocaleString('vi-VN')}.</p>
          <p>Nếu bạn thực hiện thay đổi này, bạn không cần phải làm gì thêm.</p>
          <p style="color:#ef4444;">Nếu bạn KHÔNG thực hiện thay đổi này, vui lòng liên hệ ngay với bộ phận CSKH của chúng tôi để bảo vệ tài khoản.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmailInternal({
    to: toEmail,
    subject,
    html: htmlContent,
  });
}

/**
 * Gửi email nội bộ dùng Resend API hoặc Nodemailer hoặc Dev Logger
 */
async function sendEmailInternal({ to, subject, html }) {
  const from = process.env.EMAIL_FROM || process.env.SMTP_FROM || '"Routine Fashion" <no-reply@routine.vn>';

  // 1. Kiểm tra nếu có cấu hình Resend API Key
  if (process.env.RESEND_API_KEY) {
    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: process.env.RESEND_FROM || 'Routine Fashion <onboarding@resend.dev>',
          to: Array.isArray(to) ? to : [to],
          subject,
          html,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        console.log('[emailService:Resend] Đã gửi email thành công ID:', data.id);
        return { success: true, provider: 'resend', id: data.id };
      } else {
        console.warn('[emailService:Resend] Gửi thất bại qua Resend:', data);
      }
    } catch (err) {
      console.error('[emailService:Resend] Lỗi khi gọi Resend API:', err.message);
    }
  }

  // 2. Kiểm tra nếu có Nodemailer Transporter
  if (transporter) {
    try {
      const info = await transporter.sendMail({
        from,
        to,
        subject,
        html,
      });
      console.log('[emailService:Nodemailer] Đã gửi email thành công messageId:', info.messageId);
      return { success: true, provider: 'nodemailer', messageId: info.messageId };
    } catch (err) {
      console.error('[emailService:Nodemailer] Lỗi gửi qua SMTP:', err.message);
    }
  }

  // 3. Dev mode fallback
  return { success: true, devMode: true };
}

/**
 * Định dạng tiền tệ VNĐ
 */
function formatVND(amount) {
  return (Number(amount) || 0).toLocaleString('vi-VN') + '₫';
}

/**
 * Gửi email hóa đơn đơn hàng tự động
 */
async function sendOrderInvoiceEmail({ order, customerEmail, customerName }) {
  if (!order) return { success: false, error: 'Không có dữ liệu đơn hàng' };

  const toEmail = customerEmail || (order.user && order.user.email) || null;
  if (!toEmail) {
    console.warn(`[emailService] Không tìm thấy email của đơn hàng ${order.id}, bỏ qua gửi hóa đơn.`);
    return { success: false, error: 'Không tìm thấy địa chỉ email nhận hóa đơn' };
  }

  const receiverName = customerName || order.receiverName || (order.user && order.user.fullName) || 'Quý khách';
  const orderId = order.id || 'N/A';
  const orderDate = new Date(order.createdAt || Date.now()).toLocaleString('vi-VN', {
    timeZone: 'Asia/Ho_Chi_Minh',
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  const isPaid = order.paymentStatus === 'PAID';
  const isVnPay = (order.paymentMethod || '').toUpperCase() === 'VNPAY';
  const isCod = (order.paymentMethod || '').toUpperCase() === 'COD';

  let paymentBadgeText = 'Chưa thanh toán';
  let paymentBadgeBg = '#fef3c7';
  let paymentBadgeColor = '#92400e';

  if (isPaid) {
    paymentBadgeText = isVnPay ? '✓ Đã thanh toán qua VNPay' : '✓ Đã thanh toán';
    paymentBadgeBg = '#dcfce7';
    paymentBadgeColor = '#166534';
  } else if (isCod) {
    paymentBadgeText = '📦 Thanh toán khi nhận hàng (COD)';
    paymentBadgeBg = '#e0f2fe';
    paymentBadgeColor = '#0369a1';
  }

  const shippingAddr =
    typeof order.shippingAddress === 'string'
      ? order.shippingAddress
      : (order.shippingAddress && order.shippingAddress.address) || 'Địa chỉ nhận hàng';

  const items = order.items || [];
  const itemsHtml = items
    .map((item) => {
      const itemSubtotal = (Number(item.price) || 0) * (Number(item.quantity) || 1);
      const variantInfo = [item.color, item.size].filter(Boolean).join(' · ');
      return `
        <tr style="border-bottom: 1px solid #f1f5f9;">
          <td style="padding: 16px 8px; vertical-align: middle;">
            <div style="font-weight: 600; color: #0f172a; font-size: 14px;">${item.name || 'Sản phẩm'}</div>
            ${variantInfo ? `<div style="color: #64748b; font-size: 12px; margin-top: 2px;">Phân loại: ${variantInfo}</div>` : ''}
          </td>
          <td style="padding: 16px 8px; text-align: center; color: #475569; font-size: 14px; vertical-align: middle;">
            ${item.quantity}
          </td>
          <td style="padding: 16px 8px; text-align: right; color: #475569; font-size: 14px; vertical-align: middle;">
            ${formatVND(item.price)}
          </td>
          <td style="padding: 16px 8px; text-align: right; font-weight: 600; color: #0f172a; font-size: 14px; vertical-align: middle;">
            ${formatVND(itemSubtotal)}
          </td>
        </tr>
      `;
    })
    .join('');

  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  const orderTrackingUrl = `${frontendUrl}/orders`;

  const subject = `[Routine] Hóa đơn xác nhận đơn hàng #${orderId}`;

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="vi">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Hóa đơn đơn hàng ${orderId}</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; margin: 0; padding: 0; background-color: #f8fafc; color: #1e293b; }
        .wrapper { width: 100%; background-color: #f8fafc; padding: 24px 0; }
        .container { max-width: 620px; margin: 0 auto; background: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.03); }
        .header { background: #0f172a; padding: 28px 24px; text-align: center; }
        .logo { color: #ffffff; font-size: 26px; font-weight: 800; letter-spacing: 0.2em; text-decoration: none; margin: 0; }
        .slogan { color: #94a3b8; font-size: 12px; margin-top: 4px; letter-spacing: 0.05em; }
        .body-content { padding: 32px 28px; }
        .title-block { border-bottom: 2px solid #f1f5f9; padding-bottom: 20px; margin-bottom: 24px; }
        .badge { display: inline-block; padding: 6px 14px; border-radius: 9999px; font-size: 12px; font-weight: 700; }
        .info-grid { display: table; width: 100%; margin-bottom: 24px; background: #f8fafc; border-radius: 8px; padding: 16px; border: 1px solid #f1f5f9; }
        .info-col { display: table-cell; width: 50%; vertical-align: top; padding: 0 8px; }
        .table { width: 100%; border-collapse: collapse; margin-top: 12px; margin-bottom: 24px; }
        .th { text-align: left; padding: 10px 8px; font-size: 12px; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 1px solid #e2e8f0; }
        .summary-box { border-top: 2px solid #0f172a; padding-top: 16px; margin-top: 16px; }
        .btn-track { display: inline-block; background: #0f172a; color: #ffffff !important; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: 600; font-size: 14px; margin-top: 24px; text-align: center; }
        .footer { background: #f8fafc; padding: 24px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0; line-height: 1.6; }
      </style>
    </head>
    <body>
      <div class="wrapper">
        <div class="container">
          <!-- Header Brand -->
          <div class="header">
            <h1 class="logo">ROUTINE</h1>
            <div class="slogan">SMART FASHION FOR MODERN LIFE</div>
          </div>

          <!-- Nội dung chính -->
          <div class="body-content">
            <div class="title-block">
              <div style="font-size: 13px; color: #64748b; margin-bottom: 4px;">CẢM ƠN BẠN ĐÃ ĐẶT HÀNG TẠI ROUTINE</div>
              <h2 style="margin: 0 0 12px 0; color: #0f172a; font-size: 22px;">Hóa đơn đơn hàng #${orderId}</h2>
              <span class="badge" style="background-color: ${paymentBadgeBg}; color: ${paymentBadgeColor};">
                ${paymentBadgeText}
              </span>
            </div>

            <p style="font-size: 14px; line-height: 1.6; color: #334155; margin-bottom: 20px;">
              Xin chào <strong>${receiverName}</strong>,<br>
              Đơn hàng của bạn đã được tiếp nhận và đang được đội ngũ Routine chuẩn bị để gửi đi sớm nhất. Dưới đây là thông tin chi tiết hóa đơn:
            </p>

            <!-- Thông tin giao hàng & người nhận -->
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px; background: #f8fafc; border-radius: 8px; border: 1px solid #e2e8f0;">
              <tr>
                <td style="padding: 16px; width: 50%; vertical-align: top; border-right: 1px solid #e2e8f0;">
                  <div style="font-size: 11px; text-transform: uppercase; font-weight: 700; color: #64748b; margin-bottom: 6px;">Người nhận hàng</div>
                  <div style="font-weight: 700; color: #0f172a; font-size: 14px;">${receiverName}</div>
                  <div style="color: #475569; font-size: 13px; margin-top: 2px;">📞 ${order.phoneNumber || 'N/A'}</div>
                  <div style="color: #475569; font-size: 13px; margin-top: 2px;">📍 ${shippingAddr}</div>
                </td>
                <td style="padding: 16px; width: 50%; vertical-align: top;">
                  <div style="font-size: 11px; text-transform: uppercase; font-weight: 700; color: #64748b; margin-bottom: 6px;">Thông tin đơn</div>
                  <div style="color: #475569; font-size: 13px;"><strong>Ngày đặt:</strong> ${orderDate}</div>
                  <div style="color: #475569; font-size: 13px; margin-top: 2px;"><strong>PT Thanh toán:</strong> ${(order.paymentMethod || 'COD').toUpperCase()}</div>
                  <div style="color: #475569; font-size: 13px; margin-top: 2px;"><strong>Vận chuyển:</strong> ${order.shippingMethod === 'express' ? 'Hỏa tốc (Express)' : 'Tiêu chuẩn (Standard)'}</div>
                  ${order.note ? `<div style="color: #475569; font-size: 13px; margin-top: 2px;"><strong>Ghi chú:</strong> <em>${order.note}</em></div>` : ''}
                </td>
              </tr>
            </table>

            <!-- Bảng chi tiết sản phẩm -->
            <div style="font-size: 14px; font-weight: 700; color: #0f172a; margin-bottom: 8px;">CHI TIẾT SẢN PHẨM</div>
            <table class="table">
              <thead>
                <tr>
                  <th class="th">Sản phẩm</th>
                  <th class="th" style="text-align: center;">SL</th>
                  <th class="th" style="text-align: right;">Đơn giá</th>
                  <th class="th" style="text-align: right;">Thành tiền</th>
                </tr>
              </thead>
              <tbody>
                ${itemsHtml}
              </tbody>
            </table>

            <!-- Tổng kết hóa đơn -->
            <div class="summary-box">
              <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
                <tr>
                  <td style="padding: 6px 0; color: #64748b;">Tạm tính:</td>
                  <td style="padding: 6px 0; text-align: right; color: #0f172a; font-weight: 500;">${formatVND(order.subtotal)}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; color: #64748b;">Phí vận chuyển:</td>
                  <td style="padding: 6px 0; text-align: right; color: #0f172a; font-weight: 500;">${order.shippingFee === 0 ? 'Miễn phí' : formatVND(order.shippingFee)}</td>
                </tr>
                ${
                  order.discount > 0
                    ? `
                <tr>
                  <td style="padding: 6px 0; color: #16a34a;">Giảm giá voucher:</td>
                  <td style="padding: 6px 0; text-align: right; color: #16a34a; font-weight: 500;">-${formatVND(order.discount)}</td>
                </tr>
                `
                    : ''
                }
                <tr style="border-top: 1px solid #e2e8f0;">
                  <td style="padding: 12px 0; font-size: 16px; font-weight: 700; color: #0f172a;">TỔNG THANH TOÁN:</td>
                  <td style="padding: 12px 0; text-align: right; font-size: 20px; font-weight: 800; color: #0f172a;">
                    ${formatVND(order.total)}
                  </td>
                </tr>
              </table>
            </div>

            <!-- Nút điều hướng -->
            <div style="text-align: center; margin-top: 10px;">
              <a href="${orderTrackingUrl}" class="btn-track" target="_blank">
                Kiểm Tra Tiến Độ Đơn Hàng →
              </a>
            </div>
          </div>

          <!-- Footer -->
          <div class="footer">
            <strong>Routine Vietnam</strong> · Thời trang nam nữ phong cách hiện đại tối giản<br>
            Hotline CSKH: <strong>1900 63 68 89</strong> (8:30 - 21:30 hàng ngày) · Email: cskh@routine.vn<br>
            Chính sách đổi trả miễn phí trong vòng <strong>15 ngày</strong> kể từ khi nhận hàng.<br>
            &copy; ${new Date().getFullYear()} Routine. All rights reserved.
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  // Dev Logger: In bản xem trước hóa đơn ra console
  console.log('\n======================================================');
  console.log(`[ROUTINE ORDER INVOICE EMAIL]`);
  console.log(`>>> Gửi tới: ${toEmail} (${receiverName})`);
  console.log(`>>> Mã đơn hàng: #${orderId}`);
  console.log(`>>> Tổng tiền: ${formatVND(order.total)} | Trạng thái: ${paymentBadgeText}`);
  console.log(`>>> Số món hàng: ${items.length} món`);
  items.forEach((item, idx) => {
    console.log(`    ${idx + 1}. ${item.name} (${item.size || ''}/${item.color || ''}) x${item.quantity} = ${formatVND((item.price || 0) * (item.quantity || 1))}`);
  });
  console.log('======================================================\n');

  return sendEmailInternal({
    to: toEmail,
    subject,
    html: htmlContent,
  });
}

module.exports = {
  sendOtpEmail,
  sendPasswordResetSuccessEmail,
  sendOrderInvoiceEmail,
  formatVND,
};

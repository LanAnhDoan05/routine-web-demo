"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import CheckoutHeader from "@/components/checkout/CheckoutHeader";
import Loading from "@/components/common/Loading";
import { formatPrice } from "@/lib/format";
import { verifyVNPayReturn } from "@/lib/vnpayService";
import { useCart } from "@/context/CartContext";
import { useCheckout } from "@/context/CheckoutContext";

export default function VNPayReturnPage() {
  return (
    <Suspense
      fallback={
        <div className="container section" style={{ textAlign: "center", padding: "80px 0" }}>
          <Loading />
          <p style={{ marginTop: 16, color: "var(--color-text-secondary)" }}>
            Đang xác thực kết quả thanh toán từ VNPay...
          </p>
        </div>
      }
    >
      <VNPayReturnInner />
    </Suspense>
  );
}

function VNPayReturnInner() {
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState(null);
  const { clearCart } = useCart();
  const checkout = useCheckout();

  useEffect(() => {
    let isMounted = true;

    async function verify() {
      const queryString = searchParams.toString();
      if (!queryString) {
        if (isMounted) {
          setResult({
            valid: false,
            success: false,
            message: "Không tìm thấy thông tin phản hồi từ cổng thanh toán VNPay.",
          });
          setLoading(false);
        }
        return;
      }

      try {
        const verifyRes = await verifyVNPayReturn(queryString);
        if (isMounted) {
          setResult(verifyRes);
          setLoading(false);
        }
      } catch (err) {
        if (isMounted) {
          setResult({
            valid: false,
            success: false,
            message: err.message || "Lỗi khi xác thực dữ liệu từ cổng thanh toán.",
          });
          setLoading(false);
        }
      }
    }

    verify();

    return () => {
      isMounted = false;
    };
  }, [searchParams]);

  useEffect(() => {
    if (result?.valid && result?.success) {
      clearCart();
      checkout.reset();
    }
  }, [result, clearCart, checkout]);

  if (loading) {
    return (
      <div className="container section" style={{ textAlign: "center", padding: "80px 0" }}>
        <Loading />
        <p style={{ marginTop: 20, color: "var(--color-text-secondary)", fontSize: 15 }}>
          Đang xác thực kết quả giao dịch từ cổng thanh toán VNPay...
        </p>
      </div>
    );
  }

  const isSuccess = result?.valid && result?.success;
  const isCancelled = result?.responseCode === "24";

  return (
    <div className="container section">
      <CheckoutHeader activeStep="complete" />

      <div className="vnpay-result-container">
        {isSuccess ? (
          /* THÀNH CÔNG */
          <div className="result-card success">
            <div className="status-icon success-icon" aria-hidden="true">
              ✓
            </div>
            <h1 className="result-title">THANH TOÁN THÀNH CÔNG</h1>
            <p className="result-subtitle">
              Cảm ơn bạn đã mua sắm tại Routine. Giao dịch qua cổng VNPay đã được xác nhận.
            </p>

            <div className="result-details">
              <div className="detail-row">
                <span className="detail-label">Mã đơn hàng:</span>
                <span className="detail-val strong">#{result.orderId}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Số tiền thanh toán:</span>
                <span className="detail-val price">{formatPrice(result.amount)}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Cổng thanh toán:</span>
                <span className="detail-val">VNPay Sandbox</span>
              </div>
              {result.transactionNo && (
                <div className="detail-row">
                  <span className="detail-label">Mã giao dịch VNPay:</span>
                  <span className="detail-val">{result.transactionNo}</span>
                </div>
              )}
              {result.bankCode && (
                <div className="detail-row">
                  <span className="detail-label">Ngân hàng:</span>
                  <span className="detail-val">{result.bankCode}</span>
                </div>
              )}
              <div className="detail-row">
                <span className="detail-label">Trạng thái đơn hàng:</span>
                <span className="detail-val status-confirmed">ĐÃ XÁC NHẬN</span>
              </div>
            </div>

            <div className="action-buttons">
              {result.orderId && (
                <Link href={`/orders/${result.orderId}`} className="btn btn-primary">
                  Xem chi tiết đơn hàng
                </Link>
              )}
              <Link href="/" className="btn btn-secondary">
                Tiếp tục mua sắm
              </Link>
            </div>
          </div>
        ) : (
          /* THẤT BẠI HOẶC HỦY */
          <div className="result-card error">
            <div className="status-icon error-icon" aria-hidden="true">
              ✕
            </div>
            <h1 className="result-title">
              {isCancelled ? "GIAO DỊCH ĐÃ HỦY" : "THANH TOÁN CHƯA HOÀN TẤT"}
            </h1>
            <p className="result-subtitle">
              {result?.message || "Đã xảy ra lỗi trong quá trình xử lý giao dịch tại cổng VNPay."}
            </p>

            {/* Thông báo giữ nguyên giỏ hàng */}
            <div className="cart-preserved-box">
              <div className="cart-box-header">
                <span className="cart-box-icon">🛒</span>
                <span className="cart-box-title">Giỏ hàng của bạn vẫn được giữ nguyên!</span>
              </div>
              <p className="cart-box-desc">
                Sản phẩm của bạn vẫn nằm nguyên vẹn trong giỏ hàng. Bạn có thể kiểm tra lại giỏ hàng, chọn sản phẩm khác hoặc thử thanh toán lại bất kỳ lúc nào.
              </p>
            </div>

            <div className="result-details">
              {result?.orderId && (
                <div className="detail-row">
                  <span className="detail-label">Mã đơn hàng:</span>
                  <span className="detail-val strong">#{result.orderId}</span>
                </div>
              )}
              {result?.amount > 0 && (
                <div className="detail-row">
                  <span className="detail-label">Số tiền:</span>
                  <span className="detail-val">{formatPrice(result.amount)}</span>
                </div>
              )}
              {result?.responseCode && (
                <div className="detail-row">
                  <span className="detail-label">Mã phản hồi VNPay:</span>
                  <span className="detail-val code">{result.responseCode}</span>
                </div>
              )}
              <div className="detail-row">
                <span className="detail-label">Trạng thái thanh toán:</span>
                <span className="detail-val status-unpaid">CHƯA THANH TOÁN</span>
              </div>
            </div>

            <div className="action-buttons">
              <Link href="/checkout/payment" className="btn btn-primary">
                Thử lại thanh toán
              </Link>
              <Link href="/cart" className="btn btn-secondary">
                Xem giỏ hàng
              </Link>
              <Link href="/orders" className="btn btn-secondary">
                Lịch sử đơn hàng
              </Link>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        .vnpay-result-container {
          max-width: 560px;
          margin: 32px auto;
        }
        .result-card {
          background: #ffffff;
          border: 1px solid var(--color-border, #e2e8f0);
          border-radius: var(--radius-lg, 12px);
          padding: 40px 32px;
          text-align: center;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.04);
        }
        .cart-preserved-box {
          background: #f0fdf4;
          border: 1px solid #bbf7d0;
          border-radius: 8px;
          padding: 14px 16px;
          margin-bottom: 20px;
          text-align: left;
        }
        .cart-box-header {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 4px;
        }
        .cart-box-icon {
          font-size: 18px;
        }
        .cart-box-title {
          font-size: 14px;
          font-weight: 700;
          color: #166534;
        }
        .cart-box-desc {
          font-size: 13px;
          color: #15803d;
          line-height: 1.5;
          margin: 0;
        }
        .status-icon {
          width: 64px;
          height: 64px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 32px;
          font-weight: bold;
          margin: 0 auto 20px;
        }
        .success-icon {
          background: #ecfdf5;
          color: #10b981;
        }
        .error-icon {
          background: #fef2f2;
          color: #ef4444;
        }
        .result-title {
          font-size: 20px;
          font-weight: 700;
          letter-spacing: 0.03em;
          margin-bottom: 8px;
          color: var(--color-text, #0f172a);
        }
        .result-subtitle {
          font-size: 14px;
          color: var(--color-text-secondary, #64748b);
          line-height: 1.5;
          margin-bottom: 24px;
        }
        .result-details {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 16px 20px;
          margin-bottom: 28px;
          text-align: left;
        }
        .detail-row {
          display: flex;
          justify-content: space-between;
          padding: 8px 0;
          font-size: 14px;
          border-bottom: 1px solid #edf2f7;
        }
        .detail-row:last-child {
          border-bottom: none;
        }
        .detail-label {
          color: #64748b;
        }
        .detail-val {
          color: #1e293b;
          font-weight: 500;
        }
        .detail-val.strong {
          font-weight: 700;
        }
        .detail-val.price {
          color: var(--color-primary, #111827);
          font-weight: 700;
        }
        .detail-val.code {
          font-family: monospace;
          background: #e2e8f0;
          padding: 2px 6px;
          border-radius: 4px;
        }
        .status-confirmed {
          color: #10b981;
          font-weight: 600;
        }
        .status-unpaid {
          color: #f59e0b;
          font-weight: 600;
        }
        .action-buttons {
          display: flex;
          gap: 12px;
          justify-content: center;
          flex-wrap: wrap;
        }
      `}</style>
    </div>
  );
}

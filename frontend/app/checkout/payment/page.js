"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import CheckoutHeader from "@/components/checkout/CheckoutHeader";
import PaymentMethod from "@/components/payment/PaymentMethod";
import CardPaymentForm from "@/components/payment/CardPaymentForm";
import PaymentSummary from "@/components/payment/PaymentSummary";
import { useCart } from "@/context/CartContext";
import { useCheckout } from "@/context/CheckoutContext";
import { useUser } from "@/context/UserContext";
import { processPayment } from "@/lib/paymentService";
import { getShippingFee } from "@/lib/checkoutConstants";
import * as orderService from "@/lib/orderService";
import { createVNPayPaymentUrl } from "@/lib/vnpayService";

export default function PaymentPage() {
  const router = useRouter();
  const { items, subtotal, hydrated: cartHydrated, clearCart } = useCart();
  const checkout = useCheckout();
  const { user } = useUser();

  const [paymentMethodId, setPaymentMethodId] = useState("vnpay");
  const [cardValues, setCardValues] = useState({});
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);

  const ready = cartHydrated && checkout.hydrated;

  useEffect(() => {
    if (!ready) return;
    if (items.length === 0) {
      router.replace("/cart");
      return;
    }
    if (!checkout.address) {
      router.replace("/checkout");
    }
  }, [ready, items.length, checkout.address, router]);

  if (!ready || items.length === 0 || !checkout.address) {
    return null;
  }

  async function handlePlaceOrder() {
    setIsProcessing(true);
    setError(null);

    const shippingFee = getShippingFee(checkout.shippingMethod, checkout.address, subtotal);
    const total = Math.max(subtotal + shippingFee - checkout.discount, 0);

    const customerEmail = checkout.contact?.email || user?.email || "";

    const orderPayload = {
      items: items.map((item) => ({
        productId: item.productId,
        name: item.name,
        image: item.image,
        color: item.color,
        size: item.size,
        quantity: item.quantity,
        price: item.price,
      })),
      shippingAddress: checkout.address,
      shippingMethod: checkout.shippingMethod,
      paymentMethod: paymentMethodId.toUpperCase(),
      note: checkout.note,
      subtotal,
      shipping: shippingFee,
      discount: checkout.discount,
      appliedCoupon: checkout.voucherCode || null,
      total,
      customerEmail,
    };

    // Luồng thanh toán qua cổng VNPay Sandbox
    if (paymentMethodId === "vnpay") {
      try {
        const newOrder = await orderService.createOrder(orderPayload);
        if (!newOrder || !newOrder.id) {
          throw new Error("Không thể khởi tạo đơn hàng. Vui lòng thử lại.");
        }

        const vnpayRes = await createVNPayPaymentUrl({
          orderId: newOrder.id,
          amount: total,
          orderInfo: `Thanh toan don hang ${newOrder.id} - Routine`,
        });

        if (!vnpayRes || !vnpayRes.paymentUrl) {
          throw new Error("Không nhận được liên kết thanh toán từ VNPay. Vui lòng thử lại.");
        }

        // KHÔNG xóa giỏ hàng ở đây! Giỏ hàng chỉ được xóa khi VNPay xác nhận thanh toán thành công.
        // Hệ thống đã giữ tạm thời sản phẩm trong 5 phút để chống tranh hàng.
        // Chuyển hướng trình duyệt sang cổng thanh toán VNPay Sandbox
        window.location.href = vnpayRes.paymentUrl;
        return;
      } catch (err) {
        setError(err.message || "Không thể kết nối đến cổng VNPay. Vui lòng thử lại.");
        setIsProcessing(false);
        return;
      }
    }

    // Luồng thanh toán COD / Thẻ / MoMo (mô phỏng)
    const result = await processPayment({
      method: paymentMethodId,
      amount: total,
      cardDetails: paymentMethodId === "card" ? cardValues : undefined,
    });

    if (!result.success) {
      setError(result.error || "Không thể hoàn tất thanh toán. Vui lòng thử lại.");
      setIsProcessing(false);
      return;
    }

    try {
      const newOrder = await orderService.createOrder(orderPayload);
      const email = checkout.contact?.email;
      clearCart();
      checkout.reset();
      router.push(
        `/checkout/success?orderId=${newOrder.id}${email ? `&email=${encodeURIComponent(email)}` : ""}`
      );
    } catch (err) {
      setError(err.message || "Tạo đơn hàng thất bại. Vui lòng thử lại.");
      setIsProcessing(false);
    }
  }

  return (
    <div className="container section">
      <nav className="breadcrumb" style={{ marginBottom: 20 }} aria-label="Breadcrumb">
        <Link href="/">Home</Link>
        <span>/</span>
        <Link href="/cart">Cart</Link>
        <span>/</span>
        <Link href="/checkout">Checkout</Link>
        <span>/</span>
        <span className="breadcrumb-current">Payment</span>
      </nav>

      <h1 className="section-title" style={{ marginBottom: 8 }}>
        PAYMENT
      </h1>

      <CheckoutHeader activeStep="payment" />

      <div className="payment-layout">
        <div>
          <section className="checkout-section">
            <h2 className="checkout-section-title">Payment Method</h2>
            <PaymentMethod value={paymentMethodId} onChange={setPaymentMethodId} />

            {paymentMethodId === "vnpay" && (
              <p style={{ marginTop: 16, fontSize: 14, color: "var(--color-text-secondary)" }}>
                Bạn sẽ được chuyển hướng an toàn tới cổng thanh toán VNPay để hoàn tất giao dịch.
              </p>
            )}

            {paymentMethodId === "cod" && (
              <p style={{ marginTop: 16, fontSize: 14, color: "var(--color-text-secondary)" }}>
                Bạn sẽ thanh toán tiền mặt trực tiếp khi nhận hàng.
              </p>
            )}

            {paymentMethodId === "card" && <CardPaymentForm values={cardValues} onChange={setCardValues} />}

            {paymentMethodId === "momo" && (
              <p style={{ marginTop: 16, fontSize: 14, color: "var(--color-text-secondary)" }}>
                Bạn sẽ được chuyển tới cổng thanh toán sau khi xác nhận đơn hàng.
              </p>
            )}
          </section>
        </div>

        <div>
          <PaymentSummary
            subtotal={subtotal}
            shippingMethod={checkout.shippingMethod}
            discount={checkout.discount}
            voucherCode={checkout.voucherCode}
            onPlaceOrder={handlePlaceOrder}
            isProcessing={isProcessing}
            error={error}
          />
        </div>
      </div>

      <style jsx>{`
        .payment-layout {
          display: grid;
          grid-template-columns: 1fr 380px;
          gap: 48px;
          align-items: start;
        }
        .checkout-section-title {
          font-size: 15px;
          letter-spacing: 0.04em;
          margin-bottom: 16px;
        }
        @media (max-width: 1023px) {
          .payment-layout {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}

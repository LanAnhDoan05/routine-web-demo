"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import CheckoutHeader from "@/components/checkout/CheckoutHeader";
import AddressCard from "@/components/checkout/AddressCard";
import AddressForm from "@/components/checkout/AddressForm";
import DeliveryMethod from "@/components/checkout/DeliveryMethod";
import CheckoutItems from "@/components/checkout/CheckoutItems";
import CheckoutSummary from "@/components/checkout/CheckoutSummary";
import { useCart } from "@/context/CartContext";
import { useCheckout } from "@/context/CheckoutContext";
import { useUser } from "@/context/UserContext";
import { useToast } from "@/components/common/Toast";
import { checkAddressApi } from "@/lib/shippingService";

export default function CheckoutPage() {
  const router = useRouter();
  const { items, subtotal, hydrated } = useCart();
  const { contact, address, note, shippingMethod, discount, setContact, setAddress, setNote, setShippingMethod } =
    useCheckout();
  const { user, isLoggedIn, savedAddress, setSavedAddress } = useUser();
  const { showToast } = useToast();

  const [forceEditAddress, setForceEditAddress] = useState(false);
  const showAddressForm = forceEditAddress || !address;

  useEffect(() => {
    if (hydrated && !isLoggedIn) {
      router.replace("/login?redirect=/checkout");
    }
  }, [hydrated, isLoggedIn, router]);

  useEffect(() => {
    if (user) {
      if (user.email && !contact.email) setContact({ email: user.email });
      if (user.phone && !contact.phone) setContact({ phone: user.phone });
    }
  }, [user, contact.email, contact.phone, setContact]);

  useEffect(() => {
    if (!address && savedAddress) {
      setAddress(savedAddress);
      // Nếu địa chỉ lưu từ trước chưa có định vị nearestStore, tự động xác thực ngầm
      if (!savedAddress.nearestStore && (savedAddress.address || savedAddress.city)) {
        checkAddressApi(savedAddress)
          .then((geo) => {
            if (geo && geo.valid && geo.nearestStore) {
              const enriched = {
                ...savedAddress,
                coordinates: geo.coordinates,
                formattedAddress: geo.formattedAddress,
                nearestStore: geo.nearestStore,
              };
              setAddress(enriched);
              setSavedAddress(enriched);
            }
          })
          .catch(() => {});
      }
    }
    // Only run once on mount to seed from a previously saved address.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (hydrated && items.length === 0) {
      router.replace("/cart");
    }
  }, [hydrated, items.length, router]);

  if (!hydrated || items.length === 0 || !isLoggedIn) {
    return null;
  }

  function handleSaveAddress(values) {
    setAddress(values);
    setSavedAddress(values);
    setForceEditAddress(false);
    showToast("Đã lưu địa chỉ giao hàng.");
  }

  function handleContinue() {
    if (!address) {
      showToast("Vui lòng nhập địa chỉ giao hàng.");
      setForceEditAddress(true);
      return;
    }
    router.push("/checkout/payment");
  }

  return (
    <div className="container section">
      <nav className="breadcrumb" style={{ marginBottom: 20 }} aria-label="Breadcrumb">
        <Link href="/">Home</Link>
        <span>/</span>
        <Link href="/cart">Cart</Link>
        <span>/</span>
        <span className="breadcrumb-current">Checkout</span>
      </nav>

      <h1 className="section-title" style={{ marginBottom: 8 }}>
        CHECKOUT
      </h1>

      <CheckoutHeader activeStep="checkout" />

      <div className="checkout-layout">
        <div className="checkout-main">
          <section className="checkout-section">
            <h2 className="checkout-section-title">Shipping Address</h2>
            {!showAddressForm ? (
              <AddressCard address={address} onEdit={() => setForceEditAddress(true)} />
            ) : (
              <AddressForm
                initialValues={address || {}}
                onSave={handleSaveAddress}
                onCancel={address ? () => setForceEditAddress(false) : undefined}
              />
            )}
          </section>

          <section className="checkout-section">
            <h2 className="checkout-section-title">Delivery Method</h2>
            <DeliveryMethod value={shippingMethod} onChange={setShippingMethod} />
          </section>

          <section className="checkout-section">
            <h2 className="checkout-section-title">Order Note (optional)</h2>
            <textarea
              className="input"
              rows={3}
              style={{ width: "100%", resize: "vertical" }}
              placeholder="Ghi chú cho đơn hàng (tuỳ chọn)"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </section>

          <section className="checkout-section">
            <h2 className="checkout-section-title">Order Items</h2>
            <CheckoutItems items={items} />
          </section>
        </div>

        <div>
          <CheckoutSummary subtotal={subtotal} shippingMethod={shippingMethod} discount={discount} onContinue={handleContinue} />
        </div>
      </div>

      <style>{`
        .checkout-layout {
          display: grid;
          grid-template-columns: 1fr 380px;
          gap: 48px;
          align-items: start;
        }
        .checkout-section {
          padding-bottom: 32px;
          margin-bottom: 32px;
          border-bottom: 1px solid var(--color-border);
        }
        .checkout-section:last-child {
          border-bottom: none;
        }
        .checkout-section-title {
          font-size: 15px;
          letter-spacing: 0.04em;
          margin-bottom: 16px;
        }
        .checkout-section-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }
        .field-error {
          font-size: 12px;
          color: var(--color-error);
        }
        @media (max-width: 1023px) {
          .checkout-layout { grid-template-columns: 1fr; }
        }
        @media (max-width: 640px) {
          .checkout-section-grid { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  );
}

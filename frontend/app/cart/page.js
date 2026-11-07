"use client";

import Link from "next/link";
import CartItem from "@/components/cart/CartItem";
import CartSummary from "@/components/cart/CartSummary";
import EmptyCart from "@/components/cart/EmptyCart";
import { useCart } from "@/context/CartContext";

export default function CartPage() {
  const { items, subtotal, itemCount } = useCart();

  if (items.length === 0) {
    return (
      <div className="container section">
        <nav className="breadcrumb" style={{ marginBottom: 20 }} aria-label="Breadcrumb">
          <Link href="/">Home</Link>
          <span>/</span>
          <span className="breadcrumb-current">Cart</span>
        </nav>
        <EmptyCart />
      </div>
    );
  }

  return (
    <div className="container section">
      <nav className="breadcrumb" style={{ marginBottom: 20 }} aria-label="Breadcrumb">
        <Link href="/">Home</Link>
        <span>/</span>
        <span className="breadcrumb-current">Cart</span>
      </nav>

      <h1 className="section-title" style={{ marginBottom: 4 }}>
        YOUR BAG
      </h1>
      <p style={{ color: "var(--color-text-secondary)", marginBottom: 32 }}>
        {itemCount} {itemCount === 1 ? "item" : "items"}
      </p>

      <div className="cart-layout">
        <div>
          <div className="cart-table-head">
            <span>Product</span>
            <span>Price</span>
            <span>Quantity</span>
            <span>Total</span>
          </div>
          {items.map((item) => (
            <CartItem key={item.lineId} item={item} />
          ))}
        </div>

        <CartSummary subtotal={subtotal} />
      </div>

      <style>{`
        .cart-layout {
          display: grid;
          grid-template-columns: 2fr 1fr;
          gap: 48px;
          align-items: start;
        }
        .cart-table-head {
          display: grid;
          grid-template-columns: 88px 2fr 1fr 1fr 1fr;
          gap: 16px;
          padding-bottom: 12px;
          border-bottom: 1px solid var(--color-border);
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          color: var(--color-text-secondary);
        }
        .cart-table-head span:first-child { grid-column: span 2; }
        @media (max-width: 1023px) {
          .cart-layout { grid-template-columns: 1fr; }
        }
        @media (max-width: 767px) {
          .cart-table-head { display: none; }
        }
      `}</style>
    </div>
  );
}

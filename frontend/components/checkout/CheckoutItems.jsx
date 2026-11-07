import Link from "next/link";
import CartItem from "@/components/cart/CartItem";

export default function CheckoutItems({ items }) {
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <span style={{ fontSize: 13, color: "var(--color-text-secondary)" }}>
          {items.length} {items.length === 1 ? "item" : "items"}
        </span>
        <Link href="/cart" className="text-link" style={{ borderBottom: "none" }}>
          Edit Bag
        </Link>
      </div>
      <div>
        {items.map((item) => (
          <CartItem key={item.lineId} item={item} editable={false} />
        ))}
      </div>
    </div>
  );
}

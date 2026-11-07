"use client";

export default function AddressCard({ address, onEdit }) {
  if (!address) return null;

  const nearest = address.nearestStore;

  return (
    <div className="address-card">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
        <label className="address-card-radio">
          <input type="radio" name="address-choice" defaultChecked readOnly />
          <span style={{ fontWeight: 600 }}>Địa chỉ nhận hàng (Đã định vị)</span>
        </label>

        <button
          type="button"
          className="text-link"
          style={{ borderBottom: "none", fontSize: 13, cursor: "pointer", color: "var(--color-primary)" }}
          onClick={onEdit}
        >
          Thay đổi
        </button>
      </div>

      <div className="address-card-body">
        <p style={{ fontWeight: 600, fontSize: 15, marginBottom: 4 }}>
          {address.name} <span style={{ fontWeight: 400, color: "var(--color-text-secondary)", fontSize: 14 }}>| {address.phone}</span>
        </p>
        <p style={{ color: "var(--color-text)", fontSize: 14, lineHeight: 1.6 }}>
          {address.address}
          {address.ward ? `, ${address.ward}` : ""}
          {address.district ? `, ${address.district}` : ""}
          {address.city ? `, ${address.city}` : ""}
        </p>

        {nearest && (
          <div className="nearest-store-badge">
            <span style={{ fontSize: 14 }}>📍</span>
            <div>
              <span style={{ fontWeight: 600, color: "#166534" }}>Showroom gần nhất: {nearest.name}</span>
              <span style={{ color: "#15803d", marginLeft: 8 }}>
                (~{nearest.distanceKm} km {nearest.distanceKm < 30 ? "• Hỗ trợ Hỏa Tốc" : "• Chỉ hỗ trợ Viettel Post"})
              </span>
            </div>
          </div>
        )}
      </div>

      <style>{`
        .address-card {
          border: 1px solid var(--color-border);
          border-radius: var(--radius-md);
          padding: 20px;
          background: #fff;
        }
        .address-card-radio {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 14px;
        }
        .address-card-body {
          margin-bottom: 4px;
        }
        .nearest-store-badge {
          margin-top: 12px;
          padding: 8px 12px;
          background: #f0fdf4;
          border: 1px solid #bbf7d0;
          border-radius: 6px;
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
        }
      `}</style>
    </div>
  );
}

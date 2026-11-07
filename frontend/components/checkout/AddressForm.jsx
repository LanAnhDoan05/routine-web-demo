"use client";

import { useState } from "react";
import { validateAddressForm, isFormValid } from "@/lib/validators";
import { checkAddressApi } from "@/lib/shippingService";
import { useToast } from "@/components/common/Toast";

const emptyValues = { name: "", phone: "", address: "", city: "", district: "", ward: "" };

export default function AddressForm({ initialValues, onSave, onCancel }) {
  const [values, setValues] = useState({ ...emptyValues, ...initialValues });
  const [errors, setErrors] = useState({});
  const [isValidating, setIsValidating] = useState(false);
  const [mapError, setMapError] = useState("");
  const { showToast } = useToast();

  function update(field, value) {
    setValues((prev) => ({ ...prev, [field]: value }));
    setMapError(""); // Clear map error when user types
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setMapError("");

    // Validate form fields
    const nextErrors = validateAddressForm({ ...values, email: "placeholder@ok.com" });
    setErrors(nextErrors);
    if (!isFormValid(nextErrors)) {
      return;
    }

    setIsValidating(true);
    try {
      // Gọi API kiểm tra địa chỉ qua Google Maps / Geocoding
      const geoResult = await checkAddressApi({
        address: values.address,
        ward: values.ward,
        district: values.district,
        city: values.city,
      });

      if (!geoResult || !geoResult.valid) {
        setMapError(
          geoResult?.message ||
            "Khu vực Phường/Xã, Quận/Huyện hoặc Tỉnh/Thành phố không thể định vị. Vui lòng kiểm tra lại."
        );
        showToast("Khu vực Phường/Xã, Quận/Huyện không hợp lệ. Vui lòng kiểm tra lại.");
        return;
      }

      // Địa chỉ hợp lệ -> Lưu kèm thông tin tọa độ & Showroom Routine gần nhất
      const enrichedValues = {
        ...values,
        coordinates: geoResult.coordinates,
        formattedAddress: geoResult.formattedAddress,
        nearestStore: geoResult.nearestStore,
      };

      if (geoResult.nearestStore) {
        showToast(
          `✓ Đã định vị thành công! Showroom gần nhất: ${geoResult.nearestStore.name} (~${geoResult.nearestStore.distanceKm} km)`
        );
      } else {
        showToast("✓ Đã xác thực địa chỉ giao hàng thành công.");
      }

      onSave(enrichedValues);
    } catch (err) {
      console.error("Geocoding validation error:", err);
      setMapError("Không thể kết nối đến hệ thống định vị bản đồ. Vui lòng thử lại.");
    } finally {
      setIsValidating(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="address-form">
      {mapError && (
        <div className="map-error-banner" role="alert">
          <span style={{ fontSize: 18 }}>📍</span>
          <div>
            <strong style={{ display: "block", marginBottom: 2 }}>Địa chỉ không hợp lệ:</strong>
            <span>{mapError}</span>
          </div>
        </div>
      )}

      <div className="address-form-grid">
        <div className="field">
          <label htmlFor="addr-name">Họ và tên *</label>
          <input
            id="addr-name"
            className="input"
            value={values.name}
            onChange={(e) => update("name", e.target.value)}
            placeholder="Ví dụ: Nguyễn Văn A"
            disabled={isValidating}
          />
          {errors.name && <span className="field-error">{errors.name}</span>}
        </div>

        <div className="field">
          <label htmlFor="addr-phone">Số điện thoại *</label>
          <input
            id="addr-phone"
            className="input"
            value={values.phone}
            onChange={(e) => update("phone", e.target.value)}
            placeholder="0912345678"
            disabled={isValidating}
          />
          {errors.phone && <span className="field-error">{errors.phone}</span>}
        </div>

        <div className="field address-form-full">
          <label htmlFor="addr-address">
            Địa chỉ chi tiết (Số nhà, tên đường...) *
          </label>
          <input
            id="addr-address"
            className="input"
            value={values.address}
            onChange={(e) => update("address", e.target.value)}
            placeholder="Ví dụ: 35 Lê Lợi hoặc 123 Nguyễn Thị Minh Khai..."
            disabled={isValidating}
          />
          {errors.address && <span className="field-error">{errors.address}</span>}
          <span style={{ fontSize: 12, color: "var(--color-text-secondary)", marginTop: 4, display: "block" }}>
            * Hệ thống sẽ tự động xác thực địa chỉ này qua bản đồ Google Maps và tìm cửa hàng Routine gần nhất.
          </span>
        </div>

        <div className="field">
          <label htmlFor="addr-city">Tỉnh / Thành phố *</label>
          <input
            id="addr-city"
            className="input"
            value={values.city}
            onChange={(e) => update("city", e.target.value)}
            placeholder="Ví dụ: TP. Hồ Chí Minh, Hà Nội..."
            disabled={isValidating}
          />
          {errors.city && <span className="field-error">{errors.city}</span>}
        </div>

        <div className="field">
          <label htmlFor="addr-district">Quận / Huyện *</label>
          <input
            id="addr-district"
            className="input"
            value={values.district}
            onChange={(e) => update("district", e.target.value)}
            placeholder="Ví dụ: Quận 1, Đống Đa, Cầu Giấy..."
            disabled={isValidating}
          />
          {errors.district && <span className="field-error">{errors.district}</span>}
        </div>

        <div className="field">
          <label htmlFor="addr-ward">Phường / Xã</label>
          <input
            id="addr-ward"
            className="input"
            value={values.ward}
            onChange={(e) => update("ward", e.target.value)}
            placeholder="Ví dụ: Phường Bến Nghé..."
            disabled={isValidating}
          />
          {errors.ward && <span className="field-error">{errors.ward}</span>}
        </div>
      </div>

      <div style={{ display: "flex", gap: 12, marginTop: 24, alignItems: "center" }}>
        <button
          type="submit"
          className="btn btn-primary"
          disabled={isValidating}
          style={{ minWidth: 160 }}
        >
          {isValidating ? "Đang định vị..." : onCancel ? "Xác nhận & Lưu địa chỉ" : "+ Thêm địa chỉ"}
        </button>
        {onCancel && (
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onCancel}
            disabled={isValidating}
          >
            Hủy
          </button>
        )}
      </div>

      <style>{`
        .address-form-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }
        .address-form-full { grid-column: span 2; }
        .field-error {
          font-size: 12px;
          color: var(--color-error);
          margin-top: 4px;
        }
        .map-error-banner {
          background: #fef2f2;
          border: 1px solid #fecaca;
          color: #991b1b;
          padding: 12px 16px;
          border-radius: var(--radius-sm, 6px);
          margin-bottom: 20px;
          display: flex;
          align-items: flex-start;
          gap: 12px;
          font-size: 13.5px;
          line-height: 1.5;
          animation: shake 0.3s ease-in-out;
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-4px); }
          75% { transform: translateX(4px); }
        }
        @media (max-width: 640px) {
          .address-form-grid { grid-template-columns: 1fr; }
          .address-form-full { grid-column: span 1; }
        }
      `}</style>
    </form>
  );
}

"use client";

import { useState } from "react";

export default function VNPayTestCredentials() {
  const [copiedKey, setCopiedKey] = useState(null);

  const credentials = [
    { label: "Ngân hàng", value: "NCB", key: "bank" },
    { label: "Số thẻ", value: "9704198526191432198", key: "card" },
    { label: "Tên chủ thẻ", value: "NGUYEN VAN A", key: "name" },
    { label: "Ngày phát hành", value: "07/15", key: "date" },
    { label: "Mật khẩu OTP", value: "123456", key: "otp" },
  ];

  const handleCopy = (key, text) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2000);
    }
  };

  return (
    <div className="vnpay-sandbox-card">
      <div className="vnpay-header">
        <div className="vnpay-badge">VNPay Sandbox Mode</div>
        <span className="vnpay-title">Thông tin thẻ thử nghiệm chính thức</span>
      </div>
      <p className="vnpay-desc">
        Hệ thống đang kết nối môi trường Sandbox của VNPay. Bạn có thể sử dụng thông tin thẻ dưới đây để hoàn tất thanh toán mà không tốn phí thực tế:
      </p>

      <div className="vnpay-grid">
        {credentials.map((item) => (
          <div key={item.key} className="vnpay-item">
            <div className="vnpay-item-label">{item.label}</div>
            <div className="vnpay-item-value-row">
              <span className="vnpay-item-value">{item.value}</span>
              <button
                type="button"
                className="vnpay-copy-btn"
                onClick={() => handleCopy(item.key, item.value)}
                title="Sao chép"
              >
                {copiedKey === item.key ? "✓ Đã chép" : "Sao chép"}
              </button>
            </div>
          </div>
        ))}
      </div>

      <style jsx>{`
        .vnpay-sandbox-card {
          margin-top: 16px;
          padding: 16px 18px;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: var(--radius-md, 8px);
          font-size: 13px;
        }
        .vnpay-header {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 8px;
        }
        .vnpay-badge {
          background: #0066cc;
          color: #ffffff;
          padding: 2px 8px;
          border-radius: 4px;
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .vnpay-title {
          font-weight: 600;
          color: var(--color-text, #1e293b);
        }
        .vnpay-desc {
          color: var(--color-text-secondary, #64748b);
          margin-bottom: 12px;
          line-height: 1.5;
        }
        .vnpay-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
          gap: 10px;
        }
        .vnpay-item {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 6px;
          padding: 8px 12px;
        }
        .vnpay-item-label {
          font-size: 11px;
          color: #64748b;
          margin-bottom: 4px;
        }
        .vnpay-item-value-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 6px;
        }
        .vnpay-item-value {
          font-family: monospace;
          font-weight: 600;
          color: #0f172a;
          word-break: break-all;
        }
        .vnpay-copy-btn {
          background: #f1f5f9;
          border: 1px solid #cbd5e1;
          color: #334155;
          padding: 2px 6px;
          border-radius: 4px;
          font-size: 11px;
          cursor: pointer;
          white-space: nowrap;
          transition: background 0.15s ease;
        }
        .vnpay-copy-btn:hover {
          background: #e2e8f0;
        }
      `}</style>
    </div>
  );
}

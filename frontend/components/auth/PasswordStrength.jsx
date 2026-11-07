import styles from "./PasswordStrength.module.css";

const CHECK_ITEMS = [
  { key: "minLength", label: "Ít nhất 8 ký tự" },
  { key: "hasLetter", label: "Có chữ cái" },
  { key: "hasNumber", label: "Có số" },
  { key: "noWhitespace", label: "Không chứa khoảng trắng" },
];

const STRENGTH_META = {
  weak: { label: "Yếu", bars: 1, barClass: styles.barFilledWeak, labelClass: styles.labelWeak },
  medium: {
    label: "Trung bình",
    bars: 2,
    barClass: styles.barFilledMedium,
    labelClass: styles.labelMedium,
  },
  strong: {
    label: "Mạnh",
    bars: 3,
    barClass: styles.barFilledStrong,
    labelClass: styles.labelStrong,
  },
};

function CheckMark() {
  return (
    <svg width="8" height="8" viewBox="0 0 8 8" fill="none" aria-hidden="true">
      <path
        d="M1.2 4.2L3 6L6.8 2"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * `checklist` đến từ `validatePassword()`. `strength` (tùy chọn) đến từ
 * `getPasswordStrength()` — chỉ truyền vào ở màn hình Đặt lại mật khẩu,
 * còn màn hình Đăng ký chỉ cần checklist.
 */
export default function PasswordStrength({ checklist, strength }) {
  const meta = strength ? STRENGTH_META[strength] : null;

  return (
    <div className={styles.wrap}>
      {meta && (
        <div className={styles.strengthRow}>
          <div className={styles.bars} role="presentation">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className={`${styles.bar} ${i < meta.bars ? meta.barClass : ""}`}
              />
            ))}
          </div>
          <span className={`${styles.strengthLabel} ${meta.labelClass}`}>
            {meta.label}
          </span>
        </div>
      )}

      <ul className={styles.checklist}>
        {CHECK_ITEMS.map((item) => {
          const met = Boolean(checklist?.[item.key]);
          return (
            <li
              key={item.key}
              className={`${styles.checkItem} ${met ? styles.checkItemMet : ""}`}
            >
              <span className={`${styles.checkIcon} ${met ? styles.checkIconMet : ""}`}>
                {met && <CheckMark />}
              </span>
              {item.label}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

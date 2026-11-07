/**
 * Validation helpers dùng chung cho toàn bộ nhóm Authentication.
 * Mỗi hàm trả về { valid: boolean, message: string } để component
 * chỉ cần hiển thị `message` khi `valid === false` và user đã tương
 * tác với field (touched).
 */

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validatePhone(value) {
  const phone = (value || "").trim();

  if (!phone) {
    return { valid: false, message: "Vui lòng nhập số điện thoại." };
  }
  return { valid: true, message: "" };
}

export function validateEmail(value) {
  const email = (value || "").trim();

  if (!email) {
    return { valid: false, message: "Vui lòng nhập email." };
  }
  if (!EMAIL_REGEX.test(email)) {
    return { valid: false, message: "Email không đúng định dạng." };
  }
  return { valid: true, message: "" };
}

export function validateDateOfBirth(value, required = false) {
  const dateStr = (value || "").trim();

  if (!dateStr) {
    if (required) {
      return { valid: false, message: "Vui lòng chọn ngày tháng năm sinh." };
    }
    return { valid: true, message: "" };
  }

  const date = new Date(dateStr);
  if (isNaN(date.getTime())) {
    return { valid: false, message: "Ngày sinh không hợp lệ." };
  }

  const today = new Date();
  if (date > today) {
    return { valid: false, message: "Ngày sinh không được ở tương lai." };
  }

  if (date.getFullYear() < 1920) {
    return { valid: false, message: "Vui lòng chọn năm sinh hợp lệ (sau năm 1920)." };
  }

  return { valid: true, message: "" };
}

/**
 * Trả thêm `checklist` để các màn hình (Đăng ký, Đặt lại mật khẩu) render
 * danh sách yêu cầu mật khẩu theo thời gian thực.
 */
export function validatePassword(value) {
  const password = value || "";

  const checklist = {
    minLength: password.length >= 8,
    hasLetter: /[a-zA-ZÀ-ỹ]/.test(password),
    hasNumber: /[0-9]/.test(password),
    noWhitespace: password.length > 0 && !/\s/.test(password),
  };

  const valid = Object.values(checklist).every(Boolean);

  let message = "";
  if (!password) {
    message = "Vui lòng nhập mật khẩu.";
  } else if (!valid) {
    message = "Mật khẩu chưa đáp ứng đủ yêu cầu bên dưới.";
  }

  return { valid, message, checklist };
}

export function validateConfirmPassword(password, confirmPassword) {
  if (!confirmPassword) {
    return { valid: false, message: "Vui lòng nhập lại mật khẩu." };
  }
  if (password !== confirmPassword) {
    return { valid: false, message: "Mật khẩu xác nhận không khớp." };
  }
  return { valid: true, message: "" };
}

export function validateOtp(value, length = 6) {
  const otp = value || "";

  if (otp.length === 0) {
    return { valid: false, message: "Vui lòng nhập mã OTP." };
  }
  if (otp.length < length || !/^[0-9]+$/.test(otp)) {
    return { valid: false, message: "Mã OTP phải gồm đủ 6 chữ số." };
  }
  return { valid: true, message: "" };
}

/**
 * Ước lượng độ mạnh mật khẩu cho màn hình Đặt lại mật khẩu.
 * Trả về "empty" | "weak" | "medium" | "strong".
 */
export function getPasswordStrength(password) {
  if (!password) return "empty";

  let score = 0;
  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;
  if (/[0-9]/.test(password)) score += 1;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score += 1;
  if (/[^a-zA-Z0-9\s]/.test(password)) score += 1;

  if (score <= 1) return "weak";
  if (score <= 3) return "medium";
  return "strong";
}

/** Che số điện thoại, chỉ hiển thị 4 số cuối, ví dụ ******1234. */
export function maskPhone(phone) {
  const digits = (phone || "").replace(/[^0-9]/g, "");
  if (digits.length < 4) return phone || "";
  const last4 = digits.slice(-4);
  return `${"*".repeat(Math.max(digits.length - 4, 6))}${last4}`;
}

/** Che email, ví dụ ng***@gmail.com */
export function maskEmail(email) {
  if (!email || !email.includes("@")) return email || "";
  const [user, domain] = email.split("@");
  if (user.length <= 2) return `${user}***@${domain}`;
  return `${user.slice(0, 2)}***@${domain}`;
}

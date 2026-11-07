/**
 * Mock Auth Service
 * -------------------------------------------------------------------------
 * Hỗ trợ các chức năng đăng nhập, đăng ký, xác thực OTP.
 * Các hàm trả về Promise mô phỏng độ trễ mạng để chuẩn bị sẵn
 * thay thế bằng API backend (`/api/v1/auth/...`).
 */

const NETWORK_DELAY = 800;

function delay(ms = NETWORK_DELAY) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

import { fetchApi } from "./api";
import { getStoredAttribution } from "./attribution";

// Mapping email sang số điện thoại trong DB để đăng nhập linh hoạt bằng cả 2 cách
const EMAIL_TO_PHONE = {
  "admin@routine.vn": "0999999999",
  "admin": "0999999999",
  "nguyenvana@gmail.com": "0123456789",
  "bichngoc.tran@gmail.com": "0987654321",
  "hoanglong.le@gmail.com": "0912345678",
  "minhtrang.pham@gmail.com": "0933456789",
  "thang.vu@gmail.com": "0944567890",
};

/**
 * Đăng nhập bằng số điện thoại hoặc email và mật khẩu.
 * @param {string} identifier (phone hoặc email)
 * @param {string} password
 * @returns {Promise<{ success: boolean, message: string, user?: object, token?: string }>}
 */
export async function loginWithPassword(identifier, password) {
  const id = (identifier || "").trim();
  if (!id || !password) {
    return { success: false, message: "Vui lòng nhập đầy đủ tài khoản và mật khẩu." };
  }

  if (password.length < 6) {
    return { success: false, message: "Mật khẩu phải có ít nhất 6 ký tự." };
  }

  const phoneParam = EMAIL_TO_PHONE[id.toLowerCase()] || id;

  try {
    const data = await fetchApi("/auth/login", {
      method: "POST",
      body: JSON.stringify({
        phoneNumber: phoneParam,
        email: id,
        password,
      }),
    });

    if (data && data.user) {
      if (typeof window !== "undefined" && data.token) {
        window.localStorage.setItem("routine_token", data.token);
      }
      return {
        success: true,
        message: "Đăng nhập thành công.",
        user: {
          ...data.user,
          name: data.user.fullName || data.user.name || "Khách hàng",
          role: data.user.role || "CUSTOMER",
          stylePreference: data.user.stylePreference || "minimal",
        },
        token: data.token,
      };
    }
  } catch (err) {
    console.warn("[authService] Backend login error:", err.message);

    return {
      success: false,
      message: err.message || "Không thể kết nối máy chủ đăng nhập. Vui lòng khởi động backend và thử lại.",
    };
  }

  return { success: false, message: "Không thể đăng nhập. Vui lòng thử lại." };
}

/**
 * Kiểm tra xem Email hoặc Số điện thoại đã được đăng ký trước chưa.
 * @param {{ email?: string, phone?: string }} params
 * @returns {Promise<{ success: boolean, exists: boolean, phoneExists: boolean, emailExists: boolean, message: string }>}
 */
export async function checkExistence({ email, phone }) {
  try {
    const data = await fetchApi("/auth/check-existence", {
      method: "POST",
      body: JSON.stringify({ email, phoneNumber: phone }),
    });

    return {
      success: true,
      exists: Boolean(data?.exists),
      phoneExists: Boolean(data?.phoneExists),
      emailExists: Boolean(data?.emailExists),
      message: data?.message || "",
    };
  } catch (err) {
    return {
      success: false,
      exists: false,
      phoneExists: false,
      emailExists: false,
      message: err.message || "Không thể kiểm tra thông tin tài khoản.",
    };
  }
}

/**
 * Gửi mã OTP tới email hoặc số điện thoại (Đăng ký / Quên mật khẩu).
 * @param {string} identifier (phone hoặc email)
 * @param {string|null} flow ('register' | 'forgot_password')
 * @param {string|null} secondary (phone hoặc email bổ trợ)
 * @returns {Promise<{ success: boolean, message: string, data?: any }>}
 */
export async function sendOtp(identifier, flow = null, secondary = null) {
  if (!identifier) {
    return { success: false, message: "Vui lòng nhập email hoặc số điện thoại." };
  }

  try {
    const isEmail = identifier.includes("@");
    const payload = {
      identifier: identifier.trim(),
      flow: flow || undefined,
      ...(isEmail ? { email: identifier.trim() } : { phoneNumber: identifier.trim() }),
      ...(secondary ? (secondary.includes("@") ? { email: secondary.trim() } : { phoneNumber: secondary.trim() }) : {}),
    };

    const data = await fetchApi("/auth/send-otp", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    return {
      success: true,
      message: data?.message || "Mã OTP đã được gửi thành công.",
      data,
    };
  } catch (err) {
    return {
      success: false,
      message: err.message || "Không thể gửi mã OTP. Vui lòng thử lại.",
    };
  }
}

/**
 * Xác thực mã OTP.
 * @param {string} identifier
 * @param {string} otp
 * @returns {Promise<{ success: boolean, resetToken?: string, message: string }>}
 */
export async function verifyOtp(identifier, otp) {
  if (!identifier || !otp) {
    return { success: false, message: "Vui lòng nhập đầy đủ thông tin và mã OTP." };
  }

  try {
    const data = await fetchApi("/auth/verify-otp", {
      method: "POST",
      body: JSON.stringify({ identifier, otp }),
    });

    if (typeof window !== "undefined" && data?.resetToken) {
      window.sessionStorage.setItem("routine_reset_token", data.resetToken);
    }

    return {
      success: true,
      resetToken: data?.resetToken,
      message: data?.message || "Xác thực OTP thành công.",
    };
  } catch (err) {
    return {
      success: false,
      message: err.message || "Mã OTP không chính xác hoặc đã hết hạn.",
    };
  }
}

/**
 * Tạo tài khoản mới.
 * @param {{ name: string, phone: string, email: string, password: string, selectedStyles: string[] }} userData
 * @returns {Promise<{ success: boolean, message: string }>}
 */
export async function register(userData) {
  try {
    const attribution = getStoredAttribution();
    const source = attribution?.platform || "ORGANIC";

    const data = await fetchApi("/auth/register", {
      method: "POST",
      body: JSON.stringify({
        fullName: userData.name || userData.fullName,
        phoneNumber: userData.phone || userData.phoneNumber,
        email: userData.email,
        password: userData.password,
        gender: userData.gender || "unisex",
        dateOfBirth: userData.dateOfBirth || userData.date || null,
        date: userData.date || userData.dateOfBirth || null,
        stylePreference: Array.isArray(userData.selectedStyles) && userData.selectedStyles.length > 0 ? userData.selectedStyles[0] : "minimal",
        source,
      }),
    });

    if (data?.token && typeof window !== "undefined") {
      window.localStorage.setItem("routine_token", data.token);
    }

    return {
      success: true,
      message: "Tạo tài khoản thành công.",
      data,
    };
  } catch (err) {
    return {
      success: false,
      message: err.message || "Không thể tạo tài khoản. Vui lòng thử lại.",
    };
  }
}

/**
 * Đặt lại mật khẩu mới cho tài khoản.
 * @param {string} identifier
 * @param {string} password
 * @param {string} resetToken
 * @returns {Promise<{ success: boolean, message: string }>}
 */
export async function resetPassword(identifier, password, resetToken = null) {
  if (!password || password.length < 6) {
    return { success: false, message: "Mật khẩu mới phải có tối thiểu 6 ký tự." };
  }

  const token =
    resetToken ||
    (typeof window !== "undefined" ? window.sessionStorage.getItem("routine_reset_token") : null);

  try {
    const data = await fetchApi("/auth/reset-password", {
      method: "POST",
      body: JSON.stringify({
        resetToken: token,
        identifier,
        newPassword: password,
      }),
    });

    if (typeof window !== "undefined") {
      window.sessionStorage.removeItem("routine_reset_token");
    }

    return {
      success: true,
      message: data?.message || "Đặt lại mật khẩu thành công. Vui lòng đăng nhập lại.",
    };
  } catch (err) {
    return {
      success: false,
      message: err.message || "Không thể đặt lại mật khẩu. Vui lòng thử lại.",
    };
  }
}

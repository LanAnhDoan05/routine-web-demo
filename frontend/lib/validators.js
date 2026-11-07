// Small, dependency-free validators used by the Checkout address form.
// Kept separate from any Authentication-phase validation utilities
// so this feature doesn't need to touch that code.

export function isValidVietnamesePhone(value) {
  if (!value) return false;
  const clean = value.toString().trim().replace(/[\s.-]/g, "");
  return /^(0|\+84|84)(3|5|7|8|9)[0-9]{8}$/.test(clean);
}

export function isValidEmail(value) {
  if (!value) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

export function isNonEmpty(value) {
  return Boolean(value && value.trim().length > 0);
}

export function validateAddressForm(values) {
  const errors = {};
  if (!isNonEmpty(values.name)) errors.name = "Vui lòng nhập họ và tên.";
  if (!isValidVietnamesePhone(values.phone)) errors.phone = "Số điện thoại không hợp lệ.";
  if (!isValidEmail(values.email)) errors.email = "Email không hợp lệ.";
  if (!isNonEmpty(values.address)) errors.address = "Vui lòng nhập địa chỉ.";
  if (!isNonEmpty(values.city)) errors.city = "Vui lòng chọn tỉnh/thành phố.";
  if (!isNonEmpty(values.district)) errors.district = "Vui lòng nhập quận/huyện.";
  if (!isNonEmpty(values.ward)) errors.ward = "Vui lòng nhập phường/xã.";
  return errors;
}

export function isFormValid(errors) {
  return Object.keys(errors).length === 0;
}

// Lớp lưu trữ mock dùng localStorage để mô phỏng persistence ở phía client.
// KHÔNG lưu bất kỳ thông tin nhạy cảm nào (mật khẩu, token...) ở đây.
// Khi có backend thật, chỉ cần thay các service trong `lib/` bằng lời gọi API
// tương ứng — các component sẽ không cần thay đổi vì đều nhận Promise.

const memoryFallback = new Map();

function isBrowser() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

export function readStore(key, seedValue) {
  if (!isBrowser()) {
    if (!memoryFallback.has(key)) memoryFallback.set(key, clone(seedValue));
    return memoryFallback.get(key);
  }
  const raw = window.localStorage.getItem(key);
  if (raw === null) {
    const seeded = clone(seedValue);
    window.localStorage.setItem(key, JSON.stringify(seeded));
    return seeded;
  }
  try {
    return JSON.parse(raw);
  } catch (err) {
    const seeded = clone(seedValue);
    window.localStorage.setItem(key, JSON.stringify(seeded));
    return seeded;
  }
}

export function writeStore(key, value) {
  if (!isBrowser()) {
    memoryFallback.set(key, clone(value));
    return;
  }
  window.localStorage.setItem(key, JSON.stringify(value));
}

export function resetStore(key) {
  if (!isBrowser()) {
    memoryFallback.delete(key);
    return;
  }
  window.localStorage.removeItem(key);
}

function clone(value) {
  return typeof structuredClone === "function" ? structuredClone(value) : JSON.parse(JSON.stringify(value));
}

export function delay(ms = 250) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function generateId(prefix) {
  return `${prefix}-${Date.now().toString(36)}${Math.floor(Math.random() * 1000)}`;
}

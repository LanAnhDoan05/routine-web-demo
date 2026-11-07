import { stockStatus } from "@/data/products";
import { fetchApi } from "./api";

function matchesFilters(product, filters) {
  const { search, categoryId, gender, styleId, status, stock } = filters || {};

  if (search) {
    const needle = search.trim().toLowerCase();
    const nameMatch = product.name?.toLowerCase().includes(needle);
    const skuMatch = product.variants?.some((v) => v.sku?.toLowerCase().includes(needle));
    if (!nameMatch && !skuMatch) return false;
  }

  const prodCat = product.categoryId || product.category;
  if (categoryId && categoryId !== "ALL" && prodCat !== categoryId) return false;

  const prodGender = (product.gender || "").toUpperCase();
  if (gender && gender !== "ALL" && prodGender !== gender.toUpperCase()) return false;

  const prodStyles = product.styleIds || (Array.isArray(product.style) ? product.style : [product.style].filter(Boolean));
  if (styleId && styleId !== "ALL" && !prodStyles.includes(styleId)) return false;

  if (status && status !== "ALL" && (product.status || "ACTIVE") !== status) return false;

  if (stock && stock !== "ALL") {
    const current = stockStatus(product);
    if (stock === "IN_STOCK" && current !== "IN_STOCK") return false;
    if (stock === "LOW_STOCK" && current !== "LOW_STOCK") return false;
    if (stock === "OUT_OF_STOCK" && current !== "OUT_OF_STOCK") return false;
  }

  return true;
}

export async function getProducts(filters = {}) {
  const data = await fetchApi('/products/admin/all?limit=1000&sort=newest');
  if (!data || !Array.isArray(data.items)) {
    throw new Error('Phản hồi danh sách sản phẩm không hợp lệ.');
  }
  return data.items.filter((product) => matchesFilters(product, filters));
}

export async function getProductById(id) {
  try {
    const data = await fetchApi(`/products/admin/${id}`);
    return data?.id ? data : null;
  } catch (err) {
    if (err.status === 404) return null;
    throw err;
  }
}

export async function isSkuTaken(sku, excludeProductId = null) {
  try {
    const query = excludeProductId
      ? `?sku=${encodeURIComponent(sku)}&excludeProductId=${excludeProductId}&excludeId=${excludeProductId}`
      : `?sku=${encodeURIComponent(sku)}`;
    const data = await fetchApi(`/products/check-sku${query}`);
    if (data && typeof data.isAvailable === 'boolean') {
      return !data.isAvailable;
    }
    throw new Error('Phản hồi kiểm tra SKU không hợp lệ.');
  } catch (err) {
    throw err;
  }
}

export async function createProduct(input) {
  const data = await fetchApi('/products', {
    method: 'POST',
    body: JSON.stringify(input),
  });
  if (!data?.id) {
    throw new Error('Backend không trả về sản phẩm đã tạo.');
  }
  return data;
}

export async function updateProduct(id, input) {
  const data = await fetchApi(`/products/${id}`, {
    method: 'PUT',
    body: JSON.stringify(input),
  });
  if (!data?.id) {
    throw new Error('Backend không trả về sản phẩm đã cập nhật.');
  }
  return data;
}

export async function deleteProduct(id) {
  return fetchApi(`/products/${id}`, { method: 'DELETE' });
}

export async function duplicateProduct(id) {
  const data = await fetchApi(`/products/${id}/duplicate`, { method: 'POST' });
  if (!data?.id) {
    throw new Error('Backend không trả về sản phẩm đã nhân bản.');
  }
  return data;
}

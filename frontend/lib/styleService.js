import { fetchApi } from "./api";

export async function getStyles() {
  const res = await fetchApi("/styles");
  return Array.isArray(res) ? res : (res?.data || []);
}

export async function getStyleById(id) {
  return await fetchApi(`/styles/${id}`);
}

export async function getStyleProductCounts() {
  return await fetchApi("/styles/counts");
}

export async function createStyle(input) {
  return await fetchApi("/styles", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function updateStyle(id, input) {
  return await fetchApi(`/styles/${id}`, {
    method: "PUT",
    body: JSON.stringify(input),
  });
}

export async function deleteStyle(id) {
  return await fetchApi(`/styles/${id}`, {
    method: "DELETE",
  });
}

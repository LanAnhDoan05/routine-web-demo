// orderService.js
// Data-access layer connecting frontend orders directly to Routine Backend REST API (MySQL).

import { fetchApi } from "./api";
import { getStoredAttribution } from "./attribution";

export async function fetchOrders() {
  try {
    const data = await fetchApi('/orders?limit=50');
    if (data && data.items) return data.items;
  } catch (err) {
    console.error('[orderService] fetchOrders failed:', err.message);
  }
  return [];
}

export async function fetchOrderById(id) {
  try {
    const data = await fetchApi(`/orders/${id}`);
    if (data && data.id) return data;
  } catch (err) {
    console.error(`[orderService] fetchOrderById ${id} failed:`, err.message);
  }
  return null;
}

export async function createOrder(orderInput) {
  try {
    const attribution = getStoredAttribution();
    const payload = {
      ...orderInput,
      attributionSource: orderInput.attributionSource || attribution?.platform || 'ORGANIC',
      campaign: orderInput.campaign || attribution?.campaign || null,
    };
    const data = await fetchApi('/orders', {
      method: 'POST',
      body: JSON.stringify(payload),
      timeout: 45000,
    });
    return data;
  } catch (err) {
    console.error('[orderService] createOrder failed:', err.message);
    throw err;
  }
}

export async function cancelOrder(id) {
  try {
    const data = await fetchApi(`/orders/${id}/cancel`, {
      method: 'PATCH',
    });
    return data;
  } catch (err) {
    console.error(`[orderService] cancelOrder ${id} failed:`, err.message);
    throw err;
  }
}

export async function reorder(id) {
  try {
    const data = await fetchApi(`/orders/${id}/reorder`, {
      method: 'POST',
    });
    return data;
  } catch (err) {
    console.error(`[orderService] reorder ${id} failed:`, err.message);
    throw err;
  }
}

export async function sendOrderInvoice(id, email = null) {
  try {
    const data = await fetchApi(`/orders/${id}/send-invoice`, {
      method: 'POST',
      body: JSON.stringify(email ? { email } : {}),
    });
    return data;
  } catch (err) {
    console.error(`[orderService] sendOrderInvoice ${id} failed:`, err.message);
    throw err;
  }
}

export function loadOrders() {
  return [];
}


export function getOrders() {
  return [];
}

export function getOrderById(id) {
  return null;
}

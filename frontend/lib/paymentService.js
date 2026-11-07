// paymentService.js
// Mock payment gateway interaction. No real gateway (VNPay/MoMo/card
// processor) is called — this only simulates the latency and
// success/failure shape a real integration would have, so the UI
// (loading state, error state) is already written correctly for
// when a real gateway is wired in later.
//
// NOTE: Card details are never persisted anywhere (not even in
// memory beyond this call) — see components/payment/CardPaymentForm.jsx.

export async function processPayment({ method, amount, cardDetails } = {}) {
  await new Promise((resolve) => setTimeout(resolve, 1200));

  if (method === "card") {
    const hasCardNumber = Boolean(cardDetails?.cardNumber?.replace(/\s/g, ""));
    const hasExpiry = Boolean(cardDetails?.expiry);
    const hasCvv = Boolean(cardDetails?.cvv);
    const hasName = Boolean(cardDetails?.cardHolder);

    if (!hasCardNumber || !hasExpiry || !hasCvv || !hasName) {
      return { success: false, error: "Thông tin thẻ chưa đầy đủ. Vui lòng kiểm tra lại." };
    }
  }

  // COD, VNPay and MoMo are treated as always-succeeding mocks since
  // there is no real gateway to fail against at this stage.
  return { success: true, transactionId: `MOCK-${Date.now()}`, amount };
}

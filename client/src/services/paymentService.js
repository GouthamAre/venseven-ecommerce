import { API_BASE_URL } from "./apiConfig";

/**
 * Dynamically loads the Razorpay Checkout JavaScript SDK safely.
 * Prevents multiple script injections.
 *
 * @returns {Promise<boolean>}
 */
export function loadRazorpaySDK() {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }

    const existingScript = document.querySelector(
      'script[src="https://checkout.razorpay.com/v1/checkout.js"]'
    );

    if (existingScript) {
      existingScript.addEventListener("load", () => resolve(true));
      existingScript.addEventListener("error", () => resolve(false));
      return;
    }

    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => {
      console.error("[Razorpay]: Failed to load Razorpay Checkout SDK.");
      resolve(false);
    };

    document.body.appendChild(script);
  });
}

/**
 * Request creation of a Razorpay Payment Order
 *
 * @param {string} orderNumber - VENSEVEN Order Number (e.g. V7-2026-000123)
 * @returns {Promise<{ success: boolean, razorpayOrderId: string, amount: number, currency: string, keyId: string, orderNumber: string }>}
 */
export async function createPaymentOrder(orderNumber) {
  const response = await fetch(`${API_BASE_URL}/payments/create-order`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ orderNumber }),
  });

  const data = await response.json().catch(() => ({
    success: false,
    message: "Failed to parse payment order response.",
  }));

  if (!response.ok) {
    const error = new Error(data.message || `Payment creation failed with status ${response.status}`);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

/**
 * Verify Razorpay payment signature with backend
 *
 * @param {object} paymentData - { orderNumber, razorpay_order_id, razorpay_payment_id, razorpay_signature }
 * @returns {Promise<{ success: boolean, message: string, order: object }>}
 */
export async function verifyPayment(paymentData) {
  const response = await fetch(`${API_BASE_URL}/payments/verify`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(paymentData),
  });

  const data = await response.json().catch(() => ({
    success: false,
    message: "Failed to parse payment verification response.",
  }));

  if (!response.ok) {
    const error = new Error(data.message || `Payment verification failed with status ${response.status}`);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

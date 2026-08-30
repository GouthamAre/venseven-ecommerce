const Razorpay = require("razorpay");

/**
 * Initializes and returns the Razorpay client instance.
 * Handles missing configuration gracefully in local development.
 */
function getRazorpayInstance() {
  const key_id = process.env.RAZORPAY_KEY_ID;
  const key_secret = process.env.RAZORPAY_KEY_SECRET;

  if (!key_id || !key_secret) {
    console.warn(
      "[Razorpay Warning]: RAZORPAY_KEY_ID or RAZORPAY_KEY_SECRET is not configured in server environment."
    );
    return null;
  }

  return new Razorpay({
    key_id,
    key_secret,
  });
}

function isRazorpayConfigured() {
  return Boolean(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET);
}

module.exports = {
  getRazorpayInstance,
  isRazorpayConfigured,
};

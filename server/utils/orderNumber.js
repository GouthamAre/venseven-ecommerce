const crypto = require("crypto");
const Order = require("../models/Order");

/**
 * Generates a human-readable, unique VENSEVEN order number.
 * Format: V7-YYYY-XXXXXX (e.g. V7-2026-894210)
 *
 * @returns {Promise<string>}
 */
async function generateOrderNumber() {
  const year = new Date().getFullYear();
  let isUnique = false;
  let orderNumber = "";
  let attempts = 0;

  while (!isUnique && attempts < 10) {
    attempts++;
    // Generate 6 random decimal digits (100000 - 999999)
    const randomBuffer = crypto.randomBytes(3);
    const randomNumber = (randomBuffer.readUIntBE(0, 3) % 900000) + 100000;
    orderNumber = `V7-${year}-${randomNumber}`;

    try {
      const existing = await Order.findOne({ orderNumber }).lean();
      if (!existing) {
        isUnique = true;
      }
    } catch {
      // If DB check fails or offline, use timestamp entropy fallback
      const timeComponent = Date.now().toString().slice(-6);
      orderNumber = `V7-${year}-${timeComponent}`;
      isUnique = true;
    }
  }

  return orderNumber;
}

module.exports = {
  generateOrderNumber,
};

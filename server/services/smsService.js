/**
 * VENSEVEN Pluggable SMS Service
 *
 * Provides an extensible provider abstraction for dispatching phone OTPs.
 * Supports Twilio, MSG91, Custom Webhooks, and isolated development simulation.
 *
 * In production (NODE_ENV=production):
 * A real configured SMS provider is strictly required. If missing or misconfigured,
 * the service fails safely (throws error) and NEVER exposes the OTP in logs or responses.
 */

class SmsProvider {
  async sendOtpSms({ phone, otp, expiresInMinutes }) {
    throw new Error("sendOtpSms must be implemented by subclass");
  }
}

/**
 * Twilio SMS Provider
 */
class TwilioProvider extends SmsProvider {
  constructor() {
    super();
    this.accountSid = process.env.TWILIO_ACCOUNT_SID;
    this.authToken = process.env.TWILIO_AUTH_TOKEN;
    this.fromPhone = process.env.TWILIO_PHONE_NUMBER;
  }

  isConfigured() {
    return Boolean(this.accountSid && this.authToken && this.fromPhone);
  }

  async sendOtpSms({ phone, otp, expiresInMinutes = 5 }) {
    const formattedPhone = phone.startsWith("+") ? phone : `+91${phone.replace(/\D/g, "")}`;
    const url = `https://api.twilio.com/2010-04-01/Accounts/${this.accountSid}/Messages.json`;

    const bodyParams = new URLSearchParams({
      To: formattedPhone,
      From: this.fromPhone,
      Body: `Your VENSEVEN verification code is ${otp}. Valid for ${expiresInMinutes} minutes. Do not share this code with anyone.`,
    });

    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(`${this.accountSid}:${this.authToken}`).toString("base64")}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: bodyParams.toString(),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[Twilio Error]: Failed to dispatch SMS:", response.status, errorText);
      throw new Error("SMS dispatch failed via Twilio gateway.");
    }

    return { success: true, provider: "twilio" };
  }
}

/**
 * MSG91 SMS Provider (popular for Indian mobile numbers)
 */
class MSG91Provider extends SmsProvider {
  constructor() {
    super();
    this.authKey = process.env.MSG91_AUTH_KEY;
    this.templateId = process.env.MSG91_TEMPLATE_ID;
  }

  isConfigured() {
    return Boolean(this.authKey && this.templateId);
  }

  async sendOtpSms({ phone, otp, expiresInMinutes = 5 }) {
    const normalizedPhone = `91${phone.replace(/\D/g, "").slice(-10)}`;
    const url = `https://control.msg91.com/api/v5/otp?template_id=${this.templateId}&mobile=${normalizedPhone}&otp=${otp}&otp_expiry=${expiresInMinutes}`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        authkey: this.authKey,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[MSG91 Error]: Failed to dispatch OTP:", response.status, errorText);
      throw new Error("SMS dispatch failed via MSG91 gateway.");
    }

    return { success: true, provider: "msg91" };
  }
}

/**
 * Generic Webhook / Custom Gateway Provider
 */
class CustomWebhookProvider extends SmsProvider {
  constructor() {
    super();
    this.webhookUrl = process.env.SMS_WEBHOOK_URL;
    this.headerName = process.env.SMS_WEBHOOK_HEADER_NAME || "Authorization";
    this.headerValue = process.env.SMS_WEBHOOK_HEADER_VALUE || "";
  }

  isConfigured() {
    return Boolean(this.webhookUrl);
  }

  async sendOtpSms({ phone, otp, expiresInMinutes = 5 }) {
    const response = await fetch(this.webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(this.headerValue ? { [this.headerName]: this.headerValue } : {}),
      },
      body: JSON.stringify({
        phone: phone.replace(/\D/g, "").slice(-10),
        otp,
        expiresInMinutes,
        brand: "VENSEVEN",
      }),
    });

    if (!response.ok) {
      console.error("[SMS Webhook Error]: Gateway returned status", response.status);
      throw new Error("SMS dispatch failed via custom gateway.");
    }

    return { success: true, provider: "custom_webhook" };
  }
}

/**
 * Development Simulation Provider
 * Active ONLY when NODE_ENV !== "production"
 */
class DevSimulatorProvider extends SmsProvider {
  isConfigured() {
    return process.env.NODE_ENV !== "production";
  }

  async sendOtpSms({ phone, otp, expiresInMinutes = 5 }) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("DevSimulatorProvider is strictly prohibited in production.");
    }

    const maskedPhone = `+91 ******${phone.replace(/\D/g, "").slice(-4)}`;
    console.log(`[DEV SMS SIMULATION]: OTP dispatched to ${maskedPhone} (expires in ${expiresInMinutes}m).`);
    return { success: true, provider: "dev_simulator", isSimulated: true };
  }
}

/**
 * Factory to retrieve active provider based on environment configuration
 */
function getActiveSmsProvider() {
  const isProduction = process.env.NODE_ENV === "production";
  const preferred = (process.env.SMS_PROVIDER || "").toLowerCase();

  const twilio = new TwilioProvider();
  const msg91 = new MSG91Provider();
  const webhook = new CustomWebhookProvider();
  const dev = new DevSimulatorProvider();

  if (preferred === "twilio" && twilio.isConfigured()) return twilio;
  if (preferred === "msg91" && msg91.isConfigured()) return msg91;
  if (preferred === "webhook" && webhook.isConfigured()) return webhook;

  // Auto-detect configured production providers
  if (twilio.isConfigured()) return twilio;
  if (msg91.isConfigured()) return msg91;
  if (webhook.isConfigured()) return webhook;

  // In non-production, fallback to Dev Simulator
  if (!isProduction && dev.isConfigured()) {
    return dev;
  }

  return null;
}

function extractSmsArgs(phoneOrOptions, maybeOtp, maybeExpiry = 5) {
  if (typeof phoneOrOptions === "object" && phoneOrOptions !== null) {
    return {
      phone: String(phoneOrOptions.phone || ""),
      otp: String(phoneOrOptions.otp || ""),
      expiresInMinutes: phoneOrOptions.expiresInMinutes || 5,
    };
  }
  return {
    phone: String(phoneOrOptions || ""),
    otp: String(maybeOtp || ""),
    expiresInMinutes: maybeExpiry || 5,
  };
}

/**
 * Main dispatch function
 * Supports both sendOtpSms(phone, otp, expiresInMinutes) and sendOtpSms({ phone, otp, expiresInMinutes })
 */
async function sendOtpSms(phoneOrOptions, maybeOtp, maybeExpiry = 5) {
  const { phone, otp, expiresInMinutes } = extractSmsArgs(phoneOrOptions, maybeOtp, maybeExpiry);

  const provider = getActiveSmsProvider();

  if (!provider) {
    if (process.env.NODE_ENV === "production") {
      throw new Error(
        "CRITICAL: No production SMS provider is configured on this server. Contact system administration."
      );
    }
    throw new Error("SMS provider not configured.");
  }

  return await provider.sendOtpSms({ phone, otp, expiresInMinutes });
}

module.exports = {
  sendOtpSms,
  getActiveSmsProvider,
  TwilioProvider,
  MSG91Provider,
  CustomWebhookProvider,
  DevSimulatorProvider,
};

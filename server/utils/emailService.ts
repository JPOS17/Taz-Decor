import { google } from "googleapis";

// ============================================================================
// GMAIL API CONFIGURATION (pure HTTPS - no SMTP)
// ============================================================================

const oauth2Client = new google.auth.OAuth2(
  process.env.GMAIL_CLIENT_ID,
  process.env.GMAIL_CLIENT_SECRET,
  "https://developers.google.com/oauthplayground"
);

oauth2Client.setCredentials({
  refresh_token: process.env.GMAIL_REFRESH_TOKEN,
});

const gmail = google.gmail({ version: "v1", auth: oauth2Client });

/**
 * Encode email to base64url format required by Gmail API
 */
const encodeEmail = (to: string, from: string, subject: string, html: string): string => {
  const emailLines = [
    `From: ${from}`,
    `To: ${to}`,
    `Content-Type: text/html; charset=UTF-8`,
    `MIME-Version: 1.0`,
    `Subject: ${subject}`,
    ``,
    html,
  ];
  const email = emailLines.join("\r\n");
  return Buffer.from(email)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
};

/**
 * Send email using Gmail API (pure HTTPS, no SMTP)
 */
const sendEmail = async (to: string, subject: string, html: string): Promise<void> => {
  const from = process.env.EMAIL_FROM || process.env.EMAIL_USER || "";
  const encoded = encodeEmail(to, from, subject, html);
  await gmail.users.messages.send({
    userId: "me",
    requestBody: { raw: encoded },
  });
};

// ============================================================================
// EMAIL - VERIFICATION
// ============================================================================

export const sendVerificationEmail = async (
  email: string,
  token: string,
  firstName: string
): Promise<void> => {
  const verificationUrl = `${process.env.FRONTEND_URL || "http://localhost:5173"}/verify-email/${token}`;

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
          .button { display: inline-block; padding: 14px 28px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; border-radius: 8px; margin: 20px 0; font-weight: 600; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header"><h1>Welcome to Our Store!</h1></div>
          <div class="content">
            <h2>Hi ${firstName},</h2>
            <p>Thank you for signing up! Please verify your email address to complete your registration.</p>
            <p>Click the button below to verify your email:</p>
            <center><a href="${verificationUrl}" class="button">Verify Email Address</a></center>
            <p>Or copy and paste this link in your browser:</p>
            <p style="word-break: break-all; color: #667eea;">${verificationUrl}</p>
            <p><strong>This link will expire in 24 hours.</strong></p>
            <p>If you didn't create an account, please ignore this email.</p>
          </div>
          <div class="footer"><p>© 2024 Your Store. All rights reserved.</p></div>
        </div>
      </body>
    </html>
  `;

  try {
    await sendEmail(email, "Verify Your Email Address", html);
    console.log("Verification email sent to:", email);
  } catch (error) {
    console.error("Error sending email:", error);
    throw new Error("Failed to send verification email");
  }
};

// ============================================================================
// EMAIL - PASSWORD RESET
// ============================================================================

export const sendPasswordResetEmail = async (
  email: string,
  token: string,
  firstName: string
): Promise<void> => {
  const resetUrl = `${process.env.FRONTEND_URL || "http://localhost:5173"}/reset-password/${token}`;

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
          .button { display: inline-block; padding: 14px 28px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; border-radius: 8px; margin: 20px 0; font-weight: 600; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header"><h1>Password Reset Request</h1></div>
          <div class="content">
            <h2>Hi ${firstName},</h2>
            <p>We received a request to reset your password.</p>
            <p>Click the button below to reset your password:</p>
            <center><a href="${resetUrl}" class="button">Reset Password</a></center>
            <p>Or copy and paste this link in your browser:</p>
            <p style="word-break: break-all; color: #667eea;">${resetUrl}</p>
            <p><strong>This link will expire in 1 hour.</strong></p>
            <p>If you didn't request a password reset, please ignore this email and your password will remain unchanged.</p>
          </div>
          <div class="footer"><p>© 2024 Your Store. All rights reserved.</p></div>
        </div>
      </body>
    </html>
  `;

  try {
    await sendEmail(email, "Reset Your Password", html);
    console.log("Password reset email sent to:", email);
  } catch (error) {
    console.error("Error sending email:", error);
    throw new Error("Failed to send password reset email");
  }
};

// ============================================================================
// EMAIL - ORDER CONFIRMATION
// ============================================================================

export const sendOrderConfirmationEmail = async (
  email: string,
  firstName: string,
  orderData: {
    order_number: string;
    total_price: number;
    subtotal: number;
    shipping_cost: number;
    tax_amount: number;
    discount_amount: number;
    address_name?: string;
    address_line1: string;
    address_line2?: string;
    city: string;
    state: string;
    zip: string;
    country?: string;
    items: Array<{
      product_name: string;
      variant_details?: string;
      quantity: number;
      price_at_purchase: number;
      img_url?: string;
    }>;
  },
  isGuest: boolean = false
): Promise<void> => {
  const baseUrl = process.env.FRONTEND_URL || "http://localhost:5173";
  const orderUrl = isGuest
    ? `${baseUrl}/order-lookup`
    : `${baseUrl}/order-confirmation/${orderData.order_number}`;

  const itemsHtml = orderData.items
    .map(
      (item) => `
      <tr>
        <td style="padding: 16px; border-bottom: 1px solid #e2e8f0;">
          <div style="display: flex; align-items: center; gap: 16px;">
            ${item.img_url ? `<img src="${item.img_url}" alt="${item.product_name}" style="width: 60px; height: 60px; object-fit: cover; border-radius: 8px;" />` : ""}
            <div>
              <strong style="color: #1a202c; font-size: 14px;">${item.product_name}</strong>
              ${item.variant_details ? `<div style="color: #718096; font-size: 12px; margin-top: 4px;">${item.variant_details}</div>` : ""}
              <div style="color: #718096; font-size: 12px; margin-top: 4px;">Qty: ${item.quantity}</div>
            </div>
          </div>
        </td>
        <td style="padding: 16px; border-bottom: 1px solid #e2e8f0; text-align: right; white-space: nowrap;">
          <strong style="color: #1a202c;">$${(item.price_at_purchase * item.quantity).toFixed(2)}</strong>
        </td>
      </tr>
    `
    )
    .join("");

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .header h1 { margin: 0 0 10px 0; font-size: 28px; }
          .order-number { background: rgba(255,255,255,0.2); padding: 8px 16px; border-radius: 6px; display: inline-block; margin-top: 10px; font-size: 14px; font-weight: 600; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
          .section { background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
          .section h2 { margin: 0 0 16px 0; font-size: 18px; color: #1a202c; border-bottom: 2px solid #667eea; padding-bottom: 8px; }
          .items-table { width: 100%; border-collapse: collapse; margin-top: 16px; }
          .summary-row { display: flex; justify-content: space-between; padding: 8px 0; font-size: 14px; }
          .summary-row.total { border-top: 2px solid #e2e8f0; margin-top: 8px; padding-top: 12px; font-size: 18px; font-weight: 700; color: #1a202c; }
          .summary-row.discount { color: #10b981; }
          .address-info { color: #4a5568; font-size: 14px; line-height: 1.8; }
          .button { display: inline-block; padding: 14px 28px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; border-radius: 8px; margin: 20px 0; font-weight: 600; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
          .info-box { background: #eff6ff; border-left: 4px solid #667eea; padding: 16px; margin: 16px 0; border-radius: 4px; font-size: 14px; color: #1e40af; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>✓ Order Confirmed!</h1>
            <p style="margin: 10px 0 0 0; font-size: 16px;">Thank you for your order, ${firstName}!</p>
            <div class="order-number">Order #${orderData.order_number}</div>
          </div>
          <div class="content">
            <div class="info-box">
              <strong>📧 What's Next?</strong><br>
              We're processing your order and will send you another email with tracking information once it ships. Estimated delivery: 5-7 business days.
            </div>
            <div class="section">
              <h2>📦 Order Items</h2>
              <table class="items-table">${itemsHtml}</table>
            </div>
            <div class="section">
              <h2>💰 Order Summary</h2>
              <div class="summary-row"><span>Subtotal:</span><span>$${orderData.subtotal.toFixed(2)}</span></div>
              ${orderData.discount_amount > 0 ? `<div class="summary-row discount"><span>Discount:</span><span>-$${orderData.discount_amount.toFixed(2)}</span></div>` : ""}
              <div class="summary-row"><span>Shipping:</span><span>${orderData.shipping_cost === 0 ? "FREE" : `$${orderData.shipping_cost.toFixed(2)}`}</span></div>
              <div class="summary-row"><span>Tax:</span><span>$${orderData.tax_amount.toFixed(2)}</span></div>
              <div class="summary-row total"><span>Total:</span><span>$${orderData.total_price.toFixed(2)}</span></div>
            </div>
            <div class="section">
              <h2>🚚 Shipping Address</h2>
              <div class="address-info">
                ${orderData.address_name ? `<strong>${orderData.address_name}</strong>` : ""}
                ${orderData.address_line1}<br>
                ${orderData.address_line2 ? `${orderData.address_line2}<br>` : ""}
                ${orderData.city}, ${orderData.state} ${orderData.zip}<br>
                ${orderData.country || ""}
              </div>
            </div>
            ${isGuest ? `
            <div style="background: #fffbeb; border: 1px solid #fde68a; border-radius: 8px; padding: 20px; margin: 20px 0; text-align: center;">
              <p style="margin: 0 0 8px 0; font-size: 15px; font-weight: 700; color: #92400e;">📋 Save Your Order Number</p>
              <p style="margin: 0 0 12px 0; font-size: 13px; color: #92400e;">You checked out as a guest. Use your order number and this email address to look up your order anytime.</p>
              <div style="font-family: monospace; font-size: 18px; font-weight: bold; color: #1a202c; background: white; border: 1px solid #fde68a; border-radius: 6px; padding: 10px 20px; display: inline-block;">${orderData.order_number}</div>
            </div>` : ""}
            <center><a href="${orderUrl}" class="button">${isGuest ? "Look Up My Order" : "View Order Details"}</a></center>
            <p style="text-align: center; color: #718096; font-size: 14px; margin-top: 24px;">Questions about your order? Reply to this email and we'll be happy to help!</p>
          </div>
          <div class="footer"><p>© 2024 Your Store. All rights reserved.</p></div>
        </div>
      </body>
    </html>
  `;

  try {
    await sendEmail(email, `Order Confirmation - ${orderData.order_number}`, html);
    console.log("Order confirmation email sent to:", email);
  } catch (error) {
    console.error("Error sending order confirmation email:", error);
    throw new Error("Failed to send order confirmation email");
  }
};

// ============================================================================
// EMAIL - SHIPPING NOTIFICATION
// ============================================================================

export const sendShippingNotificationEmail = async (
  email: string,
  firstName: string,
  orderData: {
    order_number: string;
    total_price: number;
    tracking_number: string;
  },
  isGuest: boolean = false
): Promise<void> => {
  const uspsTrackingUrl = `https://tools.usps.com/go/TrackConfirmAction?tLabels=${orderData.tracking_number}`;
  const baseUrl = process.env.FRONTEND_URL || "http://localhost:5173";
  const orderUrl = isGuest
    ? `${baseUrl}/order-lookup`
    : `${baseUrl}/order-confirmation/${orderData.order_number}`;

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
          .section { background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
          .tracking-box { background: #eff6ff; border-left: 4px solid #667eea; padding: 20px; margin: 20px 0; border-radius: 4px; }
          .tracking-number { font-family: monospace; font-size: 16px; font-weight: bold; color: #1e40af; margin: 8px 0; }
          .button { display: inline-block; padding: 14px 28px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; border-radius: 8px; margin: 20px 0; font-weight: 600; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
          .info-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e2e8f0; }
          .info-row:last-child { border-bottom: none; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📦 Your Order Has Shipped!</h1>
            <p style="margin: 10px 0 0 0; font-size: 16px;">Your package is on its way</p>
          </div>
          <div class="content">
            <h2>Hi ${firstName},</h2>
            <p>Great news! Your order <strong>#${orderData.order_number}</strong> has been shipped and is on its way to you.</p>
            <div class="section">
              <h3 style="margin: 0 0 16px 0; font-size: 16px; color: #1a202c;">Order Details</h3>
              <div class="info-row"><span style="color: #666;">Order Number:</span><span style="font-weight: bold;">#${orderData.order_number}</span></div>
              <div class="info-row"><span style="color: #666;">Order Total:</span><span style="font-weight: bold;">$${orderData.total_price.toFixed(2)}</span></div>
              <div class="info-row"><span style="color: #666;">Carrier:</span><span style="font-weight: bold;">USPS</span></div>
            </div>
            <div class="tracking-box">
              <strong style="color: #1a202c; display: block; margin-bottom: 8px;">📍 Tracking Number:</strong>
              <div class="tracking-number">${orderData.tracking_number}</div>
            </div>
            <center><a href="${uspsTrackingUrl}" class="button">Track Your Package</a></center>
            ${isGuest ? `<center><a href="${orderUrl}" style="display: inline-block; margin-top: 8px; color: #667eea; font-size: 14px;">View Order Details</a></center>` : ""}
            <p style="text-align: center; color: #718096; font-size: 14px; margin-top: 16px;">Or copy and paste this tracking link in your browser:</p>
            <p style="text-align: center; word-break: break-all; color: #667eea; font-size: 12px;">${uspsTrackingUrl}</p>
            <div style="border-top: 2px solid #e2e8f0; padding-top: 20px; margin-top: 24px;">
              <p style="margin: 0 0 8px 0; font-size: 16px; color: #1a202c;">Thank you for your order!</p>
              <p style="margin: 0; font-size: 14px; color: #718096;">If you have any questions about your shipment, please don't hesitate to contact us.</p>
            </div>
          </div>
          <div class="footer"><p>© 2024 Your Store. All rights reserved.</p></div>
        </div>
      </body>
    </html>
  `;

  try {
    await sendEmail(email, `Your Order #${orderData.order_number} Has Shipped! 📦`, html);
    console.log("Shipping notification email sent to:", email);
  } catch (error) {
    console.error("Error sending shipping notification email:", error);
    throw new Error("Failed to send shipping notification email");
  }
};

// ============================================================================
// EMAIL - ADMIN MESSAGE
// ============================================================================

export const sendAdminEmail = async (
  email: string,
  firstName: string,
  subject: string,
  message: string
): Promise<void> => {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #753a1e; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
          .message { background: white; padding: 20px; border-left: 4px solid #753a1e; margin: 20px 0; white-space: pre-wrap; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header"><h1>Message from Store Admin</h1></div>
          <div class="content">
            <h2>Hi ${firstName},</h2>
            <div class="message">${message}</div>
            <p style="color: #666; font-size: 14px; margin-top: 20px;">If you have any questions, feel free to reply to this email.</p>
          </div>
          <div class="footer"><p>© 2024 Your Store. All rights reserved.</p></div>
        </div>
      </body>
    </html>
  `;

  try {
    await sendEmail(email, subject, html);
    console.log("Admin email sent to:", email);
  } catch (error) {
    console.error("Error sending admin email:", error);
    throw new Error("Failed to send admin email");
  }
};
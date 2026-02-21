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
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;600;700&family=Lato:wght@300;400;600;700&display=swap');
          body { font-family: 'Lato', Georgia, sans-serif; line-height: 1.6; color: #3d2b0e; margin: 0; padding: 0; background-color: #f8f5f0; }
          .container { max-width: 600px; margin: 0 auto; padding: 24px 16px; }
          .header { background: linear-gradient(160deg, #3d2b0e 0%, #5a4228 100%); color: #fdf8f0; padding: 36px 32px; text-align: center; border-radius: 12px 12px 0 0; border-bottom: 3px solid #d4a96a; }
          .header h1 { font-family: 'Cormorant Garamond', Georgia, serif; font-size: 28px; font-weight: 700; margin: 0; letter-spacing: 0.02em; color: #fdf8f0; }
          .header p { margin: 8px 0 0 0; font-size: 15px; color: #c9a97a; font-weight: 300; }
          .content { background: linear-gradient(160deg, #fdf8f0 0%, #f9f1e4 100%); padding: 36px 32px; border-radius: 0 0 12px 12px; border: 1.5px solid #d4a96a; border-top: none; }
          .content h2 { font-family: 'Cormorant Garamond', Georgia, serif; font-size: 22px; font-weight: 700; color: #3d2b0e; margin: 0 0 16px 0; }
          .content p { font-size: 15px; color: #5a4228; margin: 0 0 14px 0; }
          .button { display: inline-block; padding: 13px 32px; background: linear-gradient(135deg, #2e7d52 0%, #1e5c3a 100%); color: #ffffff !important; text-decoration: none; border-radius: 8px; margin: 8px 0 20px 0; font-weight: 700; font-size: 15px; letter-spacing: 0.04em; box-shadow: 0 4px 14px rgba(30, 92, 58, 0.28); }
          .url-box { background: #ffffff; border: 1.5px solid #d9c2a3; border-radius: 8px; padding: 10px 14px; word-break: break-all; color: #8a6030; font-size: 13px; margin: 0 0 14px 0; }
          .notice { background: rgba(181, 52, 30, 0.06); border-left: 3px solid #b5341e; border-radius: 6px; padding: 10px 14px; font-size: 13.5px; color: #8c2515; margin: 0 0 14px 0; }
          .divider { border: none; border-top: 1px solid #d9c2a3; margin: 24px 0; }
          .footer { text-align: center; margin-top: 20px; color: #9b7d56; font-size: 12px; font-family: 'Lato', sans-serif; }
          .footer a { color: #8a6030; text-decoration: none; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Welcome to Our Store</h1>
            <p>We're glad you're here</p>
          </div>
          <div class="content">
            <h2>Hi ${firstName},</h2>
            <p>Thank you for signing up! Please verify your email address to complete your registration and start shopping.</p>
            <p>Click the button below to verify your email:</p>
            <center><a href="${verificationUrl}" class="button">Verify Email Address</a></center>
            <p>Or copy and paste this link into your browser:</p>
            <div class="url-box">${verificationUrl}</div>
            <div class="notice"><strong>This link will expire in 24 hours.</strong></div>
            <hr class="divider" />
            <p style="font-size: 13px; color: #9b7d56; margin: 0;">If you didn't create an account, you can safely ignore this email.</p>
          </div>
          <div class="footer"><p>© 2022 Taz Decor Catholic Company. All rights reserved.</p></div>
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
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;600;700&family=Lato:wght@300;400;600;700&display=swap');
          body { font-family: 'Lato', Georgia, sans-serif; line-height: 1.6; color: #3d2b0e; margin: 0; padding: 0; background-color: #f8f5f0; }
          .container { max-width: 600px; margin: 0 auto; padding: 24px 16px; }
          .header { background: linear-gradient(160deg, #3d2b0e 0%, #5a4228 100%); color: #fdf8f0; padding: 36px 32px; text-align: center; border-radius: 12px 12px 0 0; border-bottom: 3px solid #d4a96a; }
          .header h1 { font-family: 'Cormorant Garamond', Georgia, serif; font-size: 28px; font-weight: 700; margin: 0; letter-spacing: 0.02em; color: #fdf8f0; }
          .header p { margin: 8px 0 0 0; font-size: 15px; color: #c9a97a; font-weight: 300; }
          .content { background: linear-gradient(160deg, #fdf8f0 0%, #f9f1e4 100%); padding: 36px 32px; border-radius: 0 0 12px 12px; border: 1.5px solid #d4a96a; border-top: none; }
          .content h2 { font-family: 'Cormorant Garamond', Georgia, serif; font-size: 22px; font-weight: 700; color: #3d2b0e; margin: 0 0 16px 0; }
          .content p { font-size: 15px; color: #5a4228; margin: 0 0 14px 0; }
          .button { display: inline-block; padding: 13px 32px; background: linear-gradient(135deg, #2e7d52 0%, #1e5c3a 100%); color: #ffffff !important; text-decoration: none; border-radius: 8px; margin: 8px 0 20px 0; font-weight: 700; font-size: 15px; letter-spacing: 0.04em; box-shadow: 0 4px 14px rgba(30, 92, 58, 0.28); }
          .url-box { background: #ffffff; border: 1.5px solid #d9c2a3; border-radius: 8px; padding: 10px 14px; word-break: break-all; color: #8a6030; font-size: 13px; margin: 0 0 14px 0; }
          .notice { background: rgba(181, 52, 30, 0.06); border-left: 3px solid #b5341e; border-radius: 6px; padding: 10px 14px; font-size: 13.5px; color: #8c2515; margin: 0 0 14px 0; }
          .divider { border: none; border-top: 1px solid #d9c2a3; margin: 24px 0; }
          .footer { text-align: center; margin-top: 20px; color: #9b7d56; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Password Reset Request</h1>
            <p>We'll get you back in shortly</p>
          </div>
          <div class="content">
            <h2>Hi ${firstName},</h2>
            <p>We received a request to reset the password for your account. Click the button below to choose a new password:</p>
            <center><a href="${resetUrl}" class="button">Reset My Password</a></center>
            <p>Or copy and paste this link into your browser:</p>
            <div class="url-box">${resetUrl}</div>
            <div class="notice"><strong>This link will expire in 1 hour.</strong></div>
            <hr class="divider" />
            <p style="font-size: 13px; color: #9b7d56; margin: 0;">If you didn't request a password reset, you can safely ignore this email — your password will remain unchanged.</p>
          </div>
          <div class="footer"><p>© 2022 Taz Decor Catholic Company. All rights reserved.</p></div>
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
    first_name: string;
    last_name?: string;
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

  const recipientName = [orderData.first_name, orderData.last_name].filter(Boolean).join(" ");

  const itemsHtml = orderData.items
    .map(
      (item) => `
      <tr>
        <td style="padding: 14px; border-bottom: 1px solid #e8d9c4;">
          <div style="display: flex; align-items: center; gap: 14px;">
            ${item.img_url ? `<img src="${item.img_url}" alt="${item.product_name}" style="width: 60px; height: 60px; object-fit: cover; border-radius: 8px; border: 1px solid #e8d9c4;" />` : ""}
            <div>
              <strong style="color: #3d2b0e; font-size: 14px;">${item.product_name}</strong>
              ${item.variant_details ? `<div style="color: #9b7d56; font-size: 12px; margin-top: 4px;">${item.variant_details}</div>` : ""}
              <div style="color: #9b7d56; font-size: 12px; margin-top: 4px;">Qty: ${item.quantity}</div>
            </div>
          </div>
        </td>
        <td style="padding: 14px; border-bottom: 1px solid #e8d9c4; text-align: right; white-space: nowrap;">
          <strong style="color: #3d2b0e;">$${(item.price_at_purchase * item.quantity).toFixed(2)}</strong>
        </td>
      </tr>
    `
    )
    .join("");

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;600;700&family=Lato:wght@300;400;600;700&display=swap');
          body { font-family: 'Lato', Georgia, sans-serif; line-height: 1.6; color: #3d2b0e; margin: 0; padding: 0; background-color: #f8f5f0; }
          .container { max-width: 600px; margin: 0 auto; padding: 24px 16px; }
          .header { background: linear-gradient(160deg, #3d2b0e 0%, #5a4228 100%); color: #fdf8f0; padding: 36px 32px; text-align: center; border-radius: 12px 12px 0 0; border-bottom: 3px solid #d4a96a; }
          .header h1 { font-family: 'Cormorant Garamond', Georgia, serif; font-size: 28px; font-weight: 700; margin: 0 0 10px 0; color: #fdf8f0; letter-spacing: 0.02em; }
          .order-number { background: rgba(212, 169, 106, 0.25); border: 1px solid rgba(212, 169, 106, 0.5); padding: 8px 18px; border-radius: 6px; display: inline-block; margin-top: 10px; font-size: 14px; font-weight: 700; color: #f0d9b5; letter-spacing: 0.05em; }
          .content { background: linear-gradient(160deg, #fdf8f0 0%, #f9f1e4 100%); padding: 36px 32px; border-radius: 0 0 12px 12px; border: 1.5px solid #d4a96a; border-top: none; }
          .content h2 { font-family: 'Cormorant Garamond', Georgia, serif; font-size: 22px; font-weight: 700; color: #3d2b0e; margin: 0 0 16px 0; }
          .section { background: white; padding: 20px; border-radius: 10px; margin-bottom: 20px; border: 1px solid #e8d9c4; }
          .section h2 { margin: 0 0 16px 0; font-size: 16px; font-weight: 700; color: #3d2b0e; border-bottom: 2px solid #d4a96a; padding-bottom: 8px; letter-spacing: 0.03em; text-transform: uppercase; font-family: 'Lato', sans-serif; }
          .items-table { width: 100%; border-collapse: collapse; margin-top: 8px; }
          .summary-row { display: flex; justify-content: space-between; padding: 8px 0; font-size: 14px; color: #5a4228; }
          .summary-row.total { border-top: 2px solid #d9c2a3; margin-top: 8px; padding-top: 12px; font-size: 18px; font-weight: 700; color: #3d2b0e; }
          .summary-row.discount { color: #2e7d52; }
          .address-info { color: #5a4228; font-size: 14px; line-height: 1.8; }
          .button { display: inline-block; padding: 13px 32px; background: linear-gradient(135deg, #2e7d52 0%, #1e5c3a 100%); color: #ffffff !important; text-decoration: none; border-radius: 8px; margin: 20px 0; font-weight: 700; font-size: 15px; letter-spacing: 0.04em; box-shadow: 0 4px 14px rgba(30, 92, 58, 0.28); }
          .footer { text-align: center; margin-top: 20px; color: #9b7d56; font-size: 12px; }
          .info-box { background: rgba(201, 169, 122, 0.12); border-left: 3px solid #d4a96a; padding: 14px 16px; margin: 0 0 20px 0; border-radius: 6px; font-size: 14px; color: #5a4228; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Order Confirmed</h1>
            <p style="margin: 8px 0 0 0; font-size: 15px; color: #c9a97a; font-weight: 300;">Thank you for your order, ${firstName}!</p>
            <div class="order-number">Order #${orderData.order_number}</div>
          </div>
          <div class="content">
            <div class="info-box">
              <strong>What happens next?</strong><br>
              We're processing your order and will send you another email with tracking information once it ships. Estimated delivery: 5–7 business days.
            </div>
            <div class="section">
              <h2>Order Items</h2>
              <table class="items-table">${itemsHtml}</table>
            </div>
            <div class="section">
              <h2>Order Summary</h2>
              <div class="summary-row"><span>Subtotal:</span><span>$${orderData.subtotal.toFixed(2)}</span></div>
              ${orderData.discount_amount > 0 ? `<div class="summary-row discount"><span>Discount:</span><span>-$${orderData.discount_amount.toFixed(2)}</span></div>` : ""}
              <div class="summary-row"><span>Shipping:</span><span>${orderData.shipping_cost === 0 ? "FREE" : `$${orderData.shipping_cost.toFixed(2)}`}</span></div>
              <div class="summary-row"><span>Tax:</span><span>$${orderData.tax_amount.toFixed(2)}</span></div>
              <div class="summary-row total"><span>Total:</span><span>$${orderData.total_price.toFixed(2)}</span></div>
            </div>
            <div class="section">
              <h2>Shipping Address</h2>
              <div class="address-info">
                <strong>${recipientName}</strong><br>
                ${orderData.address_line1}<br>
                ${orderData.address_line2 ? `${orderData.address_line2}<br>` : ""}
                ${orderData.city}, ${orderData.state} ${orderData.zip}<br>
                ${orderData.country || ""}
              </div>
            </div>
            ${isGuest ? `
            <div style="background: rgba(201,169,122,0.12); border: 1px solid #d4a96a; border-radius: 10px; padding: 20px; margin: 20px 0; text-align: center;">
              <p style="margin: 0 0 8px 0; font-size: 15px; font-weight: 700; color: #5a4228; font-family: 'Lato', sans-serif; letter-spacing: 0.03em; text-transform: uppercase;">Save Your Order Number</p>
              <p style="margin: 0 0 12px 0; font-size: 13px; color: #9b7d56;">You checked out as a guest. Use your order number and this email address to look up your order anytime.</p>
              <div style="font-family: monospace; font-size: 18px; font-weight: bold; color: #3d2b0e; background: white; border: 1.5px solid #d4a96a; border-radius: 6px; padding: 10px 20px; display: inline-block;">${orderData.order_number}</div>
            </div>` : ""}
            <center><a href="${orderUrl}" class="button">${isGuest ? "Look Up My Order" : "View Order Details"}</a></center>
            <p style="text-align: center; color: #9b7d56; font-size: 14px; margin-top: 24px;">Questions about your order? Reply to this email and we'll be happy to help.</p>
          </div>
          <div class="footer"><p>© 2022 Taz Decor Catholic Company. All rights reserved.</p></div>
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
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;600;700&family=Lato:wght@300;400;600;700&display=swap');
          body { font-family: 'Lato', Georgia, sans-serif; line-height: 1.6; color: #3d2b0e; margin: 0; padding: 0; background-color: #f8f5f0; }
          .container { max-width: 600px; margin: 0 auto; padding: 24px 16px; }
          .header { background: linear-gradient(160deg, #3d2b0e 0%, #5a4228 100%); color: #fdf8f0; padding: 36px 32px; text-align: center; border-radius: 12px 12px 0 0; border-bottom: 3px solid #d4a96a; }
          .header h1 { font-family: 'Cormorant Garamond', Georgia, serif; font-size: 28px; font-weight: 700; margin: 0; letter-spacing: 0.02em; color: #fdf8f0; }
          .header p { margin: 8px 0 0 0; font-size: 15px; color: #c9a97a; font-weight: 300; }
          .content { background: linear-gradient(160deg, #fdf8f0 0%, #f9f1e4 100%); padding: 36px 32px; border-radius: 0 0 12px 12px; border: 1.5px solid #d4a96a; border-top: none; }
          .content h2 { font-family: 'Cormorant Garamond', Georgia, serif; font-size: 22px; font-weight: 700; color: #3d2b0e; margin: 0 0 16px 0; }
          .content p { font-size: 15px; color: #5a4228; margin: 0 0 14px 0; }
          .section { background: white; padding: 20px; border-radius: 10px; margin-bottom: 20px; border: 1px solid #e8d9c4; }
          .section h3 { margin: 0 0 14px 0; font-size: 13px; color: #5a4228; letter-spacing: 0.05em; text-transform: uppercase; font-weight: 700; font-family: 'Lato', sans-serif; border-bottom: 1px solid #e8d9c4; padding-bottom: 8px; }
          .tracking-box { background: rgba(46, 125, 82, 0.07); border-left: 3px solid #2e7d52; padding: 18px 20px; margin: 20px 0; border-radius: 8px; }
          .tracking-number { font-family: monospace; font-size: 17px; font-weight: bold; color: #1e5c3a; margin: 8px 0 0 0; letter-spacing: 0.06em; }
          .button { display: inline-block; padding: 13px 32px; background: linear-gradient(135deg, #2e7d52 0%, #1e5c3a 100%); color: #ffffff !important; text-decoration: none; border-radius: 8px; margin: 20px 0; font-weight: 700; font-size: 15px; letter-spacing: 0.04em; box-shadow: 0 4px 14px rgba(30, 92, 58, 0.28); }
          .url-box { text-align: center; word-break: break-all; color: #8a6030; font-size: 12px; margin-top: 8px; }
          .info-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e8d9c4; font-size: 14px; }
          .info-row:last-child { border-bottom: none; }
          .info-row span:first-child { color: #9b7d56; }
          .info-row span:last-child { font-weight: 700; color: #3d2b0e; }
          .divider { border: none; border-top: 1px solid #d9c2a3; margin: 24px 0; }
          .footer { text-align: center; margin-top: 20px; color: #9b7d56; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Your Order Has Shipped</h1>
            <p>Your package is on its way</p>
          </div>
          <div class="content">
            <h2>Hi ${firstName},</h2>
            <p>Great news! Your order <strong>#${orderData.order_number}</strong> has been shipped and is heading your way.</p>
            <div class="section">
              <h3>Order Details</h3>
              <div class="info-row"><span>Order Number:</span><span>#${orderData.order_number}</span></div>
              <div class="info-row"><span>Carrier:</span><span>USPS</span></div>
              <div class="info-row"><span>Order Total:</span><span>$${orderData.total_price.toFixed(2)}</span></div>
            </div>
            <div class="tracking-box">
              <strong style="color: #3d2b0e; display: block; font-size: 13px; text-transform: uppercase; letter-spacing: 0.05em;">Tracking Number</strong>
              <div class="tracking-number">${orderData.tracking_number}</div>
            </div>
            <center><a href="${uspsTrackingUrl}" class="button">Track Your Package</a></center>
            ${isGuest ? `<center><a href="${orderUrl}" style="display: inline-block; margin-top: 4px; color: #8a6030; font-size: 14px; font-weight: 600; text-decoration: none;">View Order Details</a></center>` : ""}
            <div class="url-box">
              <p style="color: #9b7d56; font-size: 13px; margin: 0 0 4px 0;">Or copy this tracking link into your browser:</p>
              <span>${uspsTrackingUrl}</span>
            </div>
            <hr class="divider" />
            <p style="font-size: 15px; font-weight: 700; color: #3d2b0e; margin: 0 0 8px 0; font-family: 'Cormorant Garamond', Georgia, serif; font-size: 18px;">Thank you for your order!</p>
            <p style="margin: 0; font-size: 14px; color: #9b7d56;">If you have any questions about your shipment, please don't hesitate to contact us.</p>
          </div>
          <div class="footer"><p>© 2022 Taz Decor Catholic Company. All rights reserved.</p></div>
        </div>
      </body>
    </html>
  `;

  try {
    await sendEmail(email, `Your Order #${orderData.order_number} Has Shipped!`, html);
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
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;600;700&family=Lato:wght@300;400;600;700&display=swap');
          body { font-family: 'Lato', Georgia, sans-serif; line-height: 1.6; color: #3d2b0e; margin: 0; padding: 0; background-color: #f8f5f0; }
          .container { max-width: 600px; margin: 0 auto; padding: 24px 16px; }
          .header { background: linear-gradient(160deg, #3d2b0e 0%, #5a4228 100%); color: #fdf8f0; padding: 36px 32px; text-align: center; border-radius: 12px 12px 0 0; border-bottom: 3px solid #d4a96a; }
          .header h1 { font-family: 'Cormorant Garamond', Georgia, serif; font-size: 28px; font-weight: 700; margin: 0; letter-spacing: 0.02em; color: #fdf8f0; }
          .header p { margin: 8px 0 0 0; font-size: 15px; color: #c9a97a; font-weight: 300; }
          .content { background: linear-gradient(160deg, #fdf8f0 0%, #f9f1e4 100%); padding: 36px 32px; border-radius: 0 0 12px 12px; border: 1.5px solid #d4a96a; border-top: none; }
          .content h2 { font-family: 'Cormorant Garamond', Georgia, serif; font-size: 22px; font-weight: 700; color: #3d2b0e; margin: 0 0 16px 0; }
          .content p { font-size: 15px; color: #5a4228; margin: 0 0 14px 0; }
          .message { background: white; padding: 20px 24px; border-left: 3px solid #d4a96a; border-radius: 0 8px 8px 0; margin: 20px 0; white-space: pre-wrap; font-size: 15px; color: #3d2b0e; line-height: 1.8; border: 1px solid #e8d9c4; border-left: 3px solid #d4a96a; }
          .footer { text-align: center; margin-top: 20px; color: #9b7d56; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Message from Our Store</h1>
            <p>A note from our team</p>
          </div>
          <div class="content">
            <h2>Hi ${firstName},</h2>
            <div class="message">${message}</div>
            <p style="color: #9b7d56; font-size: 14px; margin: 20px 0 0 0;">If you have any questions, feel free to reply to this email.</p>
          </div>
          <div class="footer"><p>© 2022 Taz Decor Catholic Company. All rights reserved.</p></div>
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
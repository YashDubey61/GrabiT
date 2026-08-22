export interface OrderConfirmationEmailData {
  customerName: string;
  orderNumber: string;
  orderDateIso: string;
  vendorName: string;
  items: { name: string; quantity: number; price: number }[];
  subtotal: number;
  discount: number;
  deliveryFee: number;
  total: number;
  pickupLocation: string | null;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function formatInr(amount: number): string {
  return amount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Kolkata",
  });
}

export function renderOrderConfirmationEmail(data: OrderConfirmationEmailData): {
  subject: string;
  html: string;
  text: string;
} {
  const subject = `GRABIT Order Confirmed — #${data.orderNumber}`;

  const itemRowsHtml = data.items
    .map(
      (item) => `
        <tr>
          <td style="padding:8px 0;color:#e5e5e5;font-size:14px;">${escapeHtml(item.name)} &times; ${item.quantity}</td>
          <td style="padding:8px 0;color:#e5e5e5;font-size:14px;text-align:right;">₹${formatInr(item.price * item.quantity)}</td>
        </tr>`,
    )
    .join("");

  const itemRowsText = data.items
    .map((item) => `${item.name} x ${item.quantity} — ₹${formatInr(item.price * item.quantity)}`)
    .join("\n");

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${subject}</title>
</head>
<body style="margin:0;padding:0;background-color:#0a0a0a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#0a0a0a;padding:24px 0;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background-color:#141414;border-radius:16px;border:1px solid #262626;overflow:hidden;">
          <tr>
            <td style="padding:28px 28px 20px 28px;text-align:center;border-bottom:1px solid #262626;">
              <span style="font-size:22px;font-weight:800;letter-spacing:0.02em;color:#ff7a00;">GRABIT</span>
            </td>
          </tr>
          <tr>
            <td style="padding:28px;">
              <p style="margin:0 0 4px 0;font-size:18px;font-weight:700;color:#ffffff;">Order Confirmed &#10003;</p>
              <p style="margin:0 0 20px 0;font-size:14px;color:#a3a3a3;">Hi ${escapeHtml(data.customerName)},</p>
              <p style="margin:0 0 24px 0;font-size:14px;color:#d4d4d4;line-height:1.5;">Your GRABIT order has been successfully confirmed.</p>

              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#1c1c1c;border-radius:12px;padding:16px;margin-bottom:20px;">
                <tr><td style="padding:4px 0;font-size:13px;color:#a3a3a3;">Order Number</td><td style="padding:4px 0;font-size:13px;color:#ffffff;font-weight:700;text-align:right;">#${escapeHtml(data.orderNumber)}</td></tr>
                <tr><td style="padding:4px 0;font-size:13px;color:#a3a3a3;">Order Date</td><td style="padding:4px 0;font-size:13px;color:#ffffff;text-align:right;">${formatDate(data.orderDateIso)}</td></tr>
                <tr><td style="padding:4px 0;font-size:13px;color:#a3a3a3;">Vendor</td><td style="padding:4px 0;font-size:13px;color:#ffffff;text-align:right;">${escapeHtml(data.vendorName)}</td></tr>
                <tr><td style="padding:4px 0;font-size:13px;color:#a3a3a3;">Status</td><td style="padding:4px 0;font-size:13px;color:#22c55e;font-weight:700;text-align:right;">Confirmed</td></tr>
              </table>

              <p style="margin:0 0 8px 0;font-size:13px;font-weight:700;color:#a3a3a3;text-transform:uppercase;letter-spacing:0.04em;">Items</p>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid #262626;border-bottom:1px solid #262626;margin-bottom:16px;">
                ${itemRowsHtml}
              </table>

              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px;">
                <tr><td style="padding:3px 0;font-size:13px;color:#a3a3a3;">Subtotal</td><td style="padding:3px 0;font-size:13px;color:#d4d4d4;text-align:right;">₹${formatInr(data.subtotal)}</td></tr>
                ${data.discount > 0 ? `<tr><td style="padding:3px 0;font-size:13px;color:#a3a3a3;">Discount</td><td style="padding:3px 0;font-size:13px;color:#22c55e;text-align:right;">-₹${formatInr(data.discount)}</td></tr>` : ""}
                <tr><td style="padding:3px 0;font-size:13px;color:#a3a3a3;">Delivery Fee</td><td style="padding:3px 0;font-size:13px;color:#d4d4d4;text-align:right;">₹${formatInr(data.deliveryFee)}</td></tr>
                <tr><td style="padding:10px 0 0 0;font-size:15px;color:#ffffff;font-weight:800;border-top:1px solid #262626;">Total Paid</td><td style="padding:10px 0 0 0;font-size:15px;color:#ff7a00;font-weight:800;text-align:right;border-top:1px solid #262626;">₹${formatInr(data.total)}</td></tr>
              </table>

              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#1c1c1c;border-radius:12px;padding:14px 16px;margin-bottom:24px;">
                <tr><td style="font-size:13px;font-weight:700;color:#ffffff;">Pickup</td></tr>
                <tr><td style="font-size:13px;color:#a3a3a3;padding-top:2px;">${escapeHtml(data.pickupLocation || data.vendorName)}</td></tr>
              </table>

              <p style="margin:0 0 4px 0;font-size:13px;color:#d4d4d4;">Thank you for ordering with GRABIT.</p>
              <p style="margin:16px 0 0 0;font-size:12px;color:#737373;">Need help? <a href="mailto:support.grabit@gmail.com" style="color:#ff7a00;">support.grabit@gmail.com</a></p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  const text = `GRABIT — Order Confirmed

Hi ${data.customerName},

Your GRABIT order has been successfully confirmed.

Order Details
Order Number: #${data.orderNumber}
Order Date: ${formatDate(data.orderDateIso)}
Vendor: ${data.vendorName}
Order Status: Confirmed

Items
--------------------------------
${itemRowsText}
--------------------------------

Subtotal        ₹${formatInr(data.subtotal)}
${data.discount > 0 ? `Discount        -₹${formatInr(data.discount)}\n` : ""}Delivery Fee    ₹${formatInr(data.deliveryFee)}
Total Paid      ₹${formatInr(data.total)}

Pickup
${data.pickupLocation || data.vendorName}

Thank you for ordering with GRABIT.

Need help?
support.grabit@gmail.com`;

  return { subject, html, text };
}

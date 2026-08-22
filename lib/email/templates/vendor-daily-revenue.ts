import type { CalculatedVendorSettlement } from "@/lib/telegram/settlement_calculator";

function formatInr(amount: number): string {
  return amount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * Renders the vendor daily revenue email from the SAME
 * CalculatedVendorSettlement object produced by
 * lib/telegram/settlement_calculator.ts and already used for the
 * Telegram report — one settlement calculation, two channels. Never
 * recomputes commission or revenue here.
 */
export function renderVendorDailyRevenueEmail(
  calc: CalculatedVendorSettlement,
  alreadyPaidAmount: number,
  payoutDue: number,
  status: "PENDING" | "PAID" | "PARTIALLY_PAID",
): { subject: string; html: string; text: string } {
  const subject = `GRABIT Daily Revenue Report — ${calc.canteenName} — ${calc.displayDate}`;
  const statusLabel =
    calc.totalOrders === 0
      ? "NO ACTIVITY"
      : status === "PAID"
        ? "PAYMENT COMPLETED"
        : status === "PARTIALLY_PAID"
          ? "PARTIALLY PAID"
          : "PAYMENT PENDING";
  const statusColor = statusLabel === "PAYMENT COMPLETED" ? "#22c55e" : statusLabel === "NO ACTIVITY" ? "#a3a3a3" : "#ff7a00";

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
              <p style="margin:0 0 4px 0;font-size:18px;font-weight:700;color:#ffffff;">Daily Vendor Revenue Report</p>
              <p style="margin:0 0 20px 0;font-size:13px;color:#a3a3a3;">${calc.displayDate} · ${calc.windowLabel}</p>

              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#1c1c1c;border-radius:12px;padding:16px;margin-bottom:16px;">
                <tr><td style="padding:4px 0;font-size:13px;color:#a3a3a3;">Vendor</td><td style="padding:4px 0;font-size:13px;color:#ffffff;font-weight:700;text-align:right;">${escapeHtml(calc.canteenName)}</td></tr>
                <tr><td style="padding:4px 0;font-size:13px;color:#a3a3a3;">Eligible Orders</td><td style="padding:4px 0;font-size:13px;color:#ffffff;text-align:right;">${calc.totalOrders}</td></tr>
                <tr><td style="padding:4px 0;font-size:13px;color:#a3a3a3;">Cancelled/Refunded</td><td style="padding:4px 0;font-size:13px;color:#ffffff;text-align:right;">${calc.cancelledOrdersCount}</td></tr>
              </table>

              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px;">
                <tr><td style="padding:3px 0;font-size:13px;color:#a3a3a3;">Gross Revenue</td><td style="padding:3px 0;font-size:13px;color:#d4d4d4;text-align:right;">₹${formatInr(calc.grossRevenue)}</td></tr>
                <tr><td style="padding:3px 0;font-size:13px;color:#a3a3a3;">GRABIT Commission (₹1/order &times; ${calc.totalOrders})</td><td style="padding:3px 0;font-size:13px;color:#d4d4d4;text-align:right;">₹${formatInr(calc.commissionAmount)}</td></tr>
                <tr><td style="padding:10px 0 0 0;font-size:15px;color:#ffffff;font-weight:800;border-top:1px solid #262626;">Vendor Payout</td><td style="padding:10px 0 0 0;font-size:15px;color:#ff7a00;font-weight:800;text-align:right;border-top:1px solid #262626;">₹${formatInr(calc.vendorPayout)}</td></tr>
                <tr><td style="padding:3px 0;font-size:13px;color:#a3a3a3;">Already Paid</td><td style="padding:3px 0;font-size:13px;color:#d4d4d4;text-align:right;">₹${formatInr(alreadyPaidAmount)}</td></tr>
                <tr><td style="padding:3px 0;font-size:13px;color:#a3a3a3;font-weight:700;">Payout Due</td><td style="padding:3px 0;font-size:13px;color:#ffffff;font-weight:700;text-align:right;">₹${formatInr(payoutDue)}</td></tr>
              </table>

              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#1c1c1c;border-radius:12px;padding:12px 16px;margin-bottom:20px;">
                <tr><td style="font-size:12px;color:#a3a3a3;">Status</td><td style="font-size:13px;color:${statusColor};font-weight:800;text-align:right;">${statusLabel}</td></tr>
              </table>

              <p style="margin:0;font-size:12px;color:#737373;">This is an automated GRABIT settlement report.</p>
              <p style="margin:6px 0 0 0;font-size:12px;color:#737373;">For support: <a href="mailto:support.grabit@gmail.com" style="color:#ff7a00;">support.grabit@gmail.com</a></p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  const text = `GRABIT Daily Vendor Revenue Report

Date: ${calc.displayDate}
Settlement Cycle: ${calc.windowLabel}

Vendor:
${calc.canteenName}

Orders
--------------------------------
Eligible Orders: ${calc.totalOrders}
Cancelled/Refunded: ${calc.cancelledOrdersCount}
--------------------------------

Revenue
--------------------------------
Gross Revenue: ₹${formatInr(calc.grossRevenue)}
GRABIT Commission: ₹${formatInr(calc.commissionAmount)}
Vendor Payout: ₹${formatInr(calc.vendorPayout)}
Already Paid: ₹${formatInr(alreadyPaidAmount)}
Payout Due: ₹${formatInr(payoutDue)}
--------------------------------

GRABIT Commission:
₹1 per eligible order

Status:
${statusLabel}

This is an automated GRABIT settlement report.
For support:
support.grabit@gmail.com`;

  return { subject, html, text };
}

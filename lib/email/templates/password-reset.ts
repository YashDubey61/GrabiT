function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export interface PasswordResetEmailData {
  /** The real Supabase-generated recovery link — never a hand-built URL. */
  actionLink: string;
}

/**
 * GrabIt-branded password reset email. The button always points at the
 * exact `actionLink` Supabase Auth generated (via
 * admin.generateLink({ type: "recovery" })) — this template never
 * constructs or guesses a reset URL itself, and never sees or stores
 * the underlying recovery token.
 */
export function renderPasswordResetEmail(data: PasswordResetEmailData): {
  subject: string;
  html: string;
  text: string;
} {
  const subject = "Reset your GrabIt password";
  const safeLink = escapeHtml(data.actionLink);

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
              <p style="margin:0 0 16px 0;font-size:18px;font-weight:700;color:#ffffff;">Reset your GrabIt password</p>
              <p style="margin:0 0 24px 0;font-size:14px;color:#d4d4d4;line-height:1.6;">
                We received a request to reset the password for your GrabIt account.
                Click the button below to create a new password.
              </p>

              <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto 24px auto;">
                <tr>
                  <td style="border-radius:10px;background-color:#ff7a00;">
                    <a href="${safeLink}" style="display:inline-block;padding:13px 32px;font-size:14px;font-weight:800;color:#0a0a0a;text-decoration:none;border-radius:10px;">
                      Reset Password
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin:0 0 4px 0;font-size:12px;color:#737373;line-height:1.6;">
                If you didn't request a password reset, you can safely ignore this email — your password will remain unchanged.
              </p>
              <p style="margin:16px 0 0 0;font-size:12px;color:#737373;">
                Need help? <a href="mailto:support.grabit@gmail.com" style="color:#ff7a00;">support.grabit@gmail.com</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  const text = `GRABIT

Reset your GrabIt password

We received a request to reset the password for your GrabIt account.
Open the link below to create a new password.

${data.actionLink}

If you didn't request a password reset, you can safely ignore this email — your password will remain unchanged.

Need help?
support.grabit@gmail.com`;

  return { subject, html, text };
}

import { MOCK_OTP } from "@/lib/constants";

/**
 * Mock OTP provider for local development.
 * - send() always succeeds (logs to console)
 * - verify() accepts "123456" as the valid OTP
 */
export const mockOtpProvider = {
  async send(phone: string): Promise<{ success: boolean; message: string }> {
    console.log(`[MockOTP] Sending OTP to ${phone}: ${MOCK_OTP}`);
    return { success: true, message: `OTP sent to ${phone} (use ${MOCK_OTP})` };
  },

  async verify(
    phone: string,
    otp: string
  ): Promise<{ success: boolean; message: string }> {
    const valid = otp === MOCK_OTP;
    console.log(`[MockOTP] Verifying OTP for ${phone}: ${otp} → ${valid ? "✓" : "✗"}`);
    return {
      success: valid,
      message: valid ? "OTP verified" : "Invalid OTP. Use 123456.",
    };
  },
};

import { NextResponse } from "next/server";
import { getAuthenticatedVendorContext } from "@/lib/supabase/vendor_auth";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

interface SaveBankAccountPayload {
  accountHolderName: string;
  bankName: string;
  accountNumber: string;
  ifscCode: string;
}

export async function POST(request: Request) {
  try {
    const vendorCtx = await getAuthenticatedVendorContext();
    if (!vendorCtx) {
      return NextResponse.json(
        { ok: false, error: "Access denied. Please sign in with a vendor account." },
        { status: 401 },
      );
    }

    const payload = (await request.json()) as SaveBankAccountPayload;

    const accountHolderName = payload.accountHolderName?.trim();
    const bankName = payload.bankName?.trim();
    const accountNumber = payload.accountNumber?.trim();
    const ifscCode = payload.ifscCode?.trim().toUpperCase();

    if (!accountHolderName || !bankName || !accountNumber || !ifscCode) {
      return NextResponse.json(
        { ok: false, error: "All bank account fields (Account Holder, Bank Name, Account Number, IFSC Code) are required." },
        { status: 400 },
      );
    }

    const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/;
    if (!ifscRegex.test(ifscCode)) {
      return NextResponse.json(
        { ok: false, error: "Invalid IFSC code format. Must be 11 characters starting with 4 letters, then 0, then 6 alphanumeric characters (e.g. HDFC0001234)." },
        { status: 400 },
      );
    }

    if (accountNumber.length < 5 || accountNumber.length > 20) {
      return NextResponse.json(
        { ok: false, error: "Bank account number must be between 5 and 20 digits." },
        { status: 400 },
      );
    }

    const supabase = getSupabaseAdminClient();

    const { error: updateErr } = await supabase
      .from("canteens")
      .update({
        bank_account_holder: accountHolderName,
        bank_name: bankName,
        bank_account_number: accountNumber,
        ifsc_code: ifscCode,
        payout_account_verified: true,
      })
      .eq("id", vendorCtx.canteenId);

    if (updateErr) {
      console.error("Bank account update error:", updateErr);
      return NextResponse.json(
        { ok: false, error: updateErr.message || "Failed to save bank account details." },
        { status: 400 },
      );
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Bank account save error:", err);
    return NextResponse.json(
      { ok: false, error: "Internal server error." },
      { status: 500 },
    );
  }
}

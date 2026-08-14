/**
 * Razorpay integration — INTENTIONALLY NOT IMPLEMENTED.
 *
 * Per the Day 1 foundation brief (Step 10), payment integration is deferred
 * to a controlled later phase. This file exists only to hold the module's
 * place in lib/payments/ so imports and folder structure don't need to
 * change when it's built.
 *
 * When implemented, this must follow TRD §5.4 (Vendor Settlement Flow) and
 * §8 (Security & Compliance): payment data never touches GrabIt's own
 * servers directly — handled via Razorpay's hosted checkout/webhooks.
 */
export {};

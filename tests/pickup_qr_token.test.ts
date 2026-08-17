import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import {
  PICKUP_QR_PREFIX,
  buildPickupQrPayload,
  parsePickupQrPayload,
} from "@/lib/orders/pickup_qr";

const validToken = () => randomBytes(32).toString("hex");

describe("GRABIT Pickup QR token contract", () => {
  it("round-trips a valid token through build/parse", () => {
    const token = validToken();
    const payload = buildPickupQrPayload(token);
    assert.equal(payload, `${PICKUP_QR_PREFIX}${token}`);
    assert.equal(parsePickupQrPayload(payload), token);
  });

  it("produces a distinct payload for every order token", () => {
    const payloads = new Set(
      Array.from({ length: 200 }, () => buildPickupQrPayload(validToken())),
    );
    assert.equal(payloads.size, 200, "every generated QR payload must be unique");
  });

  it("rejects QR codes that are not GRABIT pickup codes", () => {
    assert.equal(parsePickupQrPayload("https://example.com"), null);
    assert.equal(parsePickupQrPayload("random text"), null);
    assert.equal(parsePickupQrPayload(""), null);
    assert.equal(parsePickupQrPayload("GRABIT:SOMETHING_ELSE:abc"), null);
  });

  it("rejects malformed / guessable tokens", () => {
    // Sequential or short ids must never validate as tokens.
    assert.equal(parsePickupQrPayload(buildPickupQrPayload("1197")), null);
    assert.equal(parsePickupQrPayload(buildPickupQrPayload("order_1197")), null);
    // Right length, wrong alphabet.
    assert.equal(parsePickupQrPayload(buildPickupQrPayload("Z".repeat(64))), null);
    // Hex but too short.
    assert.equal(parsePickupQrPayload(buildPickupQrPayload("ab".repeat(20))), null);
  });

  it("tolerates surrounding whitespace from scanner output", () => {
    const token = validToken();
    assert.equal(parsePickupQrPayload(`  ${buildPickupQrPayload(token)}  `), token);
  });
});

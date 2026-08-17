import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { isValidOrderStatusTransition, validateOrderStatusTransition } from "@/lib/orders/status_transitions";

describe("GRABIT Order Fulfillment Lifecycle Transition Rules", () => {
  it("allows valid forward status transitions", () => {
    assert.equal(isValidOrderStatusTransition("placed", "preparing"), true);
    assert.equal(isValidOrderStatusTransition("placed", "cancelled"), true);
    assert.equal(isValidOrderStatusTransition("preparing", "ready"), true);
    assert.equal(isValidOrderStatusTransition("preparing", "cancelled"), true);
    assert.equal(isValidOrderStatusTransition("ready", "picked_up"), true);
    assert.equal(isValidOrderStatusTransition("picked_up", "completed"), true);
  });

  it("blocks invalid status skips and backwards transitions", () => {
    assert.equal(isValidOrderStatusTransition("placed", "ready"), false);
    assert.equal(isValidOrderStatusTransition("placed", "picked_up"), false);
    assert.equal(isValidOrderStatusTransition("placed", "completed"), false);
    assert.equal(isValidOrderStatusTransition("preparing", "picked_up"), false);
    assert.equal(isValidOrderStatusTransition("preparing", "completed"), false);
    assert.equal(isValidOrderStatusTransition("ready", "completed"), false);
    assert.equal(isValidOrderStatusTransition("ready", "preparing"), false);
    assert.equal(isValidOrderStatusTransition("ready", "cancelled"), false);
    assert.equal(isValidOrderStatusTransition("picked_up", "preparing"), false);
    assert.equal(isValidOrderStatusTransition("picked_up", "ready"), false);
    assert.equal(isValidOrderStatusTransition("picked_up", "cancelled"), false);
    assert.equal(isValidOrderStatusTransition("completed", "preparing"), false);
    assert.equal(isValidOrderStatusTransition("completed", "cancelled"), false);
    assert.equal(isValidOrderStatusTransition("cancelled", "preparing"), false);
    assert.equal(isValidOrderStatusTransition("cancelled", "ready"), false);
  });

  it("enforces per-role transition permissions", () => {
    assert.equal(validateOrderStatusTransition("placed", "preparing", "vendor").ok, true);
    assert.equal(validateOrderStatusTransition("placed", "preparing", "student").ok, false);
    assert.equal(validateOrderStatusTransition("ready", "picked_up", "student").ok, true);
    assert.equal(validateOrderStatusTransition("ready", "picked_up", "vendor").ok, false);
  });
});

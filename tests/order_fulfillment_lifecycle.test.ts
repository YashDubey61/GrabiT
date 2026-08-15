import { describe, it } from "node:test";
import assert from "node:assert/strict";

type OrderStatus =
  | "placed"
  | "preparing"
  | "ready"
  | "picked_up"
  | "completed"
  | "cancelled";

const VALID_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  placed: ["preparing", "cancelled"],
  preparing: ["ready", "cancelled"],
  ready: ["picked_up"],
  picked_up: ["completed"],
  completed: [],
  cancelled: [],
};

function isValidTransition(current: OrderStatus, next: OrderStatus): boolean {
  return (VALID_TRANSITIONS[current] ?? []).includes(next);
}

describe("GRABIT Order Fulfillment Lifecycle Transition Rules", () => {
  it("allows valid forward status transitions", () => {
    assert.equal(isValidTransition("placed", "preparing"), true);
    assert.equal(isValidTransition("placed", "cancelled"), true);
    assert.equal(isValidTransition("preparing", "ready"), true);
    assert.equal(isValidTransition("preparing", "cancelled"), true);
    assert.equal(isValidTransition("ready", "picked_up"), true);
    assert.equal(isValidTransition("picked_up", "completed"), true);
  });

  it("blocks invalid status skips and backwards transitions", () => {
    assert.equal(isValidTransition("placed", "ready"), false);
    assert.equal(isValidTransition("placed", "picked_up"), false);
    assert.equal(isValidTransition("placed", "completed"), false);
    assert.equal(isValidTransition("preparing", "picked_up"), false);
    assert.equal(isValidTransition("preparing", "completed"), false);
    assert.equal(isValidTransition("ready", "completed"), false);
    assert.equal(isValidTransition("ready", "preparing"), false);
    assert.equal(isValidTransition("ready", "cancelled"), false);
    assert.equal(isValidTransition("picked_up", "preparing"), false);
    assert.equal(isValidTransition("picked_up", "ready"), false);
    assert.equal(isValidTransition("picked_up", "cancelled"), false);
    assert.equal(isValidTransition("completed", "preparing"), false);
    assert.equal(isValidTransition("completed", "cancelled"), false);
    assert.equal(isValidTransition("cancelled", "preparing"), false);
    assert.equal(isValidTransition("cancelled", "ready"), false);
  });
});

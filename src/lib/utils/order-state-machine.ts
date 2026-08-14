import { OrderState, ORDER_STATES } from "@/lib/constants";

const VALID_TRANSITIONS: Record<OrderState, OrderState[]> = {
  [ORDER_STATES.PLACED]: [ORDER_STATES.PREPARING],
  [ORDER_STATES.PREPARING]: [ORDER_STATES.READY],
  [ORDER_STATES.READY]: [],
};

export function canTransition(
  from: OrderState,
  to: OrderState
): boolean {
  return VALID_TRANSITIONS[from]?.includes(to) ?? false;
}

export function getNextState(current: OrderState): OrderState | null {
  const next = VALID_TRANSITIONS[current];
  return next?.length ? next[0] : null;
}

export function getStateIndex(state: OrderState): number {
  const order: OrderState[] = [
    ORDER_STATES.PLACED,
    ORDER_STATES.PREPARING,
    ORDER_STATES.READY,
  ];
  return order.indexOf(state);
}

export function isTerminalState(state: OrderState): boolean {
  return state === ORDER_STATES.READY;
}

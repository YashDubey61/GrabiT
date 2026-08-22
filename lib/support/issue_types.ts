export type OrderIssueTypeId =
  | "ORDER_NOT_RECEIVED"
  | "WRONG_ITEM"
  | "MISSING_ITEM"
  | "QUALITY_ISSUE"
  | "PAYMENT_ISSUE"
  | "REFUND_ISSUE"
  | "OTHER";

export interface OrderIssueType {
  id: OrderIssueTypeId;
  label: string;
}

export const ORDER_ISSUE_TYPES: OrderIssueType[] = [
  { id: "ORDER_NOT_RECEIVED", label: "Order not received" },
  { id: "WRONG_ITEM", label: "Wrong item" },
  { id: "MISSING_ITEM", label: "Missing item" },
  { id: "QUALITY_ISSUE", label: "Food/product quality issue" },
  { id: "PAYMENT_ISSUE", label: "Payment issue" },
  { id: "REFUND_ISSUE", label: "Refund issue" },
  { id: "OTHER", label: "Other" },
];

export function isOrderIssueTypeId(value: unknown): value is OrderIssueTypeId {
  return ORDER_ISSUE_TYPES.some((t) => t.id === value);
}

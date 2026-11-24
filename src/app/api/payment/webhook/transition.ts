export const TERMINAL_STATES = new Set(["refunded", "cancelled", "completed"]);

export const PAID_ALLOWED_NEXT = new Set([
  "paid",
  "in_progress",
  "delivered",
  "review",
  "review_pending",
  "revision_requested",
  "completed",
  "refund_requested",
  "refunded",
  "cancelled",
]);

export function canTransition(current: string | null | undefined, next: string): boolean {
  if (!current) return true;
  if (current === next) return true;
  if (TERMINAL_STATES.has(current)) return false;
  if (current === "paid") return PAID_ALLOWED_NEXT.has(next);
  return true;
}

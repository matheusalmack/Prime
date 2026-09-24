// Offer IDs supplied by the merchant. Discount changes price, never entitlement.
export const OFFER_PLANS = Object.freeze({
  X1XE2DU: 'monthly', '2E2RG39': 'monthly',
  ENMG0W8: 'lifetime', L83RFTI: 'lifetime',
});
const STATUSES = Object.freeze({
  approved: 'approved', paid: 'approved', completed: 'approved', success: 'approved',
  pending: 'pending', waiting_payment: 'pending', processing: 'pending',
  refunded: 'refunded', refund: 'refunded',
  chargeback: 'chargeback', disputed: 'chargeback', dispute: 'chargeback',
  cancelled: 'cancelled', canceled: 'cancelled',
});
export function resolvePaymentStatus(value) {
  // Never approve values such as "unapproved", "not_paid" or "unsuccessful".
  return STATUSES[String(value ?? '').trim().toLowerCase()] ?? null;
}
export function resolveOfferPlan(offer) {
  return OFFER_PLANS[String(offer ?? '').trim().toUpperCase()] ?? null;
}
export function parsePaymentDate(value) {
  if (typeof value !== 'string' || !value.trim()) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

// Official Applyfy v1: /docs/v1/webhooks/payment. Token is in the JSON body.
const EVENTS = Object.freeze({
  TRANSACTION_CREATED: 'pending', TRANSACTION_PAID: 'approved',
  TRANSACTION_CANCELED: 'cancelled', TRANSACTION_REFUNDED: 'refunded',
  TRANSACTION_CHARGED_BACK: 'chargeback',
});
export function normalizeApplyfyPayment(payload, expectedPlan) {
  const status = EVENTS[payload?.event];
  if (!status) return null;
  const plan = resolveOfferPlan(payload.offerCode);
  if (!plan || plan !== expectedPlan) throw new Error('Unsupported offer');
  const transaction = payload.transaction;
  const email = typeof payload.client?.email === 'string' ? payload.client.email.trim().toLowerCase() : '';
  const id = typeof transaction?.id === 'string' ? transaction.id.trim() : '';
  const paidAt = parsePaymentDate(transaction?.payedAt);
  if (!id || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error('Invalid transaction');
  if (status === 'approved' && (!paidAt || transaction.status !== 'COMPLETED')) throw new Error('Invalid approval');
  return {
    p_gateway: 'applyfy', p_event_id: `${id}:${payload.event}`, p_event_type: payload.event,
    p_order_id: id, p_email: email, p_plan_code: plan, p_status: status,
    p_paid_at: paidAt, p_period_starts_at: null, p_period_ends_at: null,
    // Keep only the fields needed to audit access. Never persist the webhook token.
    p_payload: {event:payload.event,offerCode:payload.offerCode,transaction:{id,status:transaction.status,payedAt:paidAt}},
  };
}

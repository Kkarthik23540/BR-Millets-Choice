export const ORDER_TRANSITIONS = Object.freeze({
  awaiting_confirmation: ['confirmed', 'rejected', 'cancelled'],
  confirmed: ['preparing', 'rejected', 'cancelled'],
  preparing: ['ready_for_dispatch', 'cancelled'],
  ready_for_dispatch: ['shipped', 'out_for_delivery', 'cancelled'],
  shipped: ['out_for_delivery', 'delivered'],
  out_for_delivery: ['delivered'],
  delivered: [],
  rejected: [],
  cancelled: [],
});

export function canTransitionOrder(from, to) {
  return ORDER_TRANSITIONS[from]?.includes(to) ?? false;
}

export function stockAvailability(quantity, lowStockThreshold) {
  if (quantity <= 0) return 'out_of_stock';
  if (quantity <= lowStockThreshold) return 'low_stock';
  return 'in_stock';
}

export function formatRupees(paise) {
  return `₹${(Number(paise) / 100).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

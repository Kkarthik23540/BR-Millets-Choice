export const ORDER_TRANSITIONS = Object.freeze({
  awaiting_confirmation: ['confirmed', 'preparing', 'rejected', 'cancelled'],
  confirmed: ['preparing', 'ready_for_dispatch', 'shipped', 'out_for_delivery', 'cancelled', 'rejected'],
  preparing: ['ready_for_dispatch', 'shipped', 'out_for_delivery', 'cancelled'],
  ready_for_dispatch: ['shipped', 'out_for_delivery', 'delivered', 'cancelled'],
  shipped: ['out_for_delivery', 'delivered', 'cancelled'],
  out_for_delivery: ['delivered', 'cancelled'],
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

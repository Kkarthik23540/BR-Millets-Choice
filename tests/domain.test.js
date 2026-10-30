import test from 'node:test';
import assert from 'node:assert/strict';
import { canTransitionOrder, stockAvailability } from '../server/domain.js';

test('order workflow accepts only explicitly allowed transitions', () => {
  assert.equal(canTransitionOrder('awaiting_confirmation', 'confirmed'), true);
  assert.equal(canTransitionOrder('awaiting_confirmation', 'cancelled'), true);
  assert.equal(canTransitionOrder('confirmed', 'preparing'), true);
  assert.equal(canTransitionOrder('preparing', 'delivered'), false);
  assert.equal(canTransitionOrder('delivered', 'cancelled'), false);
  assert.equal(canTransitionOrder('unknown', 'confirmed'), false);
});

test('inventory availability distinguishes empty, low and normal stock', () => {
  assert.equal(stockAvailability(0, 5), 'out_of_stock');
  assert.equal(stockAvailability(5, 5), 'low_stock');
  assert.equal(stockAvailability(6, 5), 'in_stock');
});

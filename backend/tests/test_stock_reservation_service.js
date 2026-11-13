const test = require('node:test');
const assert = require('node:assert/strict');
const stockReservationService = require('../src/services/stockReservationService');

test('aggregates active reserved quantities by product ID in one lookup', async () => {
  let query;
  const client = {
    stockReservation: {
      findMany: async (args) => {
        query = args;
        return [
          { items: [{ productId: 'p1', quantity: 2 }, { productId: 'p2', quantity: 1 }] },
          { items: [{ productId: 'p1', quantity: 3 }, { productId: 'outside', quantity: 9 }] },
          { items: null },
        ];
      },
    },
  };

  const held = await stockReservationService.getHeldQuantities(['p1', 'p2', 'p1'], 'order-ignore', client);
  assert.deepEqual([...held.entries()], [['p1', 5], ['p2', 1]]);
  assert.equal(query.where.orderId.not, 'order-ignore');
  assert.deepEqual(query.select, { items: true });
});

test('returns zero for products without active reservations and skips empty lookups', async () => {
  let queryCount = 0;
  const client = {
    stockReservation: {
      findMany: async () => {
        queryCount += 1;
        return [{ items: [{ productId: 'p1', quantity: 1 }] }];
      },
    },
  };
  const held = await stockReservationService.getHeldQuantities(['p2'], null, client);
  const empty = await stockReservationService.getHeldQuantities([], null, client);

  assert.equal(held.get('p2'), 0);
  assert.equal(empty.size, 0);
  assert.equal(queryCount, 1);
});

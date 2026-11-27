var test = require('node:test');
var assert = require('node:assert/strict');

var pricing = require('../lib/pricing');
var invoice = require('../lib/invoice');
var reports = require('../lib/reports');

test('invoice uses the ledger HSN slab and applies GST after the coupon discount', function () {
  var items = [{ id: 1, name: 'Rice', hsn: '1006', price: 100, qty: 1 }];
  var ledger = pricing.computeTotals(items, 'WELCOME');
  var order = {
    id: 1,
    date: '2026-01-01',
    items: items,
    coupon: 'WELCOME',
    subtotal: ledger.subtotal,
    discount: ledger.discount,
    tax: ledger.tax,
    total: ledger.total
  };
  var billed = invoice.computeInvoiceFigures(order);

  assert.deepEqual(
    { subtotal: ledger.subtotal, discount: ledger.discount, tax: ledger.tax, total: ledger.total },
    { subtotal: 100, discount: 5, tax: 4.75, total: 99.75 }
  );
  assert.deepEqual(
    { subtotal: billed.subtotal, discount: billed.discount, tax: billed.tax, total: billed.total },
    { subtotal: 100, discount: 5, tax: 4.75, total: 99.75 }
  );
  assert.equal(billed.rows[0].gstPercent, 5);
  assert.equal(billed.rows[0].lineTax, 4.75);

  var reconciliation = reports.getGstReconciliation({ orders: [order] });
  assert.equal(reconciliation.mismatchCount, 0);
  assert.equal(reconciliation.rows[0].delta, 0);
});

test('invoice coupon discount uses the same maximum cap as the ledger', function () {
  var items = [{ id: 2, name: 'Bulk goods', hsn: '1006', price: 2000, qty: 1 }];
  var ledger = pricing.computeTotals(items, 'SAVE10');
  var order = { id: 2, items: items, coupon: 'SAVE10', total: ledger.total };
  var billed = invoice.computeInvoiceFigures(order);

  assert.equal(ledger.discount, 150);
  assert.equal(billed.discount, 150);
  assert.equal(billed.tax, 92.5);
  assert.equal(billed.total, ledger.total);
});

test('invoice respects a zero GST rate on an invoice line', function () {
  var billed = invoice.computeInvoiceFigures({
    id: 3,
    items: [{ name: 'Exempt line', price: 100, qty: 1, gstRate: 0 }]
  });

  assert.equal(billed.rows[0].gstPercent, 0);
  assert.equal(billed.tax, 0);
  assert.equal(billed.total, 100);
});

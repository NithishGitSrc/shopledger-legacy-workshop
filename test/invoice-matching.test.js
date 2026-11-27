var test = require('node:test');
var assert = require('node:assert/strict');

var pricing = require('../lib/pricing');
var invoice = require('../lib/invoice');

test('invoice GST and total match the amounts recorded when the order was billed', function () {
  var items = [{ id: 1, name: 'Rice', hsn: '1006', price: 100, qty: 1 }];
  var charged = pricing.computeTotals(items, 'WELCOME');
  var order = {
    id: 1001,
    items: items,
    coupon: 'WELCOME',
    subtotal: charged.subtotal,
    discount: charged.discount,
    tax: charged.tax,
    total: charged.total
  };
  var printed = invoice.computeInvoiceFigures(order);

  assert.equal(printed.tax, order.tax);
  assert.equal(printed.total, order.total);
  assert.equal(printed.rows.reduce(function (sum, row) { return sum + row.lineTax; }, 0), order.tax);
});

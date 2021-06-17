// const mongoose = require('mongoose');
const Order = require('../../src/models/order.model');

//   _id: mongoose.Types.ObjectId(),

const nzd100aud90 = {
  have: 'nzd',
  haveAmount: '100',
  want: 'aud',
  wantAmount: '90',
  status: '0',
};

const aud90nzd100 = {
  have: 'aud',
  haveAmount: '90',
  want: 'nzd',
  wantAmount: '100',
  status: '0',
};

const usd70nzd100 = {
  have: 'usd',
  haveAmount: '70',
  want: 'nzd',
  wantAmount: '100',
  status: '0',
};

const insertOrders = async (orders) => {
  await Order.insertMany(orders.map((order) => ({ ...order })));
};

module.exports = {
  nzd100aud90,
  aud90nzd100,
  usd70nzd100,
  insertOrders,
};

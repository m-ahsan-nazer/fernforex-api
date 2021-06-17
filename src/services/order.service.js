const mongoose = require('mongoose');
const httpStatus = require('http-status');
const { Order } = require('../models');
const { getUserById } = require("./user.service");
const ApiError = require('../utils/ApiError');

/**
 * Create an order
 * @param {Object} orderBody
 * @returns {Promise<Order>}
 */
const createOrder = async (orderBody) => {
  /*
   *No checks performed to ignore identical orders
   */
  const order = await Order.create(orderBody);
  return order;
};

/**
 * Query for orders
 * @param {Object} filter - Mongo filter
 * @param {Object} options - Query options
 * @param {string} [options.sortBy] - Sort option in the format: sortField:(desc|asc)
 * @param {number} [options.limit] - Maximum number of results per page (default = 10)
 * @param {number} [options.page] - Current page (default = 1)
 * @returns {Promise<QueryResult>}
 */
// const queryOrders = async (filter, options) => {
// const orders = await Order.paginate(filter, options);
const queryOrders = async (userId) => {
  const orders = await Order.find({ userId });
  const cancelledOrders = orders.filter((order) => order.status === -1);
  const pastOrders = orders.filter((order) => order.status === 1);
  const pendingOrders = orders.filter((order) => order.status === 0);
  return { orders: { cancelledOrders, pendingOrders, pastOrders } };
};

const pairOrder = async (userId, orderId) => {
  //  find user's order with id=orderId
  // repeating as order is populated with ref model values
  const rejected = await Order.findById(orderId).select('rejects');
  const order = await Order.findById(orderId)
    .select('have haveAmount want wantAmount status rejects')
    .populate({ path: 'rejects', select: 'have haveAmount want wantAmount' });

  const margin = 0.2;
  const minAmount = order.wantAmount * (1 - margin);
  const maxAmount = order.wantAmount * (1 + margin);
  // Now match candidates exclude order.rejects and meet other requirements
  const matchedOrder = await Order.findOne({
    // userId: {$ne: mongoose.SchemaTypes.ObjectId(userId)}, //unlike for $nin this does not work
    userId: { $ne: userId }, // ignore the orders by the user themselves
    have: order.want, // should have what I want
    want: order.have,
    // $and: [{ status: { $ne: -1 } }, { status: { $ne: 1 } }], // remove cancelled and accepted orders from search
    // eslint-disable-next-line prettier/prettier
    $or: [{ status: { $eq: 0 } },// retrieve pending orders or orders that have accepted current order
      { $and: [{ status: { $eq: 1 } }, { 'details.orderId': { $eq: mongoose.Types.ObjectId(orderId) } }] },
    ], // mongoose.Types.ObjectId cast is required for sub-document.
    _id: {
      $nin: rejected.rejects, // exclude orders that orderId has rejected
    },
    rejects: { $nin: [orderId] }, // exclude orders that have rejected orderId
  })
    // eslint-disable-next-line prettier/prettier
    .where('haveAmount').gte(minAmount).lte(maxAmount) // matched orders should be within 20% range
    .select('have haveAmount want wantAmount userId')
    .populate({ path: 'userId', select: 'name email' });

  return { order, matchedOrder, rejects: rejected.rejects };
};

/**
 * Get order by id
 * @param {ObjectId} id
 * @returns {Promise<Order>}
 */
const getOrderById = async (id) => {
  return Order.findById(id);
};

/**
 * Get order by userId
 * @param {ObjectId} userId
 * @returns {Promise<Order>}
 */
const getOrderByUserId = async (userId) => {
  return Order.findOne({ user: userId });
};

/**
 * Update order by id
 * @param {ObjectId} orderId
 * @param {Object} updateBody
 * @returns {Promise<Order>}
 */
const updateOrderById = async (userId, orderId, updateBody) => {
  const user = await getUserById(userId);
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }

  let order;
  if (user.role === 'user') {
    order = await Order.findById(orderId).where('userId').eq(userId);
  } else if (user.role === 'admin') {
    order = await Order.findById(orderId).where('userId');
  }
  if (!order) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Order not found');
  }

  if (order.status === -1) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Can not update a cancelled order.');
  }
  if (order.status === 1) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Can not update an already accepted order.');
  }
  // First push all the rejects
  if (updateBody.hasOwnProperty('rejects')) {
    order.rejects.push.apply(order.rejects, updateBody.rejects);
    // Second remove the rejects from the body
    delete updateBody.rejects;
  }
  // Now assign all of the remaining keys
  Object.assign(order, updateBody);
  await order.save();
  return order;
};

/**
 * Delete order by id
 * @param {ObjectId} orderId
 * @returns {Promise<Order>}
 */
const deleteOrderById = async (orderId) => {
  const order = await getOrderById(orderId);
  if (!order) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Order not found');
  }

  await order.remove();
  return order;
};

module.exports = {
  createOrder,
  queryOrders,
  pairOrder,
  getOrderById,
  getOrderByUserId,
  updateOrderById,
  deleteOrderById,
};

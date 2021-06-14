const httpStatus = require('http-status');
const { Order } = require('../models');
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
    $and: [{ status: { $ne: -1 } }, { status: { $ne: 1 } }], // remove cancelled and accepted orders from search
    _id: {
      $nin: rejected.rejects,
    },
  })
    .where('haveAmount')
    .gte(minAmount)
    .lte(maxAmount)
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
const updateOrderById = async (orderId, updateBody) => {
  const order = await getOrderById(orderId);
  if (!order) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Order not found');
  }
  //   if ((await Order.isOrderPending(orderId))) {
  // throw new ApiError(httpStatus.BAD_REQUEST, 'Can only change pending a order');
  //   }
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

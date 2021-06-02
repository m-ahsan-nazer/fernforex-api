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
const queryOrders = async (filter, options) => {
  const orders = await Order.paginate(filter, options);
  return orders;
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
 * Get order by user.id 
 * @param {ObjectId} userId
 * @returns {Promise<Order>}
 */
const getOrderByUserId= async (userId) => {
  return Order.findOne({ user: userId});
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
  if (order.status == -1){
    throw new ApiError(httpStatus.BAD_REQUEST, 'Can not update a cancelled order');
  }
  if (order.status == 1){
    throw new ApiError(httpStatus.BAD_REQUEST, 'Can not update a rejected/accepted order');
  }
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
  getOrderById,
  getOrderByUserId,
  updateOrderById,
  deleteOrderById,
};

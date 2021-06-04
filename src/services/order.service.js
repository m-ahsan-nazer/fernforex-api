const mongoose = require('mongoose');
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
  const orders = await Order.find({userId})
  cancelledOrders = orders.filter(order=>order.status == -1);
  pastOrders = orders.filter(order=>order.status == 1);
  pendingOrders = orders.filter(order=>order.status == 0);
  return {orders: {cancelledOrders, pendingOrders, pastOrders}};
};

const queryMatchedOrders = async (userId, orderId) => {
  // const orders = await Order.paginate(filter, options);
  const order = await Order.findById(orderId);
  const rate = order.haveAmount/order.wantAmount;
  const margin = 0.2;
  const minAmount = order.wantAmount*(1.-margin);
  const maxAmount = order.wantAmount*(1.+margin);
  const temp = await Order.find({userId: userId});
  console.log("temp: ", temp);
  // const rejectedUsers = await Order.find({
  //    have: order.have, 
  //                   haveAmount: order.haveAmount,
  //                   want: order.want,
  //                   wantAmount: order.wantAmount, status: {$eq: 1}})
  //                   .where('details.accepted').equals(false)
  //                   .select("details.userId -_id");
  // const ObjectId = mongoose.SchemaTypes.ObjectId;
  //rejectedOrders includes both accepted and rejected orders, should be called resolved orders
  let rejectedOrders= await Order.find(
    {"details.userId":mongoose.Types.ObjectId(userId)}).select("_id");
    // {"details.userId":userId}).select("_id"); does not work
  console.log("rejectedOrders obj list: ", rejectedOrders);
  //convert to array of ids
  rejectedOrders = rejectedOrders.map(e=>e._id);
  console.log("rejectedOrders list: ", rejectedOrders);
  const matchedOrders = await Order.find({have: order.want, want: order.have, 
                                    // status: {$ne: -1, $ne: 1}, userId: {"$ne": rejectedUsers}})
                                    $and: [{status: {$ne: -1}}, {status: {$ne: 1}}],
                                    "_id": {$nin: rejectedOrders}
                                  })
                                   .where('haveAmount').gte(minAmount).lte(maxAmount);
  return matchedOrders;
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
  queryMatchedOrders,
  getOrderById,
  getOrderByUserId,
  updateOrderById,
  deleteOrderById,
};

const Joi = require('joi');
const { password, objectId } = require('./custom.validation');

const createOrder = {
  params: Joi.object().keys({
    userId: Joi.string().custom(objectId),
  }),
  body: Joi.object().keys({
      have: Joi.string().required(),
      haveAmount: Joi.number().integer().required(),
      want: Joi.string().required(),
      wantAmount: Joi.number().integer().required(),
  }),
};

const getOrders = {
  query: Joi.object().keys({
    have: Joi.string(),
    want: Joi.string(),
    sortBy: Joi.string(),
    limit: Joi.number().integer(),
    page: Joi.number().integer(),
  }),
};

const getOrder = {
  params: Joi.object().keys({
    userId: Joi.string().custom(objectId),
    orderId: Joi.string().custom(objectId),
  }),
};

const updateOrder = {
  params: Joi.object().keys({
    userId: Joi.string().custom(objectId),
    orderId: Joi.required().custom(objectId),
  }),
  body: Joi.object()
    .keys({
      have: Joi.string().required(),
      haveAmount: Joi.number().integer().required(),
      want: Joi.string().required(),
      wantAmount: Joi.number().integer().required(),
      status: Joi.number().integer(),
      details: {
        accepted: Joi.boolean(),
        userId: Joi.string().custom(objectId)
      }
    })
    .min(1),
};

const deleteOrder = {
  params: Joi.object().keys({
    userId: Joi.string().custom(objectId),
    orderId: Joi.string().custom(objectId),
  }),
};

module.exports = {
  createOrder,
  getOrders,
  getOrder,
  updateOrder,
  deleteOrder,
};

const Joi = require('joi');
const { password, objectId } = require('./custom.validation');

const createOrder = {
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
    orderId: Joi.string().custom(objectId),
  }),
};

const updateOrder = {
  params: Joi.object().keys({
    orderId: Joi.required().custom(objectId),
  }),
  body: Joi.object()
    .keys({
      have: Joi.string().required(),
      haveAmount: Joi.number().integer().required(),
      want: Joi.string().required(),
      wantAmount: Joi.number().integer().required(),
    })
    .min(1),
};

const deleteOrder = {
  params: Joi.object().keys({
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

const express = require('express');
const auth = require('../../middlewares/auth');
const validate = require('../../middlewares/validate');
const orderValidation = require('../../validations/order.validation');
const orderController = require('../../controllers/order.controller');

const router = express.Router();

router
  .post('/', validate(orderValidation.createOrder), orderController.createOrder)
  .get('/', validate(orderValidation.getOrders), orderController.getOrders);

  // .post(auth('manageUsers'), validate(orderValidation.createOrder), orderController.createOrder)
  // .get(auth('getUsers'), validate(orderValidation.getOrders), orderController.getOrders);

// router
//   .route('/:orderId')
//   .get(auth('getUsers'), validate(orderValidation.getOrder), orderController.getOrder)
//   .patch(auth('manageUsers'), validate(orderValidation.updateOrder), orderController.updateOrder)
//   .delete(auth('manageUsers'), validate(orderValidation.deleteOrder), orderController.deleteOrder);

module.exports = router;

/**
 * @swagger
 * tags:
 *   name: Orders 
 *   description: Order management and retrieval
 */

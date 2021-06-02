const express = require('express');
const auth = require('../../middlewares/auth');
const validate = require('../../middlewares/validate');
const orderValidation = require('../../validations/order.validation');
const orderController = require('../../controllers/order.controller');

const router = express.Router();

//only managers can delete orders
router
  .route('/')
  .delete(auth('manageUsers'), validate(orderValidation.deleteOrder), orderController.deleteOrder);

router
  .route('/:userId')
  .get(auth('getUsers'), validate(orderValidation.getOrders), orderController.getOrders)
  .post(auth('manageUsers'), validate(orderValidation.createOrder), orderController.createOrder);

//users can only cancel or accept/reject orders
router
  .route('/:userId/:orderId')
  .get(auth('getUsers'), validate(orderValidation.getOrder), orderController.getOrder)
  .patch(auth('manageUsers'), validate(orderValidation.updateOrder), orderController.updateOrder)


module.exports = router;

/**
 * @swagger
 * tags:
 *   name: Orders 
 *   description: Order management and retrieval
 */
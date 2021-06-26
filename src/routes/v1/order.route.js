const express = require('express');
const auth = require('../../middlewares/auth');
const validate = require('../../middlewares/validate');
const orderValidation = require('../../validations/order.validation');
const orderController = require('../../controllers/order.controller');

const router = express.Router();

// only managers can delete orders
// eslint-disable-next-line prettier/prettier
router
  .route('/:orderId')
  .delete(auth('manageUsers'), validate(orderValidation.deleteOrder), orderController.deleteOrder);

router
  .route('/:userId')
  .get(auth('manageUsers'), validate(orderValidation.getOrders), orderController.getOrders)
  .post(auth('manageUsers'), validate(orderValidation.createOrder), orderController.createOrder);

// users can only cancel or accept/reject orders
router
  .route('/:userId/:orderId')
  .get(auth('getUsers'), validate(orderValidation.getOrder), orderController.getOrder)
  .patch(auth('manageUsers'), validate(orderValidation.updateOrder), orderController.updateOrder);

// eslint-disable-next-line prettier/prettier
router
  .route('/matches/:userId/:orderId')
  .post(auth('getUsers'),  orderController.getMatchedOrders)
// .post(auth('getUsers'), validate(orderValidation.getOrder), orderController.getMatchedOrders)

module.exports = router;

/**
 * @swagger
 * tags:
 *   name: Orders
 *   description: Order management and retrieval
 */

/**
 * @swagger
 * /users/orders/{userId}:
 *   post:
 *     summary: Create an order for userId
 *     description: Create a new order for user with id userId. Only admins should be able to create orders for other users.
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User id
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - have
 *               - haveAmount
 *               - want
 *               - wantAmount
 *             properties:
 *               have:
 *                 type: string
 *                 description: The currency user wants to exchange
 *               haveAmount:
 *                 type: number
 *                 description: The amount the user wants to exchange
 *               want:
 *                 type: string
 *                 description: The currency user wants in exchange
 *               wantAmount:
 *                 type: number
 *                 description: The amount the user wants in exchange
 *             example:
 *               have: nzd
 *               haveAmount: 100
 *               want: aud
 *               wantAmount: 95
 *     responses:
 *       "201":
 *         description: Created
 *         content:
 *           application/json:
 *             schema:
 *                $ref: '#/components/schemas/Order'
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 *       "403":
 *         $ref: '#/components/responses/Forbidden'
 *
 *   get:
 *     summary: Get a user's orders
 *     description: Logged in users can fetch only their own orders information. Only admins can fetch other users' orders. Rejects array contains ids of orders rejected by orderId. A status of -1 indicates order was cancelled, 0 is pending and 1 means orderId has accepted another order as a match.
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User id
 *     responses:
 *       "200":
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *                $ref: '#/components/schemas/Order'
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 *       "403":
 *         $ref: '#/components/responses/Forbidden'
 *       "404":
 *         $ref: '#/components/responses/NotFound'
 *
 */

/**
 * @swagger
 * /users/orders/{userId}/{orderId}:
 *   get:
 *     summary: Get order by user
 *     description: Logged in users can get their order with id orderId. Only admins can fetch other users' order.
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User id
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *         description: Order id
 *     responses:
 *       "200":
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *                $ref: '#/components/schemas/Order'
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 *       "403":
 *         $ref: '#/components/responses/Forbidden'
 *       "404":
 *         $ref: '#/components/responses/NotFound'
 *
 *   patch:
 *     summary: Update an order by a user
 *     description: Logged in users can only update their own orders. Only admins can update other users' orders. userId can not be changed. have/want currency types can not be updated only their amounts can be changed. Status can only change from 0 to 1 or -1. Orders with status 1/-1 can not be updated.
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User id
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *         description: Order id
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               have:
 *                 type: string
 *                 description: The currency user wants to exchange
 *               haveAmount:
 *                 type: number
 *                 description: The amount the user wants to exchange
 *               want:
 *                 type: string
 *                 description: The currency user wants in exchange
 *               wantAmount:
 *                 type: number
 *                 description: The amount the user wants in exchange
 *             example:
 *               haveAmount: 1000
 *               wantAmount: 950
 *               rejects: [3ebac534954b54139806c112]
 *     responses:
 *       "200":
 *         description: OK
 *         content:
 *           application/json:
 *               type: object
 *               example:
 *                 id: 4ebac534954b54139806c112
 *                 have: 'nzd'
 *                 haveAmount: 1000
 *                 want: 'aud'
 *                 wantAmount: 950
 *                 userId: 5ebac534954b54139806c112
 *                 status: 0
 *                 rejects: [3ebac534954b54139806c112]
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 *       "403":
 *         $ref: '#/components/responses/Forbidden'
 *       "404":
 *         $ref: '#/components/responses/NotFound'
 */

/**
 * @swagger
 * /users/orders/{orderId}:
 *   delete:
 *     summary: Delete an order
 *     description: Only admins can delete an order. Users can only cancel their order.
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *         description: Order id
 *     responses:
 *       "200":
 *         description: No content
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 *       "403":
 *         $ref: '#/components/responses/Forbidden'
 *       "404":
 *         $ref: '#/components/responses/NotFound'
 *
 */

/**
 * @swagger
 * /users/orders/matches/{userId}/{orderId}:
 *   post:
 *     summary: Find a match for order
 *     description: For order orderId finds/returns an order from another user that matches the criteria.
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User id
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *         description: Order id
 *     responses:
 *       "200":
 *         content:
 *           application/json:
 *             type: object
 *             example:
 *               order:
 *                 type: object
 *               matchedOrder:
 *                 type: object
 *                 description: contained details of the matched order. It is empty if no match is found.
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 *       "403":
 *         $ref: '#/components/responses/Forbidden'
 */

const mongoose = require('mongoose');
const request = require('supertest');
const faker = require('faker');
const httpStatus = require('http-status');
const app = require('../../src/app');
const setupTestDB = require('../utils/setupTestDB');
const { User, Order } = require('../../src/models');
const pick = require('../../src/utils/pick');
const { userOne, userThree, userFour, admin2, insertUsers } = require('../fixtures/user.fixture');
const { nzd100aud90, aud90nzd100, usd70nzd100, insertOrders } = require('../fixtures/order.fixture');
const {
  userOneAccessToken,
  userThreeAccessToken,
  userFourAccessToken,
  admin2AccessToken,
} = require('../fixtures/token.fixture');

setupTestDB();

describe('Order routes', () => {
  describe('POST /v1/users/orders/:userId', () => {
    let newOrder;

    beforeEach(() => {
      newOrder = usd70nzd100;
    });

    test('should return 201 and create order for userThree', async () => {
      await insertUsers([userThree]);

      const res = await request(app)
        .post(`/v1/users/orders/${userThree._id}`)
        .set('Authorization', `Bearer ${userThreeAccessToken}`)
        .send(newOrder)
        .expect(httpStatus.CREATED);

      expect(res.body).toEqual({
        id: expect.anything(),
        have: newOrder.have,
        haveAmount: parseInt(newOrder.haveAmount, 10),
        want: newOrder.want,
        wantAmount: parseInt(newOrder.wantAmount, 10),
        rejects: [],
        status: 0,
        userId: userThree._id.toHexString(),
      });

      const dbOrder = await Order.findById(res.body.id);
      expect(dbOrder).toBeDefined();
      expect(dbOrder).toMatchObject({
        have: newOrder.have,
        haveAmount: parseInt(newOrder.haveAmount, 10),
        want: newOrder.want,
        wantAmount: parseInt(newOrder.wantAmount, 10),
        userId: userThree._id,
        // id: userThree._id.toHexString(),
      });
    });

    test('should return 400 for userOne when attempting to create order, as email is unverified', async () => {
      await insertUsers([userOne]);
      await request(app)
        .post(`/v1/users/orders/${userOne._id}`)
        .set('Authorization', `Bearer ${userOneAccessToken}`)
        .send(newOrder)
        .expect(httpStatus.BAD_REQUEST);
    });
  });

  describe('POST /v1/users/orders/matches/:userId/:orderId', () => {
    let u3nzd100aud90;
    let u3nzd90aud90;
    let u3nzd110aud90;
    let u3aud90nzd100;
    let a2usd70nzd100;
    let u4aud90nzd100;

    beforeEach(() => {
      // userThree Orders
      u3nzd100aud90 = { ...nzd100aud90, userId: userThree._id, _id: mongoose.Types.ObjectId() };
      u3nzd90aud90 = { ...nzd100aud90, userId: userThree._id, _id: mongoose.Types.ObjectId() };
      u3nzd90aud90.haveAmount = 90;
      u3nzd110aud90 = { ...nzd100aud90, userId: userThree._id, _id: mongoose.Types.ObjectId() };
      u3nzd110aud90.haveAmount = 110;
      u3aud90nzd100 = { ...aud90nzd100, userId: userThree._id, _id: mongoose.Types.ObjectId() };
      // admin2 Orders
      a2usd70nzd100 = { ...usd70nzd100, userId: admin2._id, _id: mongoose.Types.ObjectId() };
      // userFour Orders
      u4aud90nzd100 = { ...aud90nzd100, userId: userFour._id, _id: mongoose.Types.ObjectId() };
    });

    test('Should return the correct matchedOrder', async () => {
      await insertUsers([userOne, userThree, userFour, admin2]);
      await insertOrders([u3nzd100aud90, u3nzd90aud90, u3nzd110aud90, u3aud90nzd100, a2usd70nzd100, u4aud90nzd100]);
      const res = await request(app)
        .post(`/v1/users/orders/matches/${u3nzd100aud90.userId}/${u3nzd100aud90._id}`)
        .set('Authorization', `Bearer ${userThreeAccessToken}`)
        .send()
        .expect(httpStatus.OK);

      expect(res.body.matchedOrder).toMatchObject({
        id: u4aud90nzd100._id.toHexString(),
        have: u4aud90nzd100.have,
        haveAmount: parseInt(u4aud90nzd100.haveAmount, 10),
        want: u4aud90nzd100.want,
        wantAmount: parseInt(u4aud90nzd100.wantAmount, 10),
      });
    });

    test('should return empty when order has been rejected by matchedOrder', async () => {
      await insertUsers([userOne, userThree, userFour, admin2]);
      u4aud90nzd100.rejects = [u3nzd100aud90._id];
      await insertOrders([u3nzd100aud90, u3nzd90aud90, u3nzd110aud90, u3aud90nzd100, a2usd70nzd100, u4aud90nzd100]);
      const res = await request(app)
        .post(`/v1/users/orders/matches/${u3nzd100aud90.userId}/${u3nzd100aud90._id}`)
        .set('Authorization', `Bearer ${userThreeAccessToken}`)
        .send()
        .expect(httpStatus.OK);

      expect(res.body.matchedOrder).toEqual(null);
    });

    test('should return empty if matchedOrder was previously rejected', async () => {
      await insertUsers([userOne, userThree, userFour, admin2]);
      u3nzd100aud90.rejects = [u4aud90nzd100._id];
      await insertOrders([u3nzd100aud90, u3nzd90aud90, u3nzd110aud90, u3aud90nzd100, a2usd70nzd100, u4aud90nzd100]);
      const res = await request(app)
        .post(`/v1/users/orders/matches/${u3nzd100aud90.userId}/${u3nzd100aud90._id}`)
        .set('Authorization', `Bearer ${userThreeAccessToken}`)
        .send()
        .expect(httpStatus.OK);

      expect(res.body.matchedOrder).toEqual(null);
      expect(res.body.rejects).toEqual(expect.arrayContaining([u4aud90nzd100._id.toHexString()]));
    });

    test('should ignore cancelled orders as possible matches', async () => {
      await insertUsers([userOne, userThree, userFour, admin2]);
      u4aud90nzd100.status = -1;
      await insertOrders([u3nzd100aud90, u3nzd90aud90, u3nzd110aud90, u3aud90nzd100, a2usd70nzd100, u4aud90nzd100]);
      const res = await request(app)
        .post(`/v1/users/orders/matches/${u3nzd100aud90.userId}/${u3nzd100aud90._id}`)
        .set('Authorization', `Bearer ${userThreeAccessToken}`)
        .send()
        .expect(httpStatus.OK);

      expect(res.body.matchedOrder).toEqual(null);
    });

    test('should ignore possible matches that have already accepted another order', async () => {
      await insertUsers([userOne, userThree, userFour, admin2]);
      u4aud90nzd100.status = 1;
      u4aud90nzd100.details = { accepted: true, userId: u3nzd110aud90.userId, orderId: u3nzd110aud90._id };
      await insertOrders([u3nzd100aud90, u3nzd90aud90, u3nzd110aud90, u3aud90nzd100, a2usd70nzd100, u4aud90nzd100]);
      const res = await request(app)
        .post(`/v1/users/orders/matches/${u3nzd100aud90.userId}/${u3nzd100aud90._id}`)
        .set('Authorization', `Bearer ${userThreeAccessToken}`)
        .send()
        .expect(httpStatus.OK);

      expect(res.body.matchedOrder).toEqual(null);
    });

    test('should return matchedOrder that has accepted current order', async () => {
      await insertUsers([userOne, userThree, userFour, admin2]);
      u4aud90nzd100.status = 1;
      u4aud90nzd100.details = { accepted: true, userId: u3nzd100aud90.userId, orderId: u3nzd100aud90._id };
      await insertOrders([u3nzd100aud90, u3nzd90aud90, u3nzd110aud90, u3aud90nzd100, a2usd70nzd100, u4aud90nzd100]);
      const res = await request(app)
        .post(`/v1/users/orders/matches/${u3nzd100aud90.userId}/${u3nzd100aud90._id}`)
        .set('Authorization', `Bearer ${userThreeAccessToken}`)
        .send()
        .expect(httpStatus.OK);

      expect(res.body.matchedOrder).toMatchObject({
        id: u4aud90nzd100._id.toHexString(),
        have: u4aud90nzd100.have,
        haveAmount: parseInt(u4aud90nzd100.haveAmount, 10),
        want: u4aud90nzd100.want,
        wantAmount: parseInt(u4aud90nzd100.wantAmount, 10),
        userId: { name: userFour.name },
      });
    });
  });

  describe('PATCH /v1/users/orders/:userId/:orderId', () => {
    let u3nzd100aud90;
    let u3nzd90aud90;
    let u3nzd110aud90;
    let u3aud90nzd100;
    let a2usd70nzd100;
    let u4aud90nzd100;

    beforeEach(() => {
      // userThree Orders
      u3nzd100aud90 = { ...nzd100aud90, userId: userThree._id, _id: mongoose.Types.ObjectId() };
      u3nzd90aud90 = { ...nzd100aud90, userId: userThree._id, _id: mongoose.Types.ObjectId() };
      u3nzd90aud90.haveAmount = 90;
      u3nzd110aud90 = { ...nzd100aud90, userId: userThree._id, _id: mongoose.Types.ObjectId() };
      u3nzd110aud90.haveAmount = 110;
      u3aud90nzd100 = { ...aud90nzd100, userId: userThree._id, _id: mongoose.Types.ObjectId() };
      // admin2 Orders
      a2usd70nzd100 = { ...usd70nzd100, userId: admin2._id, _id: mongoose.Types.ObjectId() };
      // userFour Orders
      u4aud90nzd100 = { ...aud90nzd100, userId: userFour._id, _id: mongoose.Types.ObjectId() };
    });

    test('should return 200 when authorized user updates order', async () => {
      await insertUsers([userOne, userThree, userFour, admin2]);
      await insertOrders([u3nzd100aud90, u3nzd90aud90, u3nzd110aud90, u3aud90nzd100, a2usd70nzd100, u4aud90nzd100]);
      const orderUpdate = { want: 'usd' };
      const res = await request(app)
        .patch(`/v1/users/orders/${u4aud90nzd100.userId}/${u4aud90nzd100._id}`)
        .set('Authorization', `Bearer ${userFourAccessToken}`)
        .send(orderUpdate)
        .expect(httpStatus.OK);

      expect(res.body).toMatchObject({
        id: u4aud90nzd100._id.toHexString(),
        have: u4aud90nzd100.have,
        haveAmount: parseInt(u4aud90nzd100.haveAmount, 10),
        want: orderUpdate.want,
        wantAmount: parseInt(u4aud90nzd100.wantAmount, 10),
      });
    });

    test('should return not found when updating order by someone else', async () => {
      await insertUsers([userOne, userThree, userFour, admin2]);
      await insertOrders([u3nzd100aud90, u3nzd90aud90, u3nzd110aud90, u3aud90nzd100, a2usd70nzd100, u4aud90nzd100]);
      const orderUpdate = pick(a2usd70nzd100, ['want']);
      const res = await request(app)
        .patch(`/v1/users/orders/${u3nzd100aud90.userId}/${u4aud90nzd100._id}`)
        .set('Authorization', `Bearer ${userThreeAccessToken}`)
        .send(orderUpdate)
        .expect(httpStatus.NOT_FOUND);

      expect(res.body).toMatchObject({ code: 404 });
    });

    test('should return bad request if size(rejects) > 3', async () => {
      await insertUsers([userOne, userThree, userFour, admin2]);
      u4aud90nzd100.rejects = [u3nzd90aud90._id, u3nzd100aud90._id, u3nzd110aud90];
      await insertOrders([u3nzd100aud90, u3nzd90aud90, u3nzd110aud90, u3aud90nzd100, a2usd70nzd100, u4aud90nzd100]);
      const res = await request(app)
        .patch(`/v1/users/orders/${u4aud90nzd100.userId}/${u4aud90nzd100._id}`)
        .set('Authorization', `Bearer ${userFourAccessToken}`)
        .send({ rejects: [u3nzd90aud90._id] })
        .expect(httpStatus.BAD_REQUEST);

      expect(res.body).toMatchObject({
        code: 400,
        message: 'Order validation failed: rejects: rejects reached maximum allowed rejections for an order',
      });
    });
  });
});

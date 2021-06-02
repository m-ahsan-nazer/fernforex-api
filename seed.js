// const {User, Order} = require('./src/models');
const { createUser } = require('./src/services/user.service');
const { createOrder } = require('./src/services/order.service');
const config = require("./src/config/config");
const mongoose = require("mongoose");

 
const userData = [
  {
    name: "user111",
    email: "user111@fakemail.com",
    password: "password111",
    role: "user",
    isEmailVerified: "false"
  },
  {
    name: "user222",
    email: "user222@fakemail.com",
    password: "password222",
    role: "user",
    isEmailVerified: "true"
  },
  {
    name: "user333",
    email: "user333@fakemail.com",
    password: "password333",
    role: "user",
    isEmailVerified: "false"
  },
];

const orderData = [
  {
    have: "nzd",
    haveAmount: "1000",
    want: "aud",
    wantAmount: "900",
    status: "0",
    userId: "user111"
  },//user222
  {
    have: "aud",
    haveAmount: "1000",
    want: "usd",
    wantAmount: "940",
    status: "0",
    userId: "user222"
  },
  {
    have: "aud",
    haveAmount: "700",
    want: "nzd",
    wantAmount: "1000",
    status: "0",
    userId: "user222"
  },
  {
    have: "aud",
    haveAmount: "1100",
    want: "nzd",
    wantAmount: "1000",
    status: "0",
    userId: "user222"
  },
  {
    have: "aud",
    haveAmount: "900",
    want: "nzd",
    wantAmount: "1000",
    status: "0",
    userId: "user222"
  },
  {
    have: "aud",
    haveAmount: "900",
    want: "nzd",
    wantAmount: "1000",
    status: "-1",
    userId: "user222"
  }, 
  {
    have: "aud",
    haveAmount: "900",
    want: "nzd",
    wantAmount: "1000",
    status: "1",
    userId: "user222",
    details: {
      accepted: "true",
      userId: "user333"
    }
  },//user333
   {
    have: "aud",
    haveAmount: "900",
    want: "nzd",
    wantAmount: "1000",
    status: "1",
    userId: "user333",
    details: {
      accepted: "false",
      userId: "user111"
    }
  },
]

async function seed() {
  await mongoose.connect(config.mongoose.url, config.mongoose.options);
  // await User.deleteMany({});
  // await Order.deleteMany({});
  let userIds = {};
  for (let user of userData){
    const res = await createUser(user);
    userIds[res.name] = res._id;
    console.log("user: ", res);
  }
  for (let order of orderData){
    order.userId = userIds[order.userId];
    if ( "details" in order){
      order.details.userId = userIds[order.details.userId];
    }
    const res = await createOrder(order);
    console.log("order: ", res);
  }

  mongoose.disconnect();

  console.info("Done!");
}

seed();

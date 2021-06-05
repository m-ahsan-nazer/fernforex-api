const mongoose = require('mongoose');
const { toJSON, paginate } = require('./plugins');
const {currencies} = require('../config/currencies');

const orderSchema = mongoose.Schema(
  {
    have: {
        type: String,
        required: true,
        trim: true,
        enum: currencies,
    },
    haveAmount: {
        type: Number,
        required: true,
        trim: true,
    },
    want: {
        type: String,
        required: true,
        trim: true,
        enum: currencies,
    },
    wantAmount: {
        type: Number,
        required: true,
        trim: true,
    },
    userId: {
        type: mongoose.SchemaTypes.ObjectId,
        ref: 'User',
        required: true,
    },
    status: {
        type: Number, //{-1, cancelled, 0: pending, 1: resolved/matched}
        required: true,
        trim: true,
        enum: [-1, 0, 1],
        default: 0,
    },
    details: {
            required: function (){
                return this.status === 1;
            },
            type: {accepted: {
                type: Boolean,
                required: true,
            },
            userId: {
                type: mongoose.SchemaTypes.ObjectId,
                ref: 'User',
                required: true
            },
            orderId: {
                type: mongoose.SchemaTypes.ObjectId,
                ref: 'Order',
                required: true
            }
        },
    },
    rejects: {
            type: [{
                type: mongoose.SchemaTypes.ObjectId,
                ref: 'Order'
            }],
            default: [],
            validate: [limitRejections, '{PATH} reached maximum allowed rejections for an order']
    },
  },
  {
    timestamps: true,
  }
);

function limitRejections(rej){
    /*
    could make this a variable in config
    */
    return rej.length <= 3;
}

// add plugin that converts mongoose to json
orderSchema.plugin(toJSON);
orderSchema.plugin(paginate);

/**
 * Check if order status is pending 
 * @param {number} status- The order status {-1, cancelled, 0: pending, 1: resolved/matched}
 * @returns {Promise<boolean>}
 */
orderSchema.statics.isOrderPending = async function (orderId) {
  const order = await this.findOne({ _id: orderId, status: {$eq: 0}  });
  console.log("isOrderPending: ", orderId, order, !!order);
  return !!order;
};

/**
 * @typedef Order 
 */
const Order = mongoose.model('Order', orderSchema);

module.exports = Order;

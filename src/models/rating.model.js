const mongoose = require('mongoose');
const { toJSON, paginate } = require('./plugins');

const ratingSchema = mongoose.Schema(
  {
    of: {
        type: mongoose.SchemaTypes.ObjectId,
        ref: 'User',
        required: true
    },
    by: {
        type: mongoose.SchemaTypes.ObjectId,
        ref: 'User',
        required: true
    },
    order: {
        type: mongoose.SchemaTypes.ObjectId,
        ref: 'Order',
        required: true
    },
    rating: {
        type: Number,
        required: true,
        enum: [-1, 0, 1] //{-1: negative, 0: neutral, 1: positive}
    }
  },
);

// add plugin that converts mongoose to json
ratingSchema.plugin(toJSON);
ratingSchema.plugin(paginate);


/**
 * @typedef Order 
 */
const Rating = mongoose.model('Rating', ratingSchema);

module.exports = Rating;

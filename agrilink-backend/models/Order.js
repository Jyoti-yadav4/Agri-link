const mongoose = require('mongoose');

const OrderSchema = new mongoose.Schema({
  buyer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  buyerUsername: {
    type: String,
    required: true,
  },
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
  },
  productName: {
    type: String,
    required: true,
  },
  farmer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
  quantity: {
    type: Number,
    default: 1,
    required: true,
  },
  status: {
    type: String,
    enum: ['Pending','Confirmed','Shipped','Delivered'],
    default: 'Pending',
  }
}, {
  timestamps: true,
});

module.exports = mongoose.model('Order', OrderSchema);

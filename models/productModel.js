const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  image: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  price: {
    type: Number,
    required: true,
    default: 0,
  },
  category: {
    type: String,
    required: true,
  },
  countInStock: {
    type: Number,
    required: true,
    default: 1, // Default countInStock value is set to 1
  },
});

const Product = mongoose.model('Product', productSchema);

module.exports = Product;

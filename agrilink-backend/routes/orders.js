const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const Product = require('../models/Product');
const { protect } = require('../middleware/auth');

router.post('/buy/:productId', protect, async (req, res) => {
  if (req.user.role !== 'buyer') {
    return res.status(403).json({ message: 'Only buyers can place orders.' });
  }
  const quantity = req.body.quantity && Number(req.body.quantity) > 0 ? Number(req.body.quantity) : 1;
  try {
    const product = await Product.findById(req.params.productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found.' });
    }
    const totalPrice = product.price * quantity;
    const order = await Order.create({
      buyer: req.user.id,
      buyerUsername: req.user.username,
      product: product._id,
      productName: product.name,
      farmer: product.farmer,
      price: product.price,
      quantity,
      status: 'Pending'
    });
    res.status(201).json({ message: `Order placed successfully!`, order: { ...order.toObject(), totalPrice } });
  } catch (error) {
    console.error('Error placing order:', error);
    res.status(500).json({ message: 'Server error placing order.' });
  }
});

router.get('/history', protect, async (req, res) => {
  if (req.user.role !== 'buyer') {
    return res.status(403).json({ message: 'Only buyers can view order history.' });
  }
  try {
    const orders = await Order.find({ buyer: req.user.id }).sort({ createdAt: -1 });
    res.json(orders.map(o => ({ ...o.toObject(), totalPrice: o.price * o.quantity })));
  } catch (error) {
    console.error('Error fetching buyer orders:', error);
    res.status(500).json({ message: 'Server error fetching orders.' });
  }
});

router.get('/sales', protect, async (req, res) => {
  if (req.user.role !== 'farmer') {
    return res.status(403).json({ message: 'Only farmers can view sales.' });
  }
  try {
    const sales = await Order.find({ farmer: req.user.id }).sort({ createdAt: -1 });
    res.json(sales.map(o => ({ ...o.toObject(), totalPrice: o.price * o.quantity })));
  } catch (error) {
    console.error('Error fetching sales:', error);
    res.status(500).json({ message: 'Server error fetching sales.' });
  }
});

router.put('/status/:orderId', protect, async (req, res) => {
  if (req.user.role !== 'farmer') {
    return res.status(403).json({ message: 'Only farmers can update orders.' });
  }
  const { status } = req.body;
  const allowed = ['Pending','Confirmed','Shipped','Delivered'];
  if (!allowed.includes(status)) {
    return res.status(400).json({ message: 'Invalid status value.' });
  }
  try {
    const order = await Order.findById(req.params.orderId);
    if (!order) {
      return res.status(404).json({ message: 'Order not found.' });
    }
    if (order.farmer.toString() !== req.user.id.toString()) {
      return res.status(403).json({ message: 'Unauthorized to manage this order.' });
    }
    order.status = status;
    await order.save();
    res.json({ message: `Order status updated to ${status}`, order });
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({ message: 'Server error updating order status.' });
  }
});

module.exports = router;

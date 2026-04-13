const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const { protect } = require('../middleware/auth');

router.get('/', async (req, res) => {
  try {
    const products = await Product.find({}).sort({ createdAt: -1 });
    res.json(products);
  } catch (error) {
    console.error('Error retrieving products:', error);
    res.status(500).json({ message: 'Server error retrieving products.' });
  }
});

router.post('/', protect, async (req, res) => {
  if (req.user.role !== 'farmer') {
    return res.status(403).json({ message: 'Only farmers can add crops.' });
  }
  const { name, price, imageUrl } = req.body;
  if (!name || !price || !imageUrl) {
    return res.status(400).json({ message: 'Please include crop name, price, image URL.' });
  }
  try {
    const newProduct = await Product.create({
      name,
      price,
      imageUrl,
      farmer: req.user.id,
      farmerUsername: req.user.username
    });
    res.status(201).json({ message: `${newProduct.name} added successfully!`, product: newProduct });
  } catch (error) {
    console.error('Error saving product:', error);
    res.status(500).json({ message: 'Server error adding product.' });
  }
});

router.get('/my-products', protect, async (req, res) => {
  if (req.user.role !== 'farmer') {
    return res.status(403).json({ message: 'Only farmers can view their products.' });
  }
  try {
    const products = await Product.find({ farmer: req.user.id }).sort({ createdAt: -1 });
    res.json(products);
  } catch (error) {
    console.error('Error retrieving farmer products:', error);
    res.status(500).json({ message: 'Server error retrieving products.' });
  }
});

module.exports = router;

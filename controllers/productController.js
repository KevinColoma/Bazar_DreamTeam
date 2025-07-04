const Product = require('../models/product');

exports.getAllProducts = async (req, res) => {
    const products = await Product.find().populate('categoryId');
    res.json(products);
};

exports.getProductById = async (req, res) => {
    const product = await Product.findById(req.params.id).populate('categoryId');
    if (!product) return res.status(404).send('Producto no encontrado');
    res.json(product);
};

exports.createProduct = async (req, res) => {
    const product = new Product(req.body);
    await product.save();
    res.status(201).json(product);
};

exports.updateProduct = async (req, res) => {
    const product = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!product) return res.status(404).send('Producto no encontrado');
    res.json(product);
};

exports.deleteProduct = async (req, res) => {
    const product = await Product.findByIdAndRemove(req.params.id);
    if (!product) return res.status(404).send('Producto no encontrado');
    res.status(204).send();
};

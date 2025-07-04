const Product = require('../models/product');
const Sale = require('../models/sale');
const Client = require('../models/client');
const Category = require('../models/category');
const Supplier = require('../models/supplier');
// Cálculos de productos
exports.calculateProductProfit = async (req, res) => {
    try {
        const { productId } = req.params;
        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ error: 'Producto no encontrado' });
        }
        
        const profit = product.salePrice - product.purchasePrice;
        const profitMargin = ((profit / product.purchasePrice) * 100).toFixed(2);
        
        res.json({
            productId,
            productName: product.name,
            purchasePrice: product.purchasePrice,
            salePrice: product.salePrice,
            profit,
            profitMargin: `${profitMargin}%`
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
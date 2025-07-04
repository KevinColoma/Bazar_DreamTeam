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
exports.calculateInventoryValue = async (req, res) => {
    try {
        const products = await Product.find();
        let totalPurchaseValue = 0;
        let totalSaleValue = 0;
        
        products.forEach(product => {
            totalPurchaseValue += product.purchasePrice * product.stock;
            totalSaleValue += product.salePrice * product.stock;
        });
        
        const potentialProfit = totalSaleValue - totalPurchaseValue;
        
        res.json({
            totalProducts: products.length,
            totalPurchaseValue,
            totalSaleValue,
            potentialProfit,
            profitMargin: ((potentialProfit / totalPurchaseValue) * 100).toFixed(2) + '%'
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
exports.getLowStockProducts = async (req, res) => {
    try {
        const { threshold = 10 } = req.query;
        const products = await Product.find({ stock: { $lte: threshold } }).populate('categoryId');
        
        const lowStockData = products.map(product => ({
            id: product._id,
            name: product.name,
            category: product.categoryId?.name,
            currentStock: product.stock,
            threshold,
            restockValue: product.purchasePrice * (threshold - product.stock + 10)
        }));
        
        res.json({
            threshold,
            count: lowStockData.length,
            products: lowStockData,
            totalRestockValue: lowStockData.reduce((sum, p) => sum + p.restockValue, 0)
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
exports.calculateProductRotation = async (req, res) => {
    try {
        const { productId } = req.params;
        const { days = 30 } = req.query;
        
        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ error: 'Producto no encontrado' });
        }
        
        const dateFrom = new Date();
        dateFrom.setDate(dateFrom.getDate() - days);
        
        const sales = await Sale.find({
            'items.productId': productId,
            date: { $gte: dateFrom }
        });
        
        let totalSold = 0;
        sales.forEach(sale => {
            sale.items.forEach(item => {
                if (item.productId.toString() === productId) {
                    totalSold += item.quantity;
                }
            });
        });
        
        const rotationRate = product.stock > 0 ? (totalSold / product.stock).toFixed(2) : 0;
        const daysToSellOut = product.stock > 0 && totalSold > 0 ? 
            Math.ceil((product.stock / totalSold) * days) : 'N/A';
        
        res.json({
            productId,
            productName: product.name,
            currentStock: product.stock,
            soldInPeriod: totalSold,
            periodDays: days,
            rotationRate,
            daysToSellOut
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
exports.calculateProductRotation = async (req, res) => {
    try {
        const { productId } = req.params;
        const { days = 30 } = req.query;
        
        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ error: 'Producto no encontrado' });
        }
        
        const dateFrom = new Date();
        dateFrom.setDate(dateFrom.getDate() - days);
        
        const sales = await Sale.find({
            'items.productId': productId,
            date: { $gte: dateFrom }
        });
        
        let totalSold = 0;
        sales.forEach(sale => {
            sale.items.forEach(item => {
                if (item.productId.toString() === productId) {
                    totalSold += item.quantity;
                }
            });
        });
        
        const rotationRate = product.stock > 0 ? (totalSold / product.stock).toFixed(2) : 0;
        const daysToSellOut = product.stock > 0 && totalSold > 0 ? 
            Math.ceil((product.stock / totalSold) * days) : 'N/A';
        
        res.json({
            productId,
            productName: product.name,
            currentStock: product.stock,
            soldInPeriod: totalSold,
            periodDays: days,
            rotationRate,
            daysToSellOut
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
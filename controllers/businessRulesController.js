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
// Cálculos de ventas
exports.calculateSalesAnalytics = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        let dateFilter = {};
        
        if (startDate && endDate) {
            dateFilter = {
                date: {
                    $gte: new Date(startDate),
                    $lte: new Date(endDate)
                }
            };
        }
        
        const sales = await Sale.find(dateFilter).populate('clientId');
        
        const totalSales = sales.reduce((sum, sale) => sum + sale.total, 0);
        const averageSale = sales.length > 0 ? (totalSales / sales.length).toFixed(2) : 0;
        const uniqueClients = new Set(sales.map(sale => sale.clientId?._id)).size;
        
        res.json({
            period: { startDate, endDate },
            totalSales,
            averageSale: parseFloat(averageSale),
            salesCount: sales.length,
            uniqueClients,
            averagePerClient: uniqueClients > 0 ? (totalSales / uniqueClients).toFixed(2) : 0
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getTopSellingProducts = async (req, res) => {
    try {
        const { limit = 10, days = 30 } = req.query;
        
        const dateFrom = new Date();
        dateFrom.setDate(dateFrom.getDate() - days);
        
        const sales = await Sale.find({ date: { $gte: dateFrom } });
        
        const productSales = {};
        sales.forEach(sale => {
            sale.items.forEach(item => {
                const productId = item.productId.toString();
                if (!productSales[productId]) {
                    productSales[productId] = {
                        productId,
                        name: item.name,
                        quantitySold: 0,
                        totalRevenue: 0
                    };
                }
                productSales[productId].quantitySold += item.quantity;
                productSales[productId].totalRevenue += item.total;
            });
        });
        
        const topProducts = Object.values(productSales)
            .sort((a, b) => b.quantitySold - a.quantitySold)
            .slice(0, parseInt(limit));
        
        res.json({
            period: `${days} días`,
            limit: parseInt(limit),
            topProducts
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.calculateClientValue = async (req, res) => {
    try {
        const { clientId } = req.params;
        const { months = 12 } = req.query;
        
        const client = await Client.findById(clientId);
        if (!client) {
            return res.status(404).json({ error: 'Cliente no encontrado' });
        }
        
        const dateFrom = new Date();
        dateFrom.setMonth(dateFrom.getMonth() - months);
        
        const sales = await Sale.find({
            clientId,
            date: { $gte: dateFrom }
        });
        
        const totalPurchased = sales.reduce((sum, sale) => sum + sale.total, 0);
        const averagePurchase = sales.length > 0 ? (totalPurchased / sales.length).toFixed(2) : 0;
        const frequency = sales.length;
        
        res.json({
            clientId,
            clientName: client.fullname,
            period: `${months} meses`,
            totalPurchased,
            averagePurchase: parseFloat(averagePurchase),
            purchaseFrequency: frequency,
            customerValue: (totalPurchased / months).toFixed(2)
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

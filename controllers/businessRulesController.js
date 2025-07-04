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
exports.predictNextPurchase = async (req, res) => {
    try {
        const { clientId } = req.params;
        
        const client = await Client.findById(clientId);
        if (!client) {
            return res.status(404).json({ error: 'Cliente no encontrado' });
        }
        
        const sales = await Sale.find({ clientId }).sort({ date: -1 }).limit(5);
        
        if (sales.length < 2) {
            return res.json({
                clientId,
                clientName: client.fullname,
                prediction: 'Datos insuficientes para predicción',
                lastPurchase: sales[0]?.date || 'Nunca'
            });
        }
        
        // Calcular promedio de días entre compras
        let totalDays = 0;
        for (let i = 0; i < sales.length - 1; i++) {
            const daysDiff = Math.abs(sales[i].date - sales[i + 1].date) / (1000 * 60 * 60 * 24);
            totalDays += daysDiff;
        }
        
        const averageDaysBetweenPurchases = Math.round(totalDays / (sales.length - 1));
        const lastPurchaseDate = new Date(sales[0].date);
        const predictedNextPurchase = new Date(lastPurchaseDate);
        predictedNextPurchase.setDate(predictedNextPurchase.getDate() + averageDaysBetweenPurchases);
        
        res.json({
            clientId,
            clientName: client.fullname,
            lastPurchase: lastPurchaseDate,
            averageDaysBetweenPurchases,
            predictedNextPurchase,
            daysUntilPrediction: Math.ceil((predictedNextPurchase - new Date()) / (1000 * 60 * 60 * 24))
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Cálculos de categorías
exports.getCategoryPerformance = async (req, res) => {
    try {
        const { days = 30 } = req.query;
        
        const dateFrom = new Date();
        dateFrom.setDate(dateFrom.getDate() - days);
        
        const categories = await Category.find();
        const sales = await Sale.find({ date: { $gte: dateFrom } });
        const products = await Product.find().populate('categoryId');
        
        const categoryStats = {};
        
        // Inicializar estadísticas por categoría
        categories.forEach(category => {
            categoryStats[category._id] = {
                categoryId: category._id,
                categoryName: category.name,
                totalRevenue: 0,
                quantitySold: 0,
                productCount: 0,
                averagePrice: 0
            };
        });
        
        // Contar productos por categoría
        products.forEach(product => {
            if (product.categoryId && categoryStats[product.categoryId._id]) {
                categoryStats[product.categoryId._id].productCount++;
            }
        });
        
        // Calcular ventas por categoría
        sales.forEach(sale => {
            sale.items.forEach(item => {
                const product = products.find(p => p._id.toString() === item.productId.toString());
                if (product && product.categoryId && categoryStats[product.categoryId._id]) {
                    categoryStats[product.categoryId._id].totalRevenue += item.total;
                    categoryStats[product.categoryId._id].quantitySold += item.quantity;
                }
            });
        });
        
        // Calcular precio promedio
        Object.values(categoryStats).forEach(category => {
            if (category.quantitySold > 0) {
                category.averagePrice = (category.totalRevenue / category.quantitySold).toFixed(2);
            }
        });
        
        const sortedCategories = Object.values(categoryStats)
            .sort((a, b) => b.totalRevenue - a.totalRevenue);
        
        res.json({
            period: `${days} días`,
            categories: sortedCategories
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
// Métricas de rentabilidad
exports.calculateROI = async (req, res) => {
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
        
        const sales = await Sale.find(dateFilter);
        const products = await Product.find();
        
        let totalRevenue = 0;
        let totalCost = 0;
        
        sales.forEach(sale => {
            totalRevenue += sale.total;
            sale.items.forEach(item => {
                const product = products.find(p => p._id.toString() === item.productId.toString());
                if (product) {
                    totalCost += product.purchasePrice * item.quantity;
                }
            });
        });
        
        const grossProfit = totalRevenue - totalCost;
        const roi = totalCost > 0 ? ((grossProfit / totalCost) * 100).toFixed(2) : 0;
        
        res.json({
            period: { startDate, endDate },
            totalRevenue,
            totalCost,
            grossProfit,
            roi: `${roi}%`,
            profitMargin: totalRevenue > 0 ? `${((grossProfit / totalRevenue) * 100).toFixed(2)}%` : '0%'
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Análisis de tendencias
exports.getSalesTrend = async (req, res) => {
    try {
        const { days = 30 } = req.query;
        
        const dateFrom = new Date();
        dateFrom.setDate(dateFrom.getDate() - days);
        
        const sales = await Sale.find({ date: { $gte: dateFrom } }).sort({ date: 1 });
        
        const dailySales = {};
        sales.forEach(sale => {
            const dateKey = sale.date.toISOString().split('T')[0];
            if (!dailySales[dateKey]) {
                dailySales[dateKey] = { date: dateKey, total: 0, count: 0 };
            }
            dailySales[dateKey].total += sale.total;
            dailySales[dateKey].count += 1;
        });
        
        const trend = Object.values(dailySales);
        const totalSales = trend.reduce((sum, day) => sum + day.total, 0);
        const averageDaily = trend.length > 0 ? (totalSales / trend.length).toFixed(2) : 0;
        
        res.json({
            period: `${days} días`,
            dailyTrend: trend,
            totalSales,
            averageDailySales: parseFloat(averageDaily),
            totalDays: trend.length
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Análisis de precios
exports.analyzePricing = async (req, res) => {
    try {
        const products = await Product.find().populate('categoryId');
        
        const pricingAnalysis = products.map(product => {
            const profit = product.salePrice - product.purchasePrice;
            const margin = ((profit / product.purchasePrice) * 100).toFixed(2);
            
            return {
                productId: product._id,
                name: product.name,
                category: product.categoryId?.name,
                purchasePrice: product.purchasePrice,
                salePrice: product.salePrice,
                profit,
                margin: `${margin}%`,
                competitiveness: margin > 50 ? 'Alta' : margin > 25 ? 'Media' : 'Baja'
            };
        });
        
        const avgMargin = pricingAnalysis.reduce((sum, p) => sum + parseFloat(p.margin), 0) / pricingAnalysis.length;
        
        res.json({
            totalProducts: pricingAnalysis.length,
            averageMargin: `${avgMargin.toFixed(2)}%`,
            products: pricingAnalysis.sort((a, b) => parseFloat(b.margin) - parseFloat(a.margin))
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Simulaciones
exports.simulatePriceChange = async (req, res) => {
    try {
        const { productId } = req.params;
        const { newPrice, percentage } = req.body;
        
        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ error: 'Producto no encontrado' });
        }
        
        let simulatedPrice;
        if (newPrice) {
            simulatedPrice = newPrice;
        } else if (percentage) {
            simulatedPrice = product.salePrice * (1 + percentage / 100);
        } else {
            return res.status(400).json({ error: 'Debe proporcionar newPrice o percentage' });
        }
        
        const currentProfit = product.salePrice - product.purchasePrice;
        const currentMargin = ((currentProfit / product.purchasePrice) * 100).toFixed(2);
        
        const newProfit = simulatedPrice - product.purchasePrice;
        const newMargin = ((newProfit / product.purchasePrice) * 100).toFixed(2);
        
        const profitDifference = newProfit - currentProfit;
        const marginDifference = (newMargin - currentMargin).toFixed(2);
        
        res.json({
            productId,
            productName: product.name,
            current: {
                price: product.salePrice,
                profit: currentProfit,
                margin: `${currentMargin}%`
            },
            simulated: {
                price: simulatedPrice,
                profit: newProfit,
                margin: `${newMargin}%`
            },
            impact: {
                profitDifference,
                marginDifference: `${marginDifference}%`,
                stockValue: simulatedPrice * product.stock,
                potentialRevenue: newProfit * product.stock
            }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
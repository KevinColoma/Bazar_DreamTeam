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



// Alertas y recomendaciones
exports.getBusinessAlerts = async (req, res) => {
    try {
        const alerts = [];
        
        // Productos con bajo stock
        const lowStockProducts = await Product.find({ stock: { $lte: 5 } });
        if (lowStockProducts.length > 0) {
            alerts.push({
                type: 'LOW_STOCK',
                severity: 'HIGH',
                message: `${lowStockProducts.length} productos con stock crítico`,
                details: lowStockProducts.map(p => ({ id: p._id, name: p.name, stock: p.stock }))
            });
        }
        
        // Productos sin ventas recientes
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        
        const recentSales = await Sale.find({ date: { $gte: thirtyDaysAgo } });
        const soldProductIds = new Set();
        recentSales.forEach(sale => {
            sale.items.forEach(item => {
                soldProductIds.add(item.productId.toString());
            });
        });
        
        const allProducts = await Product.find();
        const unsoldProducts = allProducts.filter(p => !soldProductIds.has(p._id.toString()));
        
        if (unsoldProducts.length > 0) {
            alerts.push({
                type: 'NO_SALES',
                severity: 'MEDIUM',
                message: `${unsoldProducts.length} productos sin ventas en 30 días`,
                details: unsoldProducts.slice(0, 5).map(p => ({ id: p._id, name: p.name }))
            });
        }
        
        // Margen de ganancia bajo
        const lowMarginProducts = allProducts.filter(product => {
            const margin = ((product.salePrice - product.purchasePrice) / product.purchasePrice) * 100;
            return margin < 20;
        });
        
        if (lowMarginProducts.length > 0) {
            alerts.push({
                type: 'LOW_MARGIN',
                severity: 'MEDIUM',
                message: `${lowMarginProducts.length} productos con margen menor al 20%`,
                details: lowMarginProducts.slice(0, 5).map(p => {
                    const margin = ((p.salePrice - p.purchasePrice) / p.purchasePrice) * 100;
                    return { id: p._id, name: p.name, margin: `${margin.toFixed(2)}%` };
                })
            });
        }
        
        res.json({
            timestamp: new Date(),
            alertCount: alerts.length,
            alerts
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};





// Dashboard summary
exports.getDashboardSummary = async (req, res) => {
    try {
        const today = new Date();
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        
        // Estadísticas básicas
        const totalProducts = await Product.countDocuments();
        const totalClients = await Client.countDocuments();
        const totalCategories = await Category.countDocuments();
        
        // Ventas del último mes
        const recentSales = await Sale.find({ date: { $gte: thirtyDaysAgo } });
        const monthlyRevenue = recentSales.reduce((sum, sale) => sum + sale.total, 0);
        
        // Productos con bajo stock
        const lowStockCount = await Product.countDocuments({ stock: { $lte: 10 } });
        
        // Valor del inventario
        const products = await Product.find();
        const inventoryValue = products.reduce((sum, product) => {
            return sum + (product.salePrice * product.stock);
        }, 0);
        
        // Cliente top
        const clientSales = {};
        recentSales.forEach(sale => {
            const clientId = sale.clientId.toString();
            clientSales[clientId] = (clientSales[clientId] || 0) + sale.total;
        });
        
        const topClientId = Object.keys(clientSales).reduce((a, b) => 
            clientSales[a] > clientSales[b] ? a : b, Object.keys(clientSales)[0]);
        
        let topClient = null;
        if (topClientId) {
            topClient = await Client.findById(topClientId);
        }
        
        res.json({
            period: 'Últimos 30 días',
            summary: {
                totalProducts,
                totalClients,
                totalCategories,
                monthlyRevenue,
                salesCount: recentSales.length,
                lowStockCount,
                inventoryValue,
                topClient: topClient ? {
                    name: topClient.fullname,
                    totalPurchased: clientSales[topClientId]
                } : null
            },
            timestamp: new Date()
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};



// Análisis de temporada
exports.getSeasonalAnalysis = async (req, res) => {
    try {
        const { year = new Date().getFullYear() } = req.query;
        
        const startOfYear = new Date(year, 0, 1);
        const endOfYear = new Date(year, 11, 31);
        
        const sales = await Sale.find({
            date: { $gte: startOfYear, $lte: endOfYear }
        });
        
        const monthlyData = {};
        for (let i = 0; i < 12; i++) {
            monthlyData[i] = { month: i + 1, total: 0, count: 0 };
        }
        
        sales.forEach(sale => {
            const month = sale.date.getMonth();
            monthlyData[month].total += sale.total;
            monthlyData[month].count += 1;
        });
        
        const seasonalData = Object.values(monthlyData);
        const bestMonth = seasonalData.reduce((max, current) => 
            current.total > max.total ? current : max, seasonalData[0]);
        
        res.json({
            year,
            monthlyData: seasonalData,
            bestMonth,
            totalYearSales: seasonalData.reduce((sum, month) => sum + month.total, 0),
            averageMonthly: (seasonalData.reduce((sum, month) => sum + month.total, 0) / 12).toFixed(2)
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};


// Análisis de eficiencia de inventario
exports.getInventoryEfficiency = async (req, res) => {
    try {
        const products = await Product.find().populate('categoryId');
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        
        const sales = await Sale.find({ date: { $gte: thirtyDaysAgo } });
        
        const productAnalysis = products.map(product => {
            let totalSold = 0;
            sales.forEach(sale => {
                sale.items.forEach(item => {
                    if (item.productId.toString() === product._id.toString()) {
                        totalSold += item.quantity;
                    }
                });
            });
            
            const turnoverRate = product.stock > 0 ? (totalSold / product.stock).toFixed(2) : 0;
            const daysOfInventory = totalSold > 0 ? Math.ceil((product.stock / totalSold) * 30) : 'N/A';
            
            return {
                productId: product._id,
                name: product.name,
                category: product.categoryId?.name,
                currentStock: product.stock,
                soldLast30Days: totalSold,
                turnoverRate: parseFloat(turnoverRate),
                daysOfInventory,
                efficiency: turnoverRate > 1 ? 'Alta' : turnoverRate > 0.5 ? 'Media' : 'Baja'
            };
        });
        
        const avgTurnover = productAnalysis.reduce((sum, p) => sum + p.turnoverRate, 0) / productAnalysis.length;
        
        res.json({
            period: 'Últimos 30 días',
            averageTurnoverRate: avgTurnover.toFixed(2),
            products: productAnalysis.sort((a, b) => b.turnoverRate - a.turnoverRate),
            summary: {
                highEfficiency: productAnalysis.filter(p => p.efficiency === 'Alta').length,
                mediumEfficiency: productAnalysis.filter(p => p.efficiency === 'Media').length,
                lowEfficiency: productAnalysis.filter(p => p.efficiency === 'Baja').length
            }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};




// Predicción de demanda
exports.predictDemand = async (req, res) => {
    try {
        const { productId } = req.params;
        const { days = 30 } = req.query;
        
        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ error: 'Producto no encontrado' });
        }
        
        const pastDays = parseInt(days) * 3; // Analizar el triple del período para predicción
        const dateFrom = new Date();
        dateFrom.setDate(dateFrom.getDate() - pastDays);
        
        const sales = await Sale.find({ date: { $gte: dateFrom } });
        
        let totalSold = 0;
        let salesDays = 0;
        
        sales.forEach(sale => {
            sale.items.forEach(item => {
                if (item.productId.toString() === productId) {
                    totalSold += item.quantity;
                    salesDays++;
                }
            });
        });
        
        const averageDailySales = totalSold / pastDays;
        const predictedDemand = Math.ceil(averageDailySales * parseInt(days));
        const restockNeeded = Math.max(0, predictedDemand - product.stock);
        
        res.json({
            productId,
            productName: product.name,
            analysisPeriod: `${pastDays} días`,
            predictionPeriod: `${days} días`,
            currentStock: product.stock,
            totalSoldInAnalysis: totalSold,
            averageDailySales: averageDailySales.toFixed(2),
            predictedDemand,
            restockNeeded,
            restockCost: restockNeeded * product.purchasePrice,
            stockoutRisk: product.stock < predictedDemand ? 'Alto' : 'Bajo'
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};






// Análisis ABC de productos
exports.getABCAnalysis = async (req, res) => {
    try {
        const { days = 90 } = req.query;
        
        const dateFrom = new Date();
        dateFrom.setDate(dateFrom.getDate() - days);
        
        const sales = await Sale.find({ date: { $gte: dateFrom } });
        const products = await Product.find();
        
        const productRevenue = {};
        
        // Calcular ingresos por producto
        sales.forEach(sale => {
            sale.items.forEach(item => {
                const productId = item.productId.toString();
                if (!productRevenue[productId]) {
                    productRevenue[productId] = {
                        productId,
                        name: item.name,
                        revenue: 0,
                        quantity: 0
                    };
                }
                productRevenue[productId].revenue += item.total;
                productRevenue[productId].quantity += item.quantity;
            });
        });
        
        const productArray = Object.values(productRevenue).sort((a, b) => b.revenue - a.revenue);
        const totalRevenue = productArray.reduce((sum, p) => sum + p.revenue, 0);
        
        let cumulativeRevenue = 0;
        const abcAnalysis = productArray.map((product, index) => {
            cumulativeRevenue += product.revenue;
            const cumulativePercentage = (cumulativeRevenue / totalRevenue) * 100;
            
            let category;
            if (cumulativePercentage <= 80) {
                category = 'A';
            } else if (cumulativePercentage <= 95) {
                category = 'B';
            } else {
                category = 'C';
            }
            
            return {
                ...product,
                rank: index + 1,
                revenuePercentage: ((product.revenue / totalRevenue) * 100).toFixed(2),
                cumulativePercentage: cumulativePercentage.toFixed(2),
                category
            };
        });
        
        const summary = {
            A: abcAnalysis.filter(p => p.category === 'A').length,
            B: abcAnalysis.filter(p => p.category === 'B').length,
            C: abcAnalysis.filter(p => p.category === 'C').length
        };
        
        res.json({
            period: `${days} días`,
            totalProducts: productArray.length,
            totalRevenue,
            summary,
            products: abcAnalysis
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};


// Análisis de fidelidad de clientes
exports.getCustomerLoyaltyAnalysis = async (req, res) => {
    try {
        const { months = 12 } = req.query;
        
        const dateFrom = new Date();
        dateFrom.setMonth(dateFrom.getMonth() - months);
        
        const sales = await Sale.find({ date: { $gte: dateFrom } }).populate('clientId');
        const clients = await Client.find();
        
        const clientAnalysis = {};
        
        // Inicializar análisis de clientes
        clients.forEach(client => {
            clientAnalysis[client._id] = {
                clientId: client._id,
                clientName: client.fullname,
                totalPurchases: 0,
                purchaseFrequency: 0,
                averagePurchase: 0,
                lastPurchase: null,
                daysSinceLastPurchase: null,
                loyaltyScore: 0,
                segment: ''
            };
        });
        
        // Procesar ventas
        sales.forEach(sale => {
            if (sale.clientId && clientAnalysis[sale.clientId._id]) {
                const analysis = clientAnalysis[sale.clientId._id];
                analysis.totalPurchases += sale.total;
                analysis.purchaseFrequency += 1;
                
                if (!analysis.lastPurchase || sale.date > analysis.lastPurchase) {
                    analysis.lastPurchase = sale.date;
                }
            }
        });
        
        // Calcular métricas finales
        const today = new Date();
        Object.values(clientAnalysis).forEach(analysis => {
            if (analysis.purchaseFrequency > 0) {
                analysis.averagePurchase = (analysis.totalPurchases / analysis.purchaseFrequency).toFixed(2);
                
                if (analysis.lastPurchase) {
                    analysis.daysSinceLastPurchase = Math.floor((today - analysis.lastPurchase) / (1000 * 60 * 60 * 24));
                }
                
                // Calcular score de lealtad (0-100)
                const recencyScore = analysis.daysSinceLastPurchase <= 30 ? 30 : 
                                   analysis.daysSinceLastPurchase <= 60 ? 20 : 
                                   analysis.daysSinceLastPurchase <= 90 ? 10 : 0;
                
                const frequencyScore = analysis.purchaseFrequency >= 10 ? 35 : 
                                     analysis.purchaseFrequency >= 5 ? 25 : 
                                     analysis.purchaseFrequency >= 2 ? 15 : 5;
                
                const monetaryScore = analysis.totalPurchases >= 1000 ? 35 : 
                                    analysis.totalPurchases >= 500 ? 25 : 
                                    analysis.totalPurchases >= 100 ? 15 : 5;
                
                analysis.loyaltyScore = recencyScore + frequencyScore + monetaryScore;
                
                // Segmentación
                if (analysis.loyaltyScore >= 80) analysis.segment = 'VIP';
                else if (analysis.loyaltyScore >= 60) analysis.segment = 'Leal';
                else if (analysis.loyaltyScore >= 40) analysis.segment = 'Regular';
                else if (analysis.loyaltyScore >= 20) analysis.segment = 'En riesgo';
                else analysis.segment = 'Inactivo';
            } else {
                analysis.segment = 'Sin compras';
            }
        });
        
        const segmentSummary = {
            'VIP': Object.values(clientAnalysis).filter(c => c.segment === 'VIP').length,
            'Leal': Object.values(clientAnalysis).filter(c => c.segment === 'Leal').length,
            'Regular': Object.values(clientAnalysis).filter(c => c.segment === 'Regular').length,
            'En riesgo': Object.values(clientAnalysis).filter(c => c.segment === 'En riesgo').length,
            'Inactivo': Object.values(clientAnalysis).filter(c => c.segment === 'Inactivo').length,
            'Sin compras': Object.values(clientAnalysis).filter(c => c.segment === 'Sin compras').length
        };
        
        res.json({
            period: `${months} meses`,
            totalClients: clients.length,
            segmentSummary,
            averageLoyaltyScore: (Object.values(clientAnalysis)
                .reduce((sum, c) => sum + c.loyaltyScore, 0) / clients.length).toFixed(2),
            clients: Object.values(clientAnalysis)
                .sort((a, b) => b.loyaltyScore - a.loyaltyScore)
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Análisis de cross-selling
exports.getCrossSellAnalysis = async (req, res) => {
    try {
        const { minSupport = 0.01 } = req.query;
        
        const sales = await Sale.find();
        const products = await Product.find();
        
        // Crear mapa de productos
        const productMap = {};
        products.forEach(product => {
            productMap[product._id] = product.name;
        });
        
        // Analizar combinaciones de productos
        const productCombinations = {};
        const productCounts = {};
        
        sales.forEach(sale => {
            if (sale.items.length > 1) {
                // Contar productos individuales
                sale.items.forEach(item => {
                    const productId = item.productId.toString();
                    productCounts[productId] = (productCounts[productId] || 0) + 1;
                });
                
                // Contar combinaciones
                for (let i = 0; i < sale.items.length; i++) {
                    for (let j = i + 1; j < sale.items.length; j++) {
                        const product1 = sale.items[i].productId.toString();
                        const product2 = sale.items[j].productId.toString();
                        const combination = [product1, product2].sort().join('-');
                        
                        productCombinations[combination] = (productCombinations[combination] || 0) + 1;
                    }
                }
            }
        });
        
        // Calcular support y confidence
        const totalTransactions = sales.length;
        const rules = [];
        
        Object.keys(productCombinations).forEach(combination => {
            const [product1, product2] = combination.split('-');
            const combinationCount = productCombinations[combination];
            const support = combinationCount / totalTransactions;
            
            if (support >= minSupport) {
                const confidence1to2 = combinationCount / (productCounts[product1] || 1);
                const confidence2to1 = combinationCount / (productCounts[product2] || 1);
                
                rules.push({
                    product1: {
                        id: product1,
                        name: productMap[product1] || 'Producto eliminado'
                    },
                    product2: {
                        id: product2,
                        name: productMap[product2] || 'Producto eliminado'
                    },
                    support: (support * 100).toFixed(2) + '%',
                    confidence1to2: (confidence1to2 * 100).toFixed(2) + '%',
                    confidence2to1: (confidence2to1 * 100).toFixed(2) + '%',
                    strength: ((support * Math.max(confidence1to2, confidence2to1)) * 100).toFixed(2)
                });
            }
        });
        
        // Ordenar por fuerza de la regla
        rules.sort((a, b) => parseFloat(b.strength) - parseFloat(a.strength));
        
        res.json({
            totalTransactions,
            minSupport: (minSupport * 100).toFixed(2) + '%',
            rulesFound: rules.length,
            topRules: rules.slice(0, 20),
            recommendations: rules.slice(0, 10).map(rule => ({
                suggestion: `Cuando se compre "${rule.product1.name}", recomendar "${rule.product2.name}"`,
                confidence: rule.confidence1to2,
                strength: rule.strength
            }))
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Análisis de rentabilidad por cliente
exports.getCustomerProfitabilityAnalysis = async (req, res) => {
    try {
        const { months = 12 } = req.query;
        
        const dateFrom = new Date();
        dateFrom.setMonth(dateFrom.getMonth() - months);
        
        const sales = await Sale.find({ date: { $gte: dateFrom } }).populate('clientId');
        const products = await Product.find();
        
        const productCostMap = {};
        products.forEach(product => {
            productCostMap[product._id] = product.purchasePrice;
        });
        
        const clientProfitability = {};
        
        sales.forEach(sale => {
            if (sale.clientId) {
                const clientId = sale.clientId._id.toString();
                
                if (!clientProfitability[clientId]) {
                    clientProfitability[clientId] = {
                        clientId,
                        clientName: sale.clientId.fullname,
                        totalRevenue: 0,
                        totalCost: 0,
                        totalProfit: 0,
                        transactionCount: 0,
                        averageOrderValue: 0,
                        profitMargin: 0
                    };
                }
                
                const client = clientProfitability[clientId];
                client.totalRevenue += sale.total;
                client.transactionCount += 1;
                
                // Calcular costo
                sale.items.forEach(item => {
                    const cost = productCostMap[item.productId] || 0;
                    client.totalCost += cost * item.quantity;
                });
            }
        });
        
        // Calcular métricas finales
        Object.values(clientProfitability).forEach(client => {
            client.totalProfit = client.totalRevenue - client.totalCost;
            client.averageOrderValue = (client.totalRevenue / client.transactionCount).toFixed(2);
            client.profitMargin = client.totalRevenue > 0 ? 
                ((client.totalProfit / client.totalRevenue) * 100).toFixed(2) : 0;
        });
        
        const sortedClients = Object.values(clientProfitability)
            .sort((a, b) => b.totalProfit - a.totalProfit);
        
        const totalProfit = sortedClients.reduce((sum, client) => sum + client.totalProfit, 0);
        const totalRevenue = sortedClients.reduce((sum, client) => sum + client.totalRevenue, 0);
        
        res.json({
            period: `${months} meses`,
            totalClients: sortedClients.length,
            totalRevenue,
            totalProfit,
            overallMargin: totalRevenue > 0 ? ((totalProfit / totalRevenue) * 100).toFixed(2) + '%' : '0%',
            topProfitableClients: sortedClients.slice(0, 10),
            leastProfitableClients: sortedClients.slice(-5),
            pareto: {
                top20Percent: sortedClients.slice(0, Math.ceil(sortedClients.length * 0.2)),
                contributionOfTop20: ((sortedClients.slice(0, Math.ceil(sortedClients.length * 0.2))
                    .reduce((sum, c) => sum + c.totalProfit, 0) / totalProfit) * 100).toFixed(2) + '%'
            }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Análisis de optimización de precios
exports.getPriceOptimizationAnalysis = async (req, res) => {
    try {
        const products = await Product.find().populate('categoryId');
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        
        const sales = await Sale.find({ date: { $gte: thirtyDaysAgo } });
        
        const priceAnalysis = products.map(product => {
            let totalSold = 0;
            let totalRevenue = 0;
            
            sales.forEach(sale => {
                sale.items.forEach(item => {
                    if (item.productId.toString() === product._id.toString()) {
                        totalSold += item.quantity;
                        totalRevenue += item.total;
                    }
                });
            });
            
            const currentMargin = ((product.salePrice - product.purchasePrice) / product.purchasePrice) * 100;
            const averageDailySales = totalSold / 30;
            
            // Simulaciones de precio
            const priceScenarios = [
                { change: -10, newPrice: product.salePrice * 0.9 },
                { change: -5, newPrice: product.salePrice * 0.95 },
                { change: 5, newPrice: product.salePrice * 1.05 },
                { change: 10, newPrice: product.salePrice * 1.1 },
                { change: 15, newPrice: product.salePrice * 1.15 }
            ].map(scenario => {
                const newMargin = ((scenario.newPrice - product.purchasePrice) / product.purchasePrice) * 100;
                // Estimación simple de elasticidad (asumiendo elasticidad de -1.5)
                const demandChange = scenario.change * -1.5;
                const estimatedNewSales = averageDailySales * (1 + demandChange / 100);
                const estimatedRevenue = estimatedNewSales * scenario.newPrice * 30;
                
                return {
                    priceChange: scenario.change + '%',
                    newPrice: newMargin.toFixed(2),
                    newMargin: newMargin.toFixed(2) + '%',
                    estimatedDemandChange: demandChange.toFixed(1) + '%',
                    estimatedMonthlySales: Math.max(0, estimatedNewSales * 30).toFixed(0),
                    estimatedMonthlyRevenue: Math.max(0, estimatedRevenue).toFixed(2)
                };
            });
            
            // Recomendación
            let recommendation = 'Mantener precio actual';
            if (currentMargin < 20 && averageDailySales > 1) {
                recommendation = 'Considerar aumento de precio';
            } else if (currentMargin > 60 && averageDailySales < 0.5) {
                recommendation = 'Considerar reducción de precio';
            } else if (totalSold === 0) {
                recommendation = 'Revisar estrategia de precio';
            }
            
            return {
                productId: product._id,
                name: product.name,
                category: product.categoryId?.name,
                currentPrice: product.salePrice,
                currentMargin: currentMargin.toFixed(2) + '%',
                averageDailySales: averageDailySales.toFixed(2),
                monthlyRevenue: totalRevenue.toFixed(2),
                recommendation,
                priceScenarios
            };
        });
        
        res.json({
            totalProducts: priceAnalysis.length,
            period: 'Últimos 30 días',
            products: priceAnalysis.sort((a, b) => parseFloat(b.monthlyRevenue) - parseFloat(a.monthlyRevenue)),
            summary: {
                avgMargin: (priceAnalysis.reduce((sum, p) => sum + parseFloat(p.currentMargin), 0) / priceAnalysis.length).toFixed(2) + '%',
                highMarginProducts: priceAnalysis.filter(p => parseFloat(p.currentMargin) > 50).length,
                lowMarginProducts: priceAnalysis.filter(p => parseFloat(p.currentMargin) < 20).length,
                slowMovingProducts: priceAnalysis.filter(p => parseFloat(p.averageDailySales) < 0.1).length
            }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};



// Análisis de patrones de compra
exports.getPurchasePatternAnalysis = async (req, res) => {
    try {
        const { days = 90 } = req.query;
        
        const dateFrom = new Date();
        dateFrom.setDate(dateFrom.getDate() - days);
        
        const sales = await Sale.find({ date: { $gte: dateFrom } });
        
        // Análisis por día de la semana
        const dayOfWeekAnalysis = {
            0: { day: 'Domingo', sales: 0, revenue: 0, avgOrder: 0 },
            1: { day: 'Lunes', sales: 0, revenue: 0, avgOrder: 0 },
            2: { day: 'Martes', sales: 0, revenue: 0, avgOrder: 0 },
            3: { day: 'Miércoles', sales: 0, revenue: 0, avgOrder: 0 },
            4: { day: 'Jueves', sales: 0, revenue: 0, avgOrder: 0 },
            5: { day: 'Viernes', sales: 0, revenue: 0, avgOrder: 0 },
            6: { day: 'Sábado', sales: 0, revenue: 0, avgOrder: 0 }
        };
        
        // Análisis por hora
        const hourAnalysis = {};
        for (let i = 0; i < 24; i++) {
            hourAnalysis[i] = { hour: i, sales: 0, revenue: 0 };
        }
        
        sales.forEach(sale => {
            const dayOfWeek = sale.date.getDay();
            const hour = sale.date.getHours();
            
            dayOfWeekAnalysis[dayOfWeek].sales += 1;
            dayOfWeekAnalysis[dayOfWeek].revenue += sale.total;
            
            hourAnalysis[hour].sales += 1;
            hourAnalysis[hour].revenue += sale.total;
        });
        
        // Calcular promedios
        Object.values(dayOfWeekAnalysis).forEach(day => {
            day.avgOrder = day.sales > 0 ? (day.revenue / day.sales).toFixed(2) : 0;
        });
        
        // Encontrar mejores y peores días/horas
        const bestDay = Object.values(dayOfWeekAnalysis).reduce((max, day) => 
            day.revenue > max.revenue ? day : max);
        const worstDay = Object.values(dayOfWeekAnalysis).reduce((min, day) => 
            day.revenue < min.revenue ? day : min);
        
        const bestHour = Object.values(hourAnalysis).reduce((max, hour) => 
            hour.revenue > max.revenue ? hour : max);
        const worstHour = Object.values(hourAnalysis).reduce((min, hour) => 
            hour.revenue < min.revenue ? hour : min);
        
        res.json({
            period: `${days} días`,
            totalSales: sales.length,
            totalRevenue: sales.reduce((sum, sale) => sum + sale.total, 0),
            patterns: {
                byDayOfWeek: Object.values(dayOfWeekAnalysis),
                byHour: Object.values(hourAnalysis),
                insights: {
                    bestDay: bestDay.day,
                    worstDay: worstDay.day,
                    bestHour: `${bestHour.hour}:00`,
                    worstHour: `${worstHour.hour}:00`,
                    weekendVsWeekday: {
                        weekend: dayOfWeekAnalysis[0].revenue + dayOfWeekAnalysis[6].revenue,
                        weekday: Object.keys(dayOfWeekAnalysis)
                            .filter(day => day != 0 && day != 6)
                            .reduce((sum, day) => sum + dayOfWeekAnalysis[day].revenue, 0)
                    }
                }
            }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Análisis de retention de clientes
exports.getCustomerRetentionAnalysis = async (req, res) => {
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
        } else {
            // Por defecto, últimos 12 meses
            const twelveMonthsAgo = new Date();
            twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);
            dateFilter = { date: { $gte: twelveMonthsAgo } };
        }
        
        const sales = await Sale.find(dateFilter).sort({ date: 1 });
        
        // Agrupar por cliente y mes
        const customerMonths = {};
        const monthlyCustomers = {};
        
        sales.forEach(sale => {
            const clientId = sale.clientId.toString();
            const monthYear = `${sale.date.getFullYear()}-${String(sale.date.getMonth() + 1).padStart(2, '0')}`;
            
            if (!customerMonths[clientId]) {
                customerMonths[clientId] = new Set();
            }
            customerMonths[clientId].add(monthYear);
            
            if (!monthlyCustomers[monthYear]) {
                monthlyCustomers[monthYear] = new Set();
            }
            monthlyCustomers[monthYear].add(clientId);
        });
        
        // Calcular retention por cohorte
        const months = Object.keys(monthlyCustomers).sort();
        const cohortAnalysis = {};
        
        months.forEach((month, index) => {
            const cohortCustomers = monthlyCustomers[month];
            const cohortSize = cohortCustomers.size;
            
            cohortAnalysis[month] = {
                cohortMonth: month,
                cohortSize,
                retention: {}
            };
            
            // Calcular retention para cada mes siguiente
            for (let i = index; i < months.length; i++) {
                const futureMonth = months[i];
                const retainedCustomers = [...cohortCustomers].filter(customer => 
                    monthlyCustomers[futureMonth] && monthlyCustomers[futureMonth].has(customer)
                ).length;
                
                const retentionRate = cohortSize > 0 ? ((retainedCustomers / cohortSize) * 100).toFixed(2) : 0;
                const monthsElapsed = i - index;
                
                cohortAnalysis[month].retention[`month_${monthsElapsed}`] = {
                    month: futureMonth,
                    retained: retainedCustomers,
                    rate: retentionRate + '%'
                };
            }
        });
        
        // Calcular métricas generales
        const totalCustomers = new Set(sales.map(sale => sale.clientId.toString())).size;
        const returningCustomers = Object.values(customerMonths).filter(months => months.size > 1).length;
        const overallRetentionRate = totalCustomers > 0 ? ((returningCustomers / totalCustomers) * 100).toFixed(2) : 0;
        
        res.json({
            period: { startDate, endDate },
            summary: {
                totalCustomers,
                returningCustomers,
                overallRetentionRate: overallRetentionRate + '%',
                averageCustomerLifespan: (Object.values(customerMonths)
                    .reduce((sum, months) => sum + months.size, 0) / totalCustomers).toFixed(1) + ' meses'
            },
            cohortAnalysis: Object.values(cohortAnalysis),
            insights: {
                bestRetentionCohort: Object.values(cohortAnalysis).reduce((best, cohort) => {
                    const month1Retention = parseFloat(cohort.retention.month_1?.rate || '0');
                    const bestMonth1 = parseFloat(best.retention.month_1?.rate || '0');
                    return month1Retention > bestMonth1 ? cohort : best;
                }),
                worstRetentionCohort: Object.values(cohortAnalysis).reduce((worst, cohort) => {
                    const month1Retention = parseFloat(cohort.retention.month_1?.rate || '100');
                    const worstMonth1 = parseFloat(worst.retention.month_1?.rate || '100');
                    return month1Retention < worstMonth1 ? cohort : worst;
                })
            }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};





// Análisis de performance de productos por período
exports.getProductPerformanceComparison = async (req, res) => {
    try {
        const { period1Start, period1End, period2Start, period2End } = req.query;
        
        if (!period1Start || !period1End || !period2Start || !period2End) {
            return res.status(400).json({ 
                error: 'Se requieren los parámetros: period1Start, period1End, period2Start, period2End' 
            });
        }
        
        const period1Sales = await Sale.find({
            date: { $gte: new Date(period1Start), $lte: new Date(period1End) }
        });
        
        const period2Sales = await Sale.find({
            date: { $gte: new Date(period2Start), $lte: new Date(period2End) }
        });
        
        const products = await Product.find();
        
        const productComparison = products.map(product => {
            const productId = product._id.toString();
            
            // Período 1
            let period1Revenue = 0;
            let period1Quantity = 0;
            period1Sales.forEach(sale => {
                sale.items.forEach(item => {
                    if (item.productId.toString() === productId) {
                        period1Revenue += item.total;
                        period1Quantity += item.quantity;
                    }
                });
            });
            
            // Período 2
            let period2Revenue = 0;
            let period2Quantity = 0;
            period2Sales.forEach(sale => {
                sale.items.forEach(item => {
                    if (item.productId.toString() === productId) {
                        period2Revenue += item.total;
                        period2Quantity += item.quantity;
                    }
                });
            });
            
            // Calcular cambios
            const revenueChange = period1Revenue > 0 ? 
                (((period2Revenue - period1Revenue) / period1Revenue) * 100).toFixed(2) : 
                period2Revenue > 0 ? 100 : 0;
            
            const quantityChange = period1Quantity > 0 ? 
                (((period2Quantity - period1Quantity) / period1Quantity) * 100).toFixed(2) : 
                period2Quantity > 0 ? 100 : 0;
            
            return {
                productId: product._id,
                name: product.name,
                period1: {
                    revenue: period1Revenue,
                    quantity: period1Quantity
                },
                period2: {
                    revenue: period2Revenue,
                    quantity: period2Quantity
                },
                changes: {
                    revenueChange: revenueChange + '%',
                    quantityChange: quantityChange + '%',
                    trend: revenueChange > 10 ? 'Creciendo' : 
                           revenueChange < -10 ? 'Declinando' : 'Estable'
                }
            };
        });
        
        // Ordenar por cambio en ingresos
        const sortedProducts = productComparison.sort((a, b) => 
            parseFloat(b.changes.revenueChange) - parseFloat(a.changes.revenueChange)
        );
        
        res.json({
            periods: {
                period1: { start: period1Start, end: period1End },
                period2: { start: period2Start, end: period2End }
            },
            summary: {
                totalProducts: products.length,
                growing: sortedProducts.filter(p => parseFloat(p.changes.revenueChange) > 10).length,
                stable: sortedProducts.filter(p => {
                    const change = parseFloat(p.changes.revenueChange);
                    return change >= -10 && change <= 10;
                }).length,
                declining: sortedProducts.filter(p => parseFloat(p.changes.revenueChange) < -10).length
            },
            topGainers: sortedProducts.slice(0, 10),
            topLosers: sortedProducts.slice(-10).reverse(),
            allProducts: sortedProducts
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Análisis de margen por categoría
exports.getCategoryMarginAnalysis = async (req, res) => {
    try {
        const products = await Product.find().populate('categoryId');
        const categories = await Category.find();
        
        const categoryAnalysis = categories.map(category => {
            const categoryProducts = products.filter(p => 
                p.categoryId && p.categoryId._id.toString() === category._id.toString()
            );
            
            if (categoryProducts.length === 0) {
                return {
                    categoryId: category._id,
                    categoryName: category.name,
                    productCount: 0,
                    averageMargin: 0,
                    totalInventoryValue: 0,
                    highMarginProducts: 0,
                    lowMarginProducts: 0
                };
            }
            
            const margins = categoryProducts.map(p => 
                ((p.salePrice - p.purchasePrice) / p.purchasePrice) * 100
            );
            
            const averageMargin = margins.reduce((sum, margin) => sum + margin, 0) / margins.length;
            const totalInventoryValue = categoryProducts.reduce((sum, p) => sum + (p.salePrice * p.stock), 0);
            
            return {
                categoryId: category._id,
                categoryName: category.name,
                productCount: categoryProducts.length,
                averageMargin: averageMargin.toFixed(2) + '%',
                totalInventoryValue,
                highMarginProducts: margins.filter(m => m > 50).length,
                lowMarginProducts: margins.filter(m => m < 20).length,
                marginDistribution: {
                    excellent: margins.filter(m => m > 60).length,
                    good: margins.filter(m => m >= 40 && m <= 60).length,
                    fair: margins.filter(m => m >= 20 && m < 40).length,
                    poor: margins.filter(m => m < 20).length
                }
            };
        });
        
        res.json({
            totalCategories: categories.length,
            categoryAnalysis: categoryAnalysis.sort((a, b) => parseFloat(b.averageMargin) - parseFloat(a.averageMargin)),
            overallStats: {
                bestCategory: categoryAnalysis.reduce((best, cat) => 
                    parseFloat(cat.averageMargin) > parseFloat(best.averageMargin) ? cat : best
                ),
                worstCategory: categoryAnalysis.reduce((worst, cat) => 
                    parseFloat(cat.averageMargin) < parseFloat(worst.averageMargin) ? cat : worst
                )
            }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
  



// Análisis de velocidad de venta
exports.getSalesVelocityAnalysis = async (req, res) => {
    try {
        const { days = 30 } = req.query;
        
        const dateFrom = new Date();
        dateFrom.setDate(dateFrom.getDate() - days);
        
        const products = await Product.find().populate('categoryId');
        const sales = await Sale.find({ date: { $gte: dateFrom } });
        
        const velocityAnalysis = products.map(product => {
            let totalSold = 0;
            let lastSaleDate = null;
            
            sales.forEach(sale => {
                sale.items.forEach(item => {
                    if (item.productId.toString() === product._id.toString()) {
                        totalSold += item.quantity;
                        if (!lastSaleDate || sale.date > lastSaleDate) {
                            lastSaleDate = sale.date;
                        }
                    }
                });
            });
            
            const dailyVelocity = totalSold / parseInt(days);
            const daysSinceLastSale = lastSaleDate ? 
                Math.floor((new Date() - lastSaleDate) / (1000 * 60 * 60 * 24)) : null;
            
            let velocityCategory;
            if (dailyVelocity >= 5) velocityCategory = 'Muy rápida';
            else if (dailyVelocity >= 2) velocityCategory = 'Rápida';
            else if (dailyVelocity >= 0.5) velocityCategory = 'Moderada';
            else if (dailyVelocity > 0) velocityCategory = 'Lenta';
            else velocityCategory = 'Sin movimiento';
            
            return {
                productId: product._id,
                name: product.name,
                category: product.categoryId?.name,
                currentStock: product.stock,
                totalSold,
                dailyVelocity: dailyVelocity.toFixed(2),
                daysSinceLastSale,
                velocityCategory,
                daysToStockout: dailyVelocity > 0 ? Math.ceil(product.stock / dailyVelocity) : 'N/A',
                restockUrgency: dailyVelocity > 0 && (product.stock / dailyVelocity) < 7 ? 'Urgente' : 'Normal'
            };
        });
        
        const velocitySummary = {
            'Muy rápida': velocityAnalysis.filter(p => p.velocityCategory === 'Muy rápida').length,
            'Rápida': velocityAnalysis.filter(p => p.velocityCategory === 'Rápida').length,
            'Moderada': velocityAnalysis.filter(p => p.velocityCategory === 'Moderada').length,
            'Lenta': velocityAnalysis.filter(p => p.velocityCategory === 'Lenta').length,
            'Sin movimiento': velocityAnalysis.filter(p => p.velocityCategory === 'Sin movimiento').length
        };
        
        res.json({
            period: `${days} días`,
            totalProducts: velocityAnalysis.length,
            velocitySummary,
            urgentRestockNeeded: velocityAnalysis.filter(p => p.restockUrgency === 'Urgente').length,
            products: velocityAnalysis.sort((a, b) => parseFloat(b.dailyVelocity) - parseFloat(a.dailyVelocity))
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Análisis de punto de equilibrio
exports.getBreakEvenAnalysis = async (req, res) => {
    try {
        const { fixedCosts = 0 } = req.query;
        const products = await Product.find().populate('categoryId');
        
        const breakEvenAnalysis = products.map(product => {
            const unitMargin = product.salePrice - product.purchasePrice;
            const marginPercentage = ((unitMargin / product.salePrice) * 100).toFixed(2);
            
            // Calcular punto de equilibrio básico (sin costos fijos)
            const basicBreakEven = unitMargin > 0 ? 1 : 'N/A';
            
            // Calcular punto de equilibrio con costos fijos distribuidos
            const allocatedFixedCost = parseFloat(fixedCosts) / products.length;
            const breakEvenWithFixed = unitMargin > 0 ? 
                Math.ceil(allocatedFixedCost / unitMargin) : 'N/A';
            
            // Análisis de sensibilidad
            const scenarios = [
                { priceChange: -5, newPrice: product.salePrice * 0.95 },
                { priceChange: 0, newPrice: product.salePrice },
                { priceChange: 5, newPrice: product.salePrice * 1.05 },
                { priceChange: 10, newPrice: product.salePrice * 1.1 }
            ].map(scenario => {
                const newMargin = scenario.newPrice - product.purchasePrice;
                const newBreakEven = newMargin > 0 ? Math.ceil(allocatedFixedCost / newMargin) : 'N/A';
                
                return {
                    priceChange: scenario.priceChange + '%',
                    newPrice: scenario.newPrice.toFixed(2),
                    newMargin: newMargin.toFixed(2),
                    breakEvenUnits: newBreakEven
                };
            });
            
            return {
                productId: product._id,
                name: product.name,
                category: product.categoryId?.name,
                currentPrice: product.salePrice,
                unitCost: product.purchasePrice,
                unitMargin,
                marginPercentage: marginPercentage + '%',
                basicBreakEven,
                breakEvenWithFixed,
                currentStock: product.stock,
                stockValue: product.stock * product.purchasePrice,
                scenarios
            };
        });
        
        res.json({
            fixedCostsConsidered: parseFloat(fixedCosts),
            totalProducts: breakEvenAnalysis.length,
            summary: {
                averageMargin: (breakEvenAnalysis.reduce((sum, p) => sum + p.unitMargin, 0) / products.length).toFixed(2),
                profitableProducts: breakEvenAnalysis.filter(p => p.unitMargin > 0).length,
                highMarginProducts: breakEvenAnalysis.filter(p => parseFloat(p.marginPercentage) > 40).length
            },
            products: breakEvenAnalysis.sort((a, b) => b.unitMargin - a.unitMargin)
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Análisis de estacionalidad avanzado
exports.getAdvancedSeasonalityAnalysis = async (req, res) => {
    try {
        const { productId, categoryId } = req.query;
        
        const currentYear = new Date().getFullYear();
        const startDate = new Date(currentYear - 1, 0, 1);
        const endDate = new Date(currentYear, 11, 31);
        
        let salesQuery = { date: { $gte: startDate, $lte: endDate } };
        const sales = await Sale.find(salesQuery);
        
        let products = await Product.find().populate('categoryId');
        if (productId) {
            products = products.filter(p => p._id.toString() === productId);
        } else if (categoryId) {
            products = products.filter(p => p.categoryId && p.categoryId._id.toString() === categoryId);
        }
        
        const seasonalData = products.map(product => {
            const monthlyData = {};
            for (let month = 0; month < 12; month++) {
                monthlyData[month] = {
                    month: month + 1,
                    sales: 0,
                    revenue: 0,
                    avgPrice: 0
                };
            }
            
            sales.forEach(sale => {
                sale.items.forEach(item => {
                    if (item.productId.toString() === product._id.toString()) {
                        const month = sale.date.getMonth();
                        monthlyData[month].sales += item.quantity;
                        monthlyData[month].revenue += item.total;
                    }
                });
            });
            
            // Calcular precios promedio
            Object.values(monthlyData).forEach(data => {
                data.avgPrice = data.sales > 0 ? (data.revenue / data.sales).toFixed(2) : 0;
            });
            
            // Identificar temporadas
            const seasons = {
                spring: [2, 3, 4], // Mar, Abr, May
                summer: [5, 6, 7], // Jun, Jul, Ago
                autumn: [8, 9, 10], // Sep, Oct, Nov
                winter: [11, 0, 1] // Dic, Ene, Feb
            };
            
            const seasonalSummary = {};
            Object.keys(seasons).forEach(season => {
                const seasonData = seasons[season].reduce((sum, month) => {
                    return {
                        sales: sum.sales + monthlyData[month].sales,
                        revenue: sum.revenue + monthlyData[month].revenue
                    };
                }, { sales: 0, revenue: 0 });
                
                seasonalSummary[season] = {
                    sales: seasonData.sales,
                    revenue: seasonData.revenue,
                    avgMonthly: (seasonData.sales / 3).toFixed(1)
                };
            });
            
            // Encontrar mejor y peor mes
            const monthlyArray = Object.values(monthlyData);
            const bestMonth = monthlyArray.reduce((max, month) => month.sales > max.sales ? month : max);
            const worstMonth = monthlyArray.reduce((min, month) => month.sales < min.sales ? month : min);
            
            return {
                productId: product._id,
                name: product.name,
                category: product.categoryId?.name,
                monthlyData: Object.values(monthlyData),
                seasonalSummary,
                insights: {
                    bestMonth: `Mes ${bestMonth.month} (${bestMonth.sales} unidades)`,
                    worstMonth: `Mes ${worstMonth.month} (${worstMonth.sales} unidades)`,
                    seasonality: 'Detectada', // Simplificado
                    recommendation: bestMonth.sales > worstMonth.sales * 2 ? 
                        'Producto estacional - planificar inventario' : 
                        'Ventas relativamente estables'
                }
            };
        });
        
        res.json({
            period: `${currentYear - 1} - ${currentYear}`,
            filters: { productId, categoryId },
            productsAnalyzed: seasonalData.length,
            analysis: seasonalData
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};






// Análisis de concentración de ventas (Pareto)
exports.getParetoAnalysis = async (req, res) => {
    try {
        const { days = 90, analysisType = 'products' } = req.query;
        
        const dateFrom = new Date();
        dateFrom.setDate(dateFrom.getDate() - days);
        
        const sales = await Sale.find({ date: { $gte: dateFrom } });
        
        let analysisData = {};
        
        if (analysisType === 'products') {
            // Análisis por productos
            sales.forEach(sale => {
                sale.items.forEach(item => {
                    const key = item.productId.toString();
                    if (!analysisData[key]) {
                        analysisData[key] = {
                            id: key,
                            name: item.name,
                            revenue: 0,
                            quantity: 0
                        };
                    }
                    analysisData[key].revenue += item.total;
                    analysisData[key].quantity += item.quantity;
                });
            });
        } else if (analysisType === 'clients') {
            // Análisis por clientes
            const clients = await Client.find();
            const clientMap = {};
            clients.forEach(client => {
                clientMap[client._id] = client.fullname;
            });
            
            sales.forEach(sale => {
                const key = sale.clientId.toString();
                if (!analysisData[key]) {
                    analysisData[key] = {
                        id: key,
                        name: clientMap[key] || 'Cliente eliminado',
                        revenue: 0,
                        transactions: 0
                    };
                }
                analysisData[key].revenue += sale.total;
                analysisData[key].transactions += 1;
            });
        }
        
        // Convertir a array y ordenar por ingresos
        const sortedData = Object.values(analysisData).sort((a, b) => b.revenue - a.revenue);
        const totalRevenue = sortedData.reduce((sum, item) => sum + item.revenue, 0);
        
        // Calcular análisis Pareto
        let cumulativeRevenue = 0;
        const paretoData = sortedData.map((item, index) => {
            cumulativeRevenue += item.revenue;
            const cumulativePercentage = (cumulativeRevenue / totalRevenue) * 100;
            const revenuePercentage = (item.revenue / totalRevenue) * 100;
            
            return {
                ...item,
                rank: index + 1,
                revenuePercentage: revenuePercentage.toFixed(2) + '%',
                cumulativePercentage: cumulativePercentage.toFixed(2) + '%',
                category: cumulativePercentage <= 80 ? 'A' : cumulativePercentage <= 95 ? 'B' : 'C'
            };
        });
        
        // Calcular estadísticas de Pareto
        const categoryA = paretoData.filter(item => item.category === 'A');
        const categoryB = paretoData.filter(item => item.category === 'B');
        const categoryC = paretoData.filter(item => item.category === 'C');
        
        const paretoStats = {
            categoryA: {
                count: categoryA.length,
                percentage: ((categoryA.length / paretoData.length) * 100).toFixed(1) + '%',
                revenueContribution: categoryA.reduce((sum, item) => sum + item.revenue, 0),
                revenuePercentage: '~80%'
            },
            categoryB: {
                count: categoryB.length,
                percentage: ((categoryB.length / paretoData.length) * 100).toFixed(1) + '%',
                revenueContribution: categoryB.reduce((sum, item) => sum + item.revenue, 0),
                revenuePercentage: '~15%'
            },
            categoryC: {
                count: categoryC.length,
                percentage: ((categoryC.length / paretoData.length) * 100).toFixed(1) + '%',
                revenueContribution: categoryC.reduce((sum, item) => sum + item.revenue, 0),
                revenuePercentage: '~5%'
            }
        };
        
        res.json({
            analysisType,
            period: `${days} días`,
            totalItems: paretoData.length,
            totalRevenue,
            paretoStats,
            recommendations: {
                focusOn: `Los ${categoryA.length} ${analysisType} de categoría A generan el 80% de los ingresos`,
                optimize: `Considerar estrategias especiales para categoría A`,
                review: `Evaluar la viabilidad de ${categoryC.length} ${analysisType} de categoría C`
            },
            data: paretoData
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Simulador de escenarios de negocio
exports.getBusinessScenarioSimulation = async (req, res) => {
    try {
        const { 
            scenarioType = 'price_change', 
            priceChangePercentage = 0,
            demandChangePercentage = 0,
            costChangePercentage = 0,
            productIds = []
        } = req.body;
        
        let products;
        if (productIds.length > 0) {
            products = await Product.find({ _id: { $in: productIds } });
        } else {
            products = await Product.find();
        }
        
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const sales = await Sale.find({ date: { $gte: thirtyDaysAgo } });
        
        const simulationResults = products.map(product => {
            // Calcular ventas actuales
            let currentSales = 0;
            let currentRevenue = 0;
            
            sales.forEach(sale => {
                sale.items.forEach(item => {
                    if (item.productId.toString() === product._id.toString()) {
                        currentSales += item.quantity;
                        currentRevenue += item.total;
                    }
                });
            });
            
            const currentDailySales = currentSales / 30;
            const currentProfit = product.salePrice - product.purchasePrice;
            const currentMargin = product.purchasePrice > 0 ? 
                ((currentProfit / product.purchasePrice) * 100) : 0;
            
            // Aplicar cambios del escenario
            const newPrice = product.salePrice * (1 + priceChangePercentage / 100);
            const newCost = product.purchasePrice * (1 + costChangePercentage / 100);
            const newDemand = currentDailySales * (1 + demandChangePercentage / 100);
            
            const newProfit = newPrice - newCost;
            const newMargin = newCost > 0 ? ((newProfit / newCost) * 100) : 0;
            const newMonthlyRevenue = newPrice * newDemand * 30;
            const newMonthlyProfit = newProfit * newDemand * 30;
            
            // Calcular impactos
            const revenueImpact = newMonthlyRevenue - currentRevenue;
            const profitImpact = newMonthlyProfit - (currentProfit * currentDailySales * 30);
            const marginDifference = newMargin - currentMargin;
            
            return {
                productId: product._id,
                name: product.name,
                current: {
                    price: product.salePrice,
                    cost: product.purchasePrice,
                    profit: currentProfit,
                    margin: currentMargin.toFixed(2) + '%',
                    dailySales: currentDailySales.toFixed(2),
                    monthlyRevenue: currentRevenue
                },
                simulated: {
                    price: newPrice.toFixed(2),
                    cost: newCost.toFixed(2),
                    profit: newProfit.toFixed(2),
                    margin: newMargin.toFixed(2) + '%',
                    dailySales: newDemand.toFixed(2),
                    monthlyRevenue: newMonthlyRevenue.toFixed(2)
                },
                impact: {
                    revenueChange: revenueImpact.toFixed(2),
                    profitChange: profitImpact.toFixed(2),
                    marginChange: marginDifference.toFixed(2) + '%',
                    recommendation: profitImpact > 0 ? 'Positivo' : 
                                   profitImpact < -100 ? 'Muy negativo' : 'Negativo'
                }
            };
        });
        
        const totalImpact = {
            totalRevenueChange: simulationResults.reduce((sum, r) => sum + parseFloat(r.impact.revenueChange), 0),
            totalProfitChange: simulationResults.reduce((sum, r) => sum + parseFloat(r.impact.profitChange), 0),
            positiveImpacts: simulationResults.filter(r => parseFloat(r.impact.profitChange) > 0).length,
            negativeImpacts: simulationResults.filter(r => parseFloat(r.impact.profitChange) < 0).length
        };
        
        res.json({
            scenarioType,
            parameters: {
                priceChangePercentage: priceChangePercentage + '%',
                demandChangePercentage: demandChangePercentage + '%',
                costChangePercentage: costChangePercentage + '%'
            },
            productsAnalyzed: simulationResults.length,
            totalImpact,
            overallRecommendation: totalImpact.totalProfitChange > 0 ? 
                'Escenario favorable' : 'Escenario desfavorable',
            results: simulationResults.sort((a, b) => 
                parseFloat(b.impact.profitChange) - parseFloat(a.impact.profitChange)
            )
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};






// Análisis de gap de precios
exports.getPriceGapAnalysis = async (req, res) => {
    try {
        const products = await Product.find().populate('categoryId');
        const categories = await Category.find();
        
        const categoryAnalysis = categories.map(category => {
            const categoryProducts = products.filter(p => 
                p.categoryId && p.categoryId._id.toString() === category._id.toString()
            );
            
            if (categoryProducts.length === 0) {
                return null;
            }
            
            const prices = categoryProducts.map(p => p.salePrice).sort((a, b) => a - b);
            const costs = categoryProducts.map(p => p.purchasePrice).sort((a, b) => a - b);
            
            // Análisis de gaps en precios
            const priceGaps = [];
            for (let i = 1; i < prices.length; i++) {
                const gap = prices[i] - prices[i-1];
                const gapPercentage = ((gap / prices[i-1]) * 100).toFixed(1);
                
                if (gap > prices[i-1] * 0.25) { // Gap mayor al 25%
                    priceGaps.push({
                        lowerPrice: prices[i-1],
                        higherPrice: prices[i],
                        gap,
                        gapPercentage: gapPercentage + '%',
                        opportunity: `Potencial producto en rango $${(prices[i-1] + gap/2).toFixed(2)}`
                    });
                }
            }
            
            const stats = {
                productCount: categoryProducts.length,
                priceRange: {
                    min: Math.min(...prices),
                    max: Math.max(...prices),
                    average: (prices.reduce((sum, p) => sum + p, 0) / prices.length).toFixed(2)
                },
                costRange: {
                    min: Math.min(...costs),
                    max: Math.max(...costs),
                    average: (costs.reduce((sum, c) => sum + c, 0) / costs.length).toFixed(2)
                },
                gaps: priceGaps,
                gapOpportunities: priceGaps.length
            };
            
            return {
                categoryId: category._id,
                categoryName: category.name,
                ...stats
            };
        }).filter(analysis => analysis !== null);
        
        res.json({
            totalCategories: categoryAnalysis.length,
            categories: categoryAnalysis.sort((a, b) => b.gapOpportunities - a.gapOpportunities),
            summary: {
                totalGapOpportunities: categoryAnalysis.reduce((sum, cat) => sum + cat.gapOpportunities, 0),
                categoriesWithGaps: categoryAnalysis.filter(cat => cat.gapOpportunities > 0).length,
                recommendations: categoryAnalysis
                    .filter(cat => cat.gapOpportunities > 0)
                    .slice(0, 3)
                    .map(cat => ({
                        category: cat.categoryName,
                        suggestion: `Considerar ${cat.gapOpportunities} nuevos productos en rangos de precio identificados`
                    }))
            }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Análisis de dispersión de precios
exports.getPriceDispersionAnalysis = async (req, res) => {
    try {
        const products = await Product.find().populate('categoryId');
        
        const overallPrices = products.map(p => p.salePrice);
        const overallCosts = products.map(p => p.purchasePrice);
        
        // Cálculos estadísticos generales
        const priceStats = {
            mean: (overallPrices.reduce((sum, p) => sum + p, 0) / overallPrices.length).toFixed(2),
            median: calculateMedian(overallPrices).toFixed(2),
            standardDeviation: calculateStandardDeviation(overallPrices).toFixed(2),
            variance: calculateVariance(overallPrices).toFixed(2),
            range: {
                min: Math.min(...overallPrices),
                max: Math.max(...overallPrices),
                spread: (Math.max(...overallPrices) - Math.min(...overallPrices)).toFixed(2)
            }
        };
        
        // Análisis por categoría
        const categoryDispersion = {};
        products.forEach(product => {
            const categoryName = product.categoryId?.name || 'Sin categoría';
            
            if (!categoryDispersion[categoryName]) {
                categoryDispersion[categoryName] = {
                    prices: [],
                    margins: []
                };
            }
            
            categoryDispersion[categoryName].prices.push(product.salePrice);
            const margin = ((product.salePrice - product.purchasePrice) / product.purchasePrice) * 100;
            categoryDispersion[categoryName].margins.push(margin);
        });
        
        const categoryAnalysis = Object.keys(categoryDispersion).map(categoryName => {
            const prices = categoryDispersion[categoryName].prices;
            const margins = categoryDispersion[categoryName].margins;
            
            return {
                category: categoryName,
                priceStats: {
                    mean: (prices.reduce((sum, p) => sum + p, 0) / prices.length).toFixed(2),
                    standardDeviation: calculateStandardDeviation(prices).toFixed(2),
                    coefficientOfVariation: (calculateStandardDeviation(prices) / (prices.reduce((sum, p) => sum + p, 0) / prices.length) * 100).toFixed(2) + '%'
                },
                marginStats: {
                    mean: (margins.reduce((sum, m) => sum + m, 0) / margins.length).toFixed(2) + '%',
                    standardDeviation: calculateStandardDeviation(margins).toFixed(2),
                    consistency: calculateStandardDeviation(margins) < 10 ? 'Alta' : 
                                calculateStandardDeviation(margins) < 20 ? 'Media' : 'Baja'
                },
                productCount: prices.length
            };
        });
        
        // Funciones auxiliares
        function calculateMedian(values) {
            const sorted = [...values].sort((a, b) => a - b);
            const mid = Math.floor(sorted.length / 2);
            return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
        }
        
        function calculateStandardDeviation(values) {
            const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
            const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
            return Math.sqrt(variance);
        }
        
        function calculateVariance(values) {
            const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
            return values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
        }
        
        res.json({
            totalProducts: products.length,
            overallPriceStats: priceStats,
            categoryAnalysis: categoryAnalysis.sort((a, b) => parseFloat(b.priceStats.mean) - parseFloat(a.priceStats.mean)),
            insights: {
                mostConsistentCategory: categoryAnalysis.reduce((best, cat) => 
                    cat.marginStats.consistency === 'Alta' && parseFloat(cat.priceStats.standardDeviation) < parseFloat(best.priceStats.standardDeviation) ? cat : best
                ),
                mostVariableCategory: categoryAnalysis.reduce((worst, cat) => 
                    parseFloat(cat.priceStats.standardDeviation) > parseFloat(worst.priceStats.standardDeviation) ? cat : worst
                )
            }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

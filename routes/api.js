const express = require('express');
const router = express.Router();

const categoryController = require('../controllers/categoryController');
const productController = require('../controllers/productController');
const clientController = require('../controllers/clientController');
const catalogController = require('../controllers/catalogController');
const notificationController = require('../controllers/notificationController');
const supplierController = require('../controllers/supplierController');
const saleController = require('../controllers/saleController');
const businessRulesController = require('../controllers/businessRulesController');

// Categorías
router.get('/categories', categoryController.getAllCategories);
router.get('/categories/:id', categoryController.getCategoryById);
router.post('/categories', categoryController.createCategory);
router.put('/categories/:id', categoryController.updateCategory);
router.delete('/categories/:id', categoryController.deleteCategory);

// Productos
router.get('/products', productController.getAllProducts);
router.get('/products/:id', productController.getProductById);
router.post('/products', productController.createProduct);
router.put('/products/:id', productController.updateProduct);
router.delete('/products/:id', productController.deleteProduct);

// Clientes
router.get('/clients', clientController.getAllClients);
router.get('/clients/:id', clientController.getClientById);
router.post('/clients', clientController.createClient);
router.put('/clients/:id', clientController.updateClient);
router.delete('/clients/:id', clientController.deleteClient);

// Catálogos
router.get('/catalogs', catalogController.getAllCatalogs);
router.get('/catalogs/:id', catalogController.getCatalogById);
router.post('/catalogs', catalogController.createCatalog);
router.put('/catalogs/:id', catalogController.updateCatalog);
router.delete('/catalogs/:id', catalogController.deleteCatalog);

// Notificaciones
router.get('/notifications', notificationController.getAllNotifications);
router.get('/notifications/:id', notificationController.getNotificationById);
router.post('/notifications', notificationController.createNotification);
router.put('/notifications/:id', notificationController.updateNotification);
router.delete('/notifications/:id', notificationController.deleteNotification);

// Proveedores
router.get('/suppliers', supplierController.getAllSuppliers);
router.get('/suppliers/:id', supplierController.getSupplierById);
router.post('/suppliers', supplierController.createSupplier);
router.put('/suppliers/:id', supplierController.updateSupplier);
router.delete('/suppliers/:id', supplierController.deleteSupplier);

// Ventas
router.get('/sales', saleController.getAllSales);
router.get('/sales/:id', saleController.getSaleById);
router.post('/sales', saleController.createSale);
router.put('/sales/:id', saleController.updateSale);
router.delete('/sales/:id', saleController.deleteSale);
// ===== REGLAS DE NEGOCIO  =====

// 1. Análisis de productos
router.get('/business/products/:productId/profit', businessRulesController.calculateProductProfit);
router.get('/business/inventory/value', businessRulesController.calculateInventoryValue);
router.get('/business/products/profit-margin', businessRulesController.getProductsByProfitMargin);
router.get('/business/products/low-stock', businessRulesController.getLowStockProducts);
router.get('/business/products/:productId/rotation', businessRulesController.calculateProductRotation);
// 2. Análisis de ventas
router.get('/business/sales/analytics', businessRulesController.calculateSalesAnalytics);
router.get('/business/sales/top-products', businessRulesController.getTopSellingProducts);
router.get('/business/sales/trend', businessRulesController.getSalesTrend);
router.get('/business/sales/roi', businessRulesController.calculateROI);

// 3. Análisis de clientes
router.get('/business/clients/:clientId/value', businessRulesController.calculateClientValue);
router.get('/business/clients/:clientId/predict-purchase', businessRulesController.predictNextPurchase);

// 4. Análisis de categorías
router.get('/business/categories/performance', businessRulesController.getCategoryPerformance);

// 5. Análisis de precios
router.get('/business/pricing/analysis', businessRulesController.analyzePricing);
router.post('/business/products/:productId/simulate-price', businessRulesController.simulatePriceChange);
module.exports = router;



// 6. Alertas y recomendaciones
router.get('/business/alerts', businessRulesController.getBusinessAlerts);
router.get('/business/dashboard/summary', businessRulesController.getDashboardSummary);

// 7. Análisis temporal
router.get('/business/analysis/seasonal', businessRulesController.getSeasonalAnalysis);



// 8. Eficiencia de inventario
router.get('/business/inventory/efficiency', businessRulesController.getInventoryEfficiency);

// 9. Predicción de demanda
router.get('/business/products/:productId/predict-demand', businessRulesController.predictDemand);




// 10. Análisis ABC
router.get('/business/products/abc-analysis', businessRulesController.getABCAnalysis);

// 11. Análisis de competitividad
router.get('/business/competitive/analysis', businessRulesController.getCompetitiveAnalysis);
router.get('/business/competitive/analysis/:categoryId', businessRulesController.getCompetitiveAnalysis);

// 12. Análisis de riesgo de inventario
router.get('/business/inventory/risk-analysis', businessRulesController.getInventoryRiskAnalysis);

// 13. Análisis de fidelidad de clientes
router.get('/business/customers/loyalty-analysis', businessRulesController.getCustomerLoyaltyAnalysis);

// 14. Análisis de cross-selling
router.get('/business/sales/cross-sell-analysis', businessRulesController.getCrossSellAnalysis);




// 15. Análisis de rentabilidad por cliente
router.get('/business/customers/profitability-analysis', businessRulesController.getCustomerProfitabilityAnalysis);

// 16. Análisis de optimización de precios
router.get('/business/pricing/optimization-analysis', businessRulesController.getPriceOptimizationAnalysis);

// 17. Análisis de patrones de compra
router.get('/business/sales/purchase-patterns', businessRulesController.getPurchasePatternAnalysis);

// 18. Análisis de retención de clientes
router.get('/business/customers/retention-analysis', businessRulesController.getCustomerRetentionAnalysis);


// 19. Comparación de performance de productos
router.get('/business/products/performance-comparison', businessRulesController.getProductPerformanceComparison);

// 20. Análisis de margen por categoría
router.get('/business/categories/margin-analysis', businessRulesController.getCategoryMarginAnalysis);

// 21. Análisis de velocidad de venta
router.get('/business/sales/velocity-analysis', businessRulesController.getSalesVelocityAnalysis);

// 22. Análisis de punto de equilibrio
router.get('/business/financial/break-even-analysis', businessRulesController.getBreakEvenAnalysis);

// 23. Análisis de estacionalidad avanzado
router.get('/business/analysis/advanced-seasonality', businessRulesController.getAdvancedSeasonalityAnalysis);
 




// 24. Análisis de Pareto (80/20)
router.get('/business/analysis/pareto', businessRulesController.getParetoAnalysis);

// 25. Simulador de escenarios
router.post('/business/simulation/scenarios', businessRulesController.getBusinessScenarioSimulation);

// 26. Análisis de gap de precios
router.get('/business/pricing/gap-analysis', businessRulesController.getPriceGapAnalysis);


// 27. Análisis de dispersión de precios
router.get('/business/pricing/dispersion-analysis', businessRulesController.getPriceDispersionAnalysis);

// 28. Análisis de productividad de inventario
router.get('/business/inventory/productivity-analysis', businessRulesController.getInventoryProductivityAnalysis);


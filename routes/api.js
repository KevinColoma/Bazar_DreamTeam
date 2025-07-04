const express = require('express');
const router = express.Router();

const categoryController = require('../controllers/categoryController');
const productController = require('../controllers/productController');
const clientController = require('../controllers/clientController');
const catalogController = require('../controllers/catalogController');
const notificationController = require('../controllers/notificationController');
const supplierController = require('../controllers/supplierController');
const saleController = require('../controllers/saleController');

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

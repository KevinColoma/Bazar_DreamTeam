const Sale = require('../models/sale');

exports.getAllSales = async (req, res) => {
    const sales = await Sale.find().populate('clientId items.productId');
    res.json(sales);
};

exports.getSaleById = async (req, res) => {
    const sale = await Sale.findById(req.params.id).populate('clientId items.productId');
    if (!sale) return res.status(404).send('Venta no encontrada');
    res.json(sale);
};

exports.createSale = async (req, res) => {
    const sale = new Sale(req.body);
    await sale.save();
    res.status(201).json(sale);
};

exports.updateSale = async (req, res) => {
    const sale = await Sale.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!sale) return res.status(404).send('Venta no encontrada');
    res.json(sale);
};

exports.deleteSale = async (req, res) => {
    const sale = await Sale.findByIdAndRemove(req.params.id);
    if (!sale) return res.status(404).send('Venta no encontrada');
    res.status(204).send();
};

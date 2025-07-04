const Supplier = require('../models/supplier');

exports.getAllSuppliers = async (req, res) => {
    const suppliers = await Supplier.find().populate('catalogId');
    res.json(suppliers);
};

exports.getSupplierById = async (req, res) => {
    const supplier = await Supplier.findById(req.params.id).populate('catalogId');
    if (!supplier) return res.status(404).send('Proveedor no encontrado');
    res.json(supplier);
};

exports.createSupplier = async (req, res) => {
    const supplier = new Supplier(req.body);
    await supplier.save();
    res.status(201).json(supplier);
};

exports.updateSupplier = async (req, res) => {
    const supplier = await Supplier.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!supplier) return res.status(404).send('Proveedor no encontrado');
    res.json(supplier);
};

exports.deleteSupplier = async (req, res) => {
    const supplier = await Supplier.findByIdAndRemove(req.params.id);
    if (!supplier) return res.status(404).send('Proveedor no encontrado');
    res.status(204).send();
};

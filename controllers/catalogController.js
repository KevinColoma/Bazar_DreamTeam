const Catalog = require('../models/catalog');

exports.getAllCatalogs = async (req, res) => {
    const catalogs = await Catalog.find();
    res.json(catalogs);
};

exports.getCatalogById = async (req, res) => {
    const catalog = await Catalog.findById(req.params.id);
    if (!catalog) return res.status(404).send('Catálogo no encontrado');
    res.json(catalog);
};

exports.createCatalog = async (req, res) => {
    const catalog = new Catalog(req.body);
    await catalog.save();
    res.status(201).json(catalog);
};

exports.updateCatalog = async (req, res) => {
    const catalog = await Catalog.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!catalog) return res.status(404).send('Catálogo no encontrado');
    res.json(catalog);
};

exports.deleteCatalog = async (req, res) => {
    const catalog = await Catalog.findByIdAndRemove(req.params.id);
    if (!catalog) return res.status(404).send('Catálogo no encontrado');
    res.status(204).send();
};

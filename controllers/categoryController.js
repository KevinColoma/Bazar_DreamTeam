const Category = require('../models/category');

exports.getAllCategories = async (req, res) => {
    const categories = await Category.find();
    res.json(categories);
};

exports.getCategoryById = async (req, res) => {
    const category = await Category.findById(req.params.id);
    if (!category) return res.status(404).send('Categoría no encontrada');
    res.json(category);
};

exports.createCategory = async (req, res) => {
    const category = new Category(req.body);
    await category.save();
    res.status(201).json(category);
};

exports.updateCategory = async (req, res) => {
    const category = await Category.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!category) return res.status(404).send('Categoría no encontrada');
    res.json(category);
};

exports.deleteCategory = async (req, res) => {
    const category = await Category.findByIdAndRemove(req.params.id);
    if (!category) return res.status(404).send('Categoría no encontrada');
    res.status(204).send();
};

const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    name: { type: String, required: true },
    categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
    purchaseUnit: { type: String, required: true },
    quantityIncluded: { type: Number, required: true },
    saleUnit: { type: String, required: true },
    purchasePrice: { type: Number, required: true },
    salePrice: { type: Number, required: true },
    stock: { type: Number, required: true }
});

module.exports = mongoose.model('Product', productSchema);

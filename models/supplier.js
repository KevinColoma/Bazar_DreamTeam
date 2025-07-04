const mongoose = require('mongoose');

const supplierSchema = new mongoose.Schema({
    idNumber: { type: String, required: true },
    company: { type: String, required: true },
    contactName: { type: String, required: true },
    phone: { type: String, required: true },
    bankAccount: { type: String, required: true },
    bankName: { type: String, required: true },
    catalogId: { type: mongoose.Schema.Types.ObjectId, ref: 'Catalog', required: true }
});

module.exports = mongoose.model('Supplier', supplierSchema);

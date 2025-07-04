const mongoose = require('mongoose');

const catalogSchema = new mongoose.Schema({
    name: { type: String, required: true },
    filePath: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Catalog', catalogSchema);

const mongoose = require('mongoose');

const clientSchema = new mongoose.Schema({
    taxid: { type: String, required: true },
    fullname: { type: String, required: true },
    address: { type: String, required: true },
    references: { type: String, required: true },
    phone: { type: String, required: true },
    email: { type: String, required: true }
});

module.exports = mongoose.model('Client', clientSchema);

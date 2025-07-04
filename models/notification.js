const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    icon: { type: String, required: true },
    message: { type: String, required: true },
    date: { type: Date, default: Date.now },
    read: { type: Boolean, default: false }
});

module.exports = mongoose.model('Notification', notificationSchema);

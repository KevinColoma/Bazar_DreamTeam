const Client = require('../models/client');

exports.getAllClients = async (req, res) => {
    const clients = await Client.find();
    res.json(clients);
};

exports.getClientById = async (req, res) => {
    const client = await Client.findById(req.params.id);
    if (!client) return res.status(404).send('Cliente no encontrado');
    res.json(client);
};

exports.createClient = async (req, res) => {
    const client = new Client(req.body);
    await client.save();
    res.status(201).json(client);
};

exports.updateClient = async (req, res) => {
    const client = await Client.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!client) return res.status(404).send('Cliente no encontrado');
    res.json(client);
};

exports.deleteClient = async (req, res) => {
    const client = await Client.findByIdAndRemove(req.params.id);
    if (!client) return res.status(404).send('Cliente no encontrado');
    res.status(204).send();
};

const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const ConsultaSchema = require('../models/Consulta').schema; // Import the schema only

router.post('/', async (req, res) => {
  try {
    // Use the localDb connection from req to create the Consulta model
    const Consulta = req.localDb.model('Consulta', ConsultaSchema);
    
    const consulta = new Consulta(req.body);
    await consulta.save();
    res.status(201).json(consulta);
  } catch (error) {
    console.error('Erro ao registrar consulta:', error);
    res.status(500).send('Erro ao registrar consulta');
  }
});

module.exports = router;

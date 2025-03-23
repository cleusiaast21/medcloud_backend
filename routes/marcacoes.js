const express = require('express');
const router = express.Router();
const MarcacaoSchema = require('../models/Paciente').schema; // Import the schema only
const mongoose = require('mongoose');

// Store database connections globally
let atlasDb, localDb;

// Rota para inicializar as conexões a base de dados
router.use((req, res, next) => {
  atlasDb = req.atlasDb;
  localDb = req.localDb;
  next();
});




module.exports = router;
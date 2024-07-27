const mongoose = require('mongoose');

const consultaSchema = new mongoose.Schema({
  specialty: { type: String, required: true },
  medico: { type: String, required: true },
  pacienteId: { type: String, required: true },
});

module.exports = mongoose.model('Consulta', consultaSchema);

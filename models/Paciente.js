const mongoose = require('mongoose');

const pacienteSchema = new mongoose.Schema({
  nomeCompleto: {
    type: String,
    required: true
  },
  numeroIdentificacao: {
    type: String,
    required: true
  },
  dataNascimento: {
    type: Date,
    required: true
  },
  sexo: {
    type: String,
    required: true
  },
  telefonePrincipal: {
    type: String,
    required: true
  },
  telefoneAlternativo: String,
  email: String,
  password: { type: String, required: true }
});

const Paciente = mongoose.model('Paciente', pacienteSchema);

module.exports = Paciente;

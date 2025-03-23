const mongoose = require('mongoose');

const pacienteSchema = new mongoose.Schema({
    nome: {
        type: String,
        required: true
    },
    telefone: {
        type: String,
        required: true
    },
    especialidade: {
        type: String,
        required: true
    },
    medico: {
        type: String,
        required: true
    },
    data: {
        type: Date,
        required: true
    },
});

const Marcacao = mongoose.model('Marcacao', pacienteSchema);

module.exports = Paciente;

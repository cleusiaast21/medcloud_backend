// models/Employee.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const employeeSchema = new mongoose.Schema({
    nomeCompleto: { type: String, required: true },
    numeroIdentificacao: { type: String, required: true },
    funcionarioId: { type: String, required: true },
    telefone: { type: String, required: true },
    email: { type: String, required: true },
    dataNascimento: { type: String },
    sexo: { type: String, required: true },
    employeeType: { type: String, required: true },
    specialty: {
        type: String,
        required: function() {
            return this.employeeType === 'Medico';
        }
    },
    password: { type: String, required: true }
});

module.exports = mongoose.model('Employee', employeeSchema);

const mongoose = require('mongoose');

const waitingListSchema = new mongoose.Schema({
    pacienteId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Paciente',
        required: true
    },
    medicoId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Medico',
        required: true
    },
    dateAdded: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('WaitingList', waitingListSchema);

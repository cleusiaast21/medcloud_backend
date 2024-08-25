const mongoose = require('mongoose');

const waitingListSchema = new mongoose.Schema({
    pacienteId: {
        type: String,
        required: true
    },
    medicoId: {
        type: String,
        required: true
    },
    dateAdded: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('WaitingList', waitingListSchema);

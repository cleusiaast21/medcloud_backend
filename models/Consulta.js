const mongoose = require('mongoose');

const consultaSchema = new mongoose.Schema({
    specialty: { type: String, required: true },
    medico: { type: String, required: true },
    pacienteId: { type: String, required: true },
    pacienteNome: { type: String },
    state: { type: String },
    selectedSymptoms: { type: Map, of: Number },
    acceptedDiseases: { type: [String] },
    consultaData: {
        subjectiveText: { type: String },
        objectivoText: { type: String },
        notasText: { type: String },
        selectedSymptoms: { type: [String] },
    },
    vitals: {
        bloodPressure: { type: String },
        heartRate: { type: Number },
        respiratoryRate: { type: String },
        temperature: { type: Number },
        weight: { type: Number },
    },
    comments: {
        dst: { type: String },
        doencas: { type: String },
        alergias: { type: String },
        cirurgias: { type: String },
        internamentos: { type: String },
        medicacao: { type: String },
        antecedentes: { type: String },
    },
    selectedExams: { type: Array },
    results: { type: Array },
    receita: { type: String },
}, { timestamps: true });

module.exports = mongoose.model('Consulta', consultaSchema);

const express = require('express');
const router = express.Router();
const { ObjectId } = require('mongodb');
const WaitingListSchema = require('../models/WaitingList').schema;

// Rota para adicionar um paciente à lista de espera
router.get('/retrieve', async (req, res) => {
  try {
      // Use the correct collection name
      const waitingList = await req.localDb.collection('waitinglists').find().toArray();
      if (!waitingList.length) throw new Error("No records found in waiting list");

      const pacientesIds = waitingList.map(position => new ObjectId(position.pacienteId));
      const medicosIds = waitingList.map(position => new ObjectId(position.medicoId));

      const pacientes = await req.localDb.collection('pacientes').find({ _id: { $in: pacientesIds } }).toArray();
      const medicos = await req.localDb.collection('employees').find({ _id: { $in: medicosIds } }).toArray();

      if (!pacientes.length || !medicos.length) throw new Error("No matching records found in pacientes or medicos");

      const pacientesMap = pacientes.reduce((map, paciente) => {
          map[paciente._id] = paciente.nomeCompleto;
          return map;
      }, {});

      const medicosMap = medicos.reduce((map, medico) => {
          map[medico._id] = { nomeCompleto: medico.nomeCompleto, specialty: medico.specialty };
          return map;
      }, {});

      const enrichedWaitingList = waitingList.map(position => ({
          ...position,
          pacienteNomeCompleto: pacientesMap[position.pacienteId],
          medicoNomeCompleto: medicosMap[position.medicoId]?.nomeCompleto,
          medicoEspecialidade: medicosMap[position.medicoId]?.specialty,
      }));

      res.status(200).json(enrichedWaitingList);
  } catch (error) {
      console.error('Error during waiting list retrieval:', error);
      res.status(500).json({ error: error.message });
  }
});





router.post('/', async (req, res) => {
  try {
    const WaitingList = req.localDb.model('WaitingList', WaitingListSchema);
    const waitingList = new WaitingList(req.body);
    await waitingList.save();
    res.status(201).json(waitingList);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao adicionar paciente à lista de espera', error });
  }
});

module.exports = router;

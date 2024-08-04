const express = require('express');
const router = express.Router();
const WaitingListSchema = require('../models/waitingList').schema;

// Rota para adicionar um paciente à lista de espera
router.get('/retrieve', async (req, res) => {
    try {
        const WaitingList = req.localDb.model('WaitingList', WaitingListSchema);
        const waitingList = await WaitingList.find()
            .populate('pacienteId', 'nomeCompleto') // Populate paciente details
            .populate('medicoId', 'especialidade'); // Populate medico details
        res.status(200).json(waitingList);
    } catch (error) {
        res.status(500).json({ message: 'Erro ao recuperar a lista de espera', error });
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

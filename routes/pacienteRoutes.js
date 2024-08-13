const express = require('express');
const router = express.Router();
const PacienteSchema = require('../models/Paciente').schema; // Import the schema only

router.post('/', async (req, res) => {
  try {
    // Use the localDb connection from req to create the Paciente model
    const Paciente = req.localDb.model('Paciente', PacienteSchema);
    
    const paciente = new Paciente(req.body);
    await paciente.save();
    res.status(201).json(paciente);
  } catch (error) {
    console.error('Erro ao registrar paciente:', error);
    res.status(500).send('Erro ao registrar paciente');
  }
});

router.get('/patients', async (req, res) => {
  try {
    // Use the localDb connection from req to create the Paciente model
    const Paciente = req.localDb.model('Paciente', PacienteSchema);

    const patients = await Paciente.find();
    res.json(patients);
  } catch (error) {
    console.error('Error fetching patients:', error);
    res.status(500).send('Error fetching patients');
  }
});

router.post('/retrieve', async (req, res) => {
  try {
      const { ids } = req.body;
      
      if (!Array.isArray(ids) || ids.some(id => !mongoose.Types.ObjectId.isValid(id))) {
          return res.status(400).json({ message: 'Invalid ID format' });
      }

      const pacientes = await Paciente.find({ _id: { $in: ids } });
      
      if (!pacientes.length) {
          return res.status(404).json({ message: 'No pacientes found' });
      }

      res.json(pacientes);
  } catch (error) {
      console.error('Error retrieving pacientes:', error.message);
      res.status(500).json({ message: 'Error retrieving pacientes', error: error.message });
  }
});


module.exports = router;

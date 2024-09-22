const express = require('express');
const router = express.Router();
const PacienteSchema = require('../models/Paciente').schema; // Import the schema only


router.get('/getPaciente/:pacienteId', async (req, res) => {
  const { pacienteId } = req.params;

  try {
    const Paciente = req.localDb.model('Paciente', PacienteSchema);

    // Query using numeroIdentificacao instead of _id
    const paciente = await Paciente.findOne({ numeroIdentificacao: pacienteId });

    if (!paciente) {
      return res.status(404).send('Patient not found');
    }

    res.json(paciente);
  } catch (error) {
    console.error('Error in /getPaciente route:', error);
    res.status(500).send('Server error');
  }
});

// Rota para verificar se o paciente já existe pelo número de identificação
router.get('/exists/:numeroIdentificacao', async (req, res) => {

  const numeroIdentificacao = req.params.numeroIdentificacao;

  try {

    const Paciente = req.localDb.model('Paciente', PacienteSchema);

    // Busca o paciente pelo número de identificação
    const paciente = await Paciente.findOne({ numeroIdentificacao });

    if (paciente) {
      // Se o paciente for encontrado, retorna os dados dele
      res.status(200).json({ exists: true, paciente });
    } else {
      // Se o paciente não for encontrado, retorna exists como false
      res.status(200).json({ exists: false });
    }
  } catch (error) {
    console.error('Erro ao buscar o paciente:', error);
    res.status(500).json({ error: 'Erro ao buscar o paciente' });
  }
});


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

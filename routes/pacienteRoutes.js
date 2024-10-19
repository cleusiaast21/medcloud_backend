const express = require('express');
const router = express.Router();
const PacienteSchema = require('../models/Paciente').schema; // Import the schema only
const mongoose = require('mongoose');

const dns = require('dns');

// Store database connections globally
let atlasDb, localDb;

// Utility function to check internet connection via DNS lookup
function isConnectedToInternet() {
  return new Promise((resolve) => {
    console.log('Checking internet connection...');
    dns.lookup('google.com', (err) => {
      if (err) {
        console.error('No internet connection:', err);
        resolve(false);
      } else {
        console.log('Internet connection available');
        resolve(true);
      }
    });
  });
}

// In-memory storage for unsynced patients
const unsyncedPatients = [];

// Sync unsynced patients when internet is available
async function syncUnsyncedPatients() {
  if (!(await isConnectedToInternet())) return;

  try {
    const PacienteAtlas = atlasDb.model('Paciente', PacienteSchema);

    while (unsyncedPatients.length > 0) {
      const pacienteData = unsyncedPatients.shift();
      await new PacienteAtlas(pacienteData).save();
      console.log('Paciente synced to Atlas:', pacienteData);
    }
  } catch (error) {
    console.error('Erro ao sincronizar pacientes:', error);
  }
}

// Periodically check for internet connection to sync unsynced patients
setInterval(syncUnsyncedPatients, 60000);

// Route to save a patient
router.post('/', async (req, res) => {
  try {
    const online = await isConnectedToInternet();
    const pacienteData = req.body;

    if (online) {
      console.log('There is internet connection');

      const PacienteAtlas = req.atlasDb.model('Paciente', PacienteSchema);
      const paciente = new PacienteAtlas(pacienteData);

      await paciente.save(); // Save to atlasDb
      await req.localDb.model('Paciente', PacienteSchema).create(pacienteData); // Save to localDb

      return res.status(201).json(paciente);
    } else {
      console.log('There is NO internet connection');

      const Paciente = req.localDb.model('Paciente', PacienteSchema);
      const paciente = new Paciente(pacienteData);

      await paciente.save(); // Save to localDb
      unsyncedPatients.push(pacienteData); // Store patient data for later sync

      return res.status(201).json(paciente);
    }
  } catch (error) {
    console.error('Erro ao registrar paciente:', error);
    res.status(500).send('Erro ao registrar paciente');
  }
});

// Route to initialize database connections
router.use((req, res, next) => {
  atlasDb = req.atlasDb;
  localDb = req.localDb;
  next();
});


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


router.get('/patients', async (req, res) => {
  try {
    const online = await isConnectedToInternet();
    let Paciente;
    let patients;

    if (online) {
      console.log('Internet connection available. Fetching from Atlas...');
      Paciente = req.atlasDb.model('Paciente', PacienteSchema);
    } else {
      console.log('No internet connection. Fetching from localDb...');
      Paciente = req.localDb.model('Paciente', PacienteSchema);
    }

    patients = await Paciente.find();
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

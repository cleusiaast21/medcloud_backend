const express = require('express');
const router = express.Router();
const dns = require('dns');
const ConsultaSchema = require('../models/Consulta').schema; // Import schema only
const WaitingListSchema = require('../models/WaitingList').schema; // Import schema only

// In-memory storage for unsynced consultations
const unsyncedConsultas = [];


// Store database connections globally
let atlasDb, localDb;


// Route to initialize database connections
router.use((req, res, next) => {
  atlasDb = req.atlasDb;
  localDb = req.localDb;
  next();
});


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


// Sync unsynced consultations when internet is available
async function syncUnsyncedConsultas() {
  if (!(await isConnectedToInternet())) return;

  try {
    const ConsultaAtlas = atlasDb.model('Consulta', ConsultaSchema);

    while (unsyncedConsultas.length > 0) {
      const consultaData = unsyncedConsultas.shift();
      await new ConsultaAtlas(consultaData).save();
      console.log('Consulta synced to Atlas:', consultaData);
    }
  } catch (error) {
    console.error('Error syncing consultas:', error);
  }
}


// Periodically check for internet connection to sync unsynced consultations
setInterval(syncUnsyncedConsultas, 600000); // 10-minute interval


// POST: Save a new Consulta
router.post('/', async (req, res) => {
  try {
    const online = await isConnectedToInternet();
    const consultaData = req.body;

    if (online) {
      console.log('Internet connection available');

      const ConsultaAtlas = req.atlasDb.model('Consulta', ConsultaSchema);
      const consulta = new ConsultaAtlas(consultaData);

      await consulta.save(); // Save to Atlas
      await req.localDb.model('Consulta', ConsultaSchema).create(consultaData); // Save locally

      return res.status(201).json(consulta);
    } else {
      console.log('No internet connection');

      const Consulta = req.localDb.model('Consulta', ConsultaSchema);
      const consulta = new Consulta(consultaData);

      await consulta.save(); // Save locally
      unsyncedConsultas.push(consultaData); // Store for later sync

      return res.status(201).json(consulta);
    }
  } catch (error) {
    console.error('Error saving consulta:', error);
    res.status(500).send('Error saving consulta');
  }
});


// GET: Pending consultations
router.get('/pending', async (req, res) => {
  try {
    const Consulta = req.localDb.model('Consulta', ConsultaSchema);
    const pendingConsultations = await Consulta.find({ state: 'pending' });
    res.json(pendingConsultations);
  } catch (error) {
    console.error('Error fetching pending consultations:', error);
    res.status(500).json({ error: 'Failed to fetch consultations' });
  }
});


// GET: Find consulta by pacienteID and medico
router.get('/findConsulta', async (req, res) => {
  try {
    const { pacienteID, medico } = req.query;

    if (!pacienteID || !medico) {
      return res.status(400).json({ message: 'pacienteID and medico are required' });
    }

    const Consulta = req.localDb.model('Consulta', ConsultaSchema);
    const consulta = await Consulta.findOne({ pacienteId: pacienteID, medico, state: 'open' });

    if (consulta) {
      res.status(200).json({ consultaId: consulta._id });
    } else {
      res.status(404).json({ message: 'Consulta not found.' });
    }
  } catch (error) {
    console.error('Error finding consulta:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
});


// GET: Find consulta by pacienteID and medico
router.get('/findConsultaCloud', async (req, res) => {
  try {
    const { pacienteID, medico } = req.query;

    if (!pacienteID || !medico) {
      return res.status(400).json({ message: 'pacienteID and medico are required' });
    }

    const Consulta = req.atlasDb.model('Consulta', ConsultaSchema);
    const consulta = await Consulta.findOne({ pacienteId: pacienteID, medico, state: 'open' });

    if (consulta) {
      res.status(200).json({ consultaId: consulta._id });
    } else {
      res.status(404).json({ message: 'Consulta not found.' });
    }
  } catch (error) {
    console.error('Error finding consulta:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
});



// PUT: Update a Consulta document
router.put('/update', async (req, res) => {
  try {
    const { consultaId, consultaIdCloud, pacienteId } = req.body;
    const { vitals, comments, consultaData, selectedExams, acceptedDiseases } = req.body.data;
    const state = selectedExams.length > 0 ? 'pending' : 'closed';


    const updateData = {
      vitals,
      comments,
      consultaData,
      selectedExams,
      acceptedDiseases,
      state,
    };

    const online = await isConnectedToInternet();

    if (online) {
      console.log('Internet connection available for update.');

      const ConsultaAtlas = req.atlasDb.model('Consulta', ConsultaSchema);
      const ConsultaLocal = req.localDb.model('Consulta', ConsultaSchema);

      // Update in both Atlas and local DB
      const resultAtlas = await ConsultaAtlas.updateOne({ _id: consultaIdCloud }, { $set: updateData });
      const resultLocal = await ConsultaLocal.updateOne({ _id: consultaId }, { $set: updateData });

      if (resultAtlas.modifiedCount > 0 || resultLocal.modifiedCount > 0) {
        await removeFromWaitingList(req.localDb, pacienteId); // Remove from waiting list
        return res.status(200).json({ message: 'Consulta updated in both databases.' });
      } else {
        return res.status(404).json({ message: 'Consulta not found.' });
      }
    } else {
      console.log('No internet connection. Updating locally.');

      const Consulta = req.localDb.model('Consulta', ConsultaSchema);

      // Update only locally and store for later sync
      const resultLocal = await Consulta.updateOne({ _id: consultaId }, { $set: updateData });

      if (resultLocal.modifiedCount > 0) {
        await removeFromWaitingList(req.localDb, pacienteId); // Remove from waiting list
        unsyncedConsultas.push({ _id: consultaId, ...updateData }); // Store for sync
        return res.status(200).json({ message: 'Consulta updated locally and stored for sync.' });
      } else {
        return res.status(404).json({ message: 'Consulta not found.' });
      }
    }
  } catch (error) {
    console.error('Error updating consulta:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
});


// Helper function to remove a patient from the waiting list
async function removeFromWaitingList(localDb, pacienteId) {
  const WaitingList = localDb.model('WaitingList', WaitingListSchema);
  const deleteResult = await WaitingList.deleteOne({ pacienteId });

  if (deleteResult.deletedCount > 0) {
    console.log(`Entry with pacienteId ${pacienteId} removed from waiting list.`);
  } else {
    console.log(`No entry found in waiting list for pacienteId ${pacienteId}.`);
  }
}


router.get('/:pacienteId', async (req, res) => {
  try {
      const { pacienteId } = req.params;
      const Consulta = req.localDb.model('Consulta', ConsultaSchema);

      const consultas = await Consulta.find({ pacienteId, state: 'closed' });

      if (!consultas) {
          console.log("No consultations found for the provided pacienteId");
      }
      res.json(consultas);
  } catch (error) {
      console.error('Error fetching consultations:', error);
      res.status(500).json({ error: 'Error fetching consultations', details: error.message });
  }
});


module.exports = router;

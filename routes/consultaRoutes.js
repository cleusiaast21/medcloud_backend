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

// GET: Triage consultations
router.get('/triage', async (req, res) => {
  try {
    const Consulta = req.localDb.model('Consulta', ConsultaSchema);
    const triageConsultations = await Consulta.find({ state: 'triage' });
    res.json(triageConsultations);
  } catch (error) {
    console.error('Error fetching pending consultations:', error);
    res.status(500).json({ error: 'Failed to fetch consultations' });
  }
});

// GET: Find consulta by pacienteID and medico
router.get('/findConsultaEnfermeiro', async (req, res) => {
  try {
    const { pacienteId, medico } = req.query;

    const Consulta = req.localDb.model('Consulta', ConsultaSchema);
    const consulta = await Consulta.findOne({ pacienteId: pacienteId, medico });

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

router.get('/findConsultaEnfermeiroCloud', async (req, res) => {
  try {
    const { pacienteId, medico } = req.query;

    const Consulta = req.atlasDb.model('Consulta', ConsultaSchema);
    const consulta = await Consulta.findOne({ pacienteId: pacienteId, medico });

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
router.get('/findConsulta', async (req, res) => {
  
  try {
    const { pacienteId, medico } = req.query;

    console.log(pacienteId, medico)

    if (!pacienteId || !medico) {
      return res.status(400).json({ message: 'pacienteID and medico are required' });
    }

    const Consulta = req.localDb.model('Consulta', ConsultaSchema);
    const consulta = await Consulta.findOne({ pacienteId: pacienteId, medico, state: 'open' });

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
    const { pacienteId, medico } = req.query;


    if (!pacienteId || !medico) {
      return res.status(400).json({ message: 'pacienteID and medico are required' });
    }

    console.log("CLOUD: " + pacienteId, medico)

    const Consulta = req.atlasDb.model('Consulta', ConsultaSchema);
    const consulta = await Consulta.findOne({ pacienteId: pacienteId, medico, state: 'open' });

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


// GET: Find all consultas with state = 'pending'
router.get('/findPendingConsultas', async (req, res) => {
  try {
    const Consulta = req.atlasDb.model('Consulta', ConsultaSchema);

    // Query to find all consultas with state 'pending'
    const consultas = await Consulta.find({ state: 'pending' });

    if (consultas.length > 0) {
      res.status(200).json({ consultas });
    } else {
      res.status(404).json({ message: 'No pending consultas found.' });
    }
  } catch (error) {
    console.error('Error finding consultas:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
});



// GET: Find all consultas where results is not empty
router.get('/findExamResults', async (req, res) => {
  try {
    const Consulta = req.localDb.model('Consulta', ConsultaSchema);

    const { medicoNomeCompleto } = req.query;

    // Query to find consultas where state is 'results' and medico matches the provided name
    const consultas = await Consulta.find({
      state: 'results',
      medico: medicoNomeCompleto
    });

    if (consultas.length > 0) {
      res.status(200).json({ consultas });
    } else {
      res.status(404).json({ message: 'No consultas with results found for the specified medico.' });
    }
  } catch (error) {
    console.error('Error finding consultas:', error);
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

// PUT: Adicionar resultados da consulta e atualizar o estado para "open"
router.put('/results', async (req, res) => {
  const { consultaId, consultaIdCloud, results } = req.body;

  if (!consultaId || !consultaIdCloud) {
    return res.status(400).json({ message: "Both consultaId and consultaIdCloud are required." });
  }

  const ConsultaLocal = req.localDb.model('Consulta', ConsultaSchema);
  const ConsultaCloud = req.atlasDb.model('Consulta', ConsultaSchema);

  console.log("Recebendo resultados para as consultas:", { consultaId, consultaIdCloud, results });

  try {
    // Fetch both local and cloud consultas in parallel
    const [consultaLocal, consultaCloud] = await Promise.all([
      ConsultaLocal.findById(consultaId),
      ConsultaCloud.findById(consultaIdCloud)
    ]);

    if (!consultaLocal || !consultaCloud) {
      return res.status(404).json({ message: "Consulta not found in one or both databases." });
    }

    // Ensure results arrays exist
    consultaLocal.results = consultaLocal.results || [];
    consultaCloud.results = consultaCloud.results || [];

    // Append new results
    results.forEach((result) => {
      if (result.examName && result.type && result.value) {
        consultaLocal.results.push(result);
        consultaCloud.results.push(result);
      }
    });

    // Update the state to 'results'
    consultaLocal.set('state', 'results');
    consultaCloud.set('state', 'results');

    // Save both in parallel
    await Promise.all([
      consultaLocal.save(),
      consultaCloud.save()
    ]);

    res.status(200).json({ message: "Results added successfully to both databases!", consultaLocal, consultaCloud });
  } catch (error) {
    console.error("Erro ao atualizar resultados:", error);
    res.status(500).json({ message: "Erro ao atualizar os resultados", error });
  }
});


// PUT: Update Diagnóstico (acceptedDiseases) for a Consultation
router.put('/addDiagnostic/:id', async (req, res) => {
  const { acceptedDiseases } = req.body; // Expecting an array of diagnoses (strings)
  const Consulta = req.localDb.model('Consulta', ConsultaSchema);

  try {
    // Find the consultation by ID
    const consulta = await Consulta.findById(req.params.id);
    if (!consulta) {
      return res.status(404).json({ message: "Consulta not found" });
    }

    // Update the acceptedDiseases field
    consulta.acceptedDiseases = acceptedDiseases;
    // Change the consulta state to "closed"
    consulta.set('state', 'closed');

    // Save the updated consultation document
    await consulta.save();

    res.status(200).json({
      message: "Diagnóstico atualizado com sucesso",
      consulta
    });
  } catch (error) {
    console.error("Error updating Diagnóstico:", error);
    res.status(500).json({
      message: "Erro ao atualizar Diagnóstico",
      error
    });
  }
});

router.get('/imagem/:id', async (req, res) => {
  const Consulta = req.localDb.model('Consulta', ConsultaSchema);
  const consulta = await Consulta.findById(req.params.id);

  if (!consulta) return res.status(404).json({ message: "Consulta not found" });

  res.status(200).json({ image: consulta.imagem });
});


// GET: Get Disease Statistics
router.get('/diseaseStats/:medico', async (req, res) => {
  const Consulta = req.localDb.model('Consulta', ConsultaSchema);

  try {
    const { medico } = req.params;
    console.log("Received Doctor Name (Medico):", medico);

    const stats = await Consulta.aggregate([
      { $match: { medico } }, // Match the 'medico' field
      { $unwind: '$acceptedDiseases' }, // Deconstruct the array into individual documents
      { $group: { _id: '$acceptedDiseases', count: { $sum: 1 } } }, // Group by disease name
      { $project: { disease: '$_id', count: 1, _id: 0 } }, // Rename _id to 'disease'
    ]);

    console.log("Aggregation Result:", stats);

    res.json(stats);
  } catch (error) {
    console.error("Error in /diseaseStats route:", error);
    res.status(500).send("Internal Server Error");
  }
});


// GET: Get Symptom Statistics
router.get('/symptomStats/:medico', async (req, res) => {
  const Consulta = req.localDb.model('Consulta', ConsultaSchema);

  try {
    const { medico } = req.params;

    const stats = await Consulta.aggregate([
      { $match: { medico } }, // Match the 'medico' field
      { $unwind: '$consultaData.selectedSymptoms' }, // Deconstruct the 'selectedSymptoms' array
      {
        $group: {
          _id: '$consultaData.selectedSymptoms', // Group by symptom name
          count: { $sum: 1 } // Count the occurrences of each symptom
        }
      },
      {
        $project: {
          symptom: '$_id', // Rename '_id' to 'symptom'
          count: 1,
          _id: 0
        }
      },
    ]);

    console.log("Aggregation Result:", stats);

    res.json(stats);
  } catch (error) {
    console.error("Error in /symptomStats route:", error);
    res.status(500).send("Internal Server Error");
  }
});


// Rota para buscar consultas de um paciente
router.get('/consultasPaciente/:id', async (req, res) => {
  const Consulta = req.localDb.model('Consulta', ConsultaSchema);

  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ error: 'O ID do paciente é obrigatório.' });

    }
    // Fetch consultas where pacienteId matches the provided ID    
    const consultas = await Consulta.find({ pacienteId: id });

    if (!consultas.length) {
      return res.status(404).json({ message: 'Nenhuma consulta encontrada para o paciente informado.' });
    }
    res.status(200).json(consultas);
  } catch (error) {
    console.error('Erro ao buscar consultas:', error);

    res.status(500).json({ error: 'Erro ao buscar consultas. Tente novamente mais tarde.' });
  }
});


// PUT: Update a Consulta document in both local and Atlas databases
router.put('/updateEnfermeiro', async (req, res) => {
  try {
    const { consultaId, consultaIdCloud, pacienteId } = req.body;
    const { vitals, comments } = req.body.data;

    const updateData = {
      vitals,
      comments,
      state: "open",
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



// GET: Find Consulta Vitals and Comments
router.get('/retrieveInformacoes/:pacienteId', async (req, res) => {

  try {
    const { pacienteId } = req.params;
    
    const Consulta = req.localDb.model('Consulta', ConsultaSchema);

    const consulta = await Consulta.findOne({ pacienteId, state: "open" });

    if (!consulta) {
      return res.status(404).json({ message: 'Consulta not found.' });
    }

    res.status(200).json(consulta);
  } catch (error) {
    res.status(500).json({ message: 'Internal server error.' });
  }
});

module.exports = router;

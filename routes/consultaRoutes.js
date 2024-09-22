const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const ConsultaSchema = require('../models/Consulta').schema; // Import the schema only
const WaitingListSchema = require('../models/WaitingList').schema; // Import the schema only

router.post('/', async (req, res) => {
  try {
    // Use the localDb connection from req to create the Consulta model
    const Consulta = req.localDb.model('Consulta', ConsultaSchema);

    const consulta = new Consulta(req.body);
    await consulta.save();
    res.status(201).json(consulta);
  } catch (error) {
    console.error('Erro ao registrar consulta:', error);
    res.status(500).send('Erro ao registrar consulta');
  }
});

// GET: Find consulta by pacienteID and medico
// In your consultas route file (e.g., consultas.js)
router.get('/findConsulta', async (req, res) => {
  try {
      const { pacienteID, medico } = req.query;

      // Check if both query params are passed
      if (!pacienteID || !medico) {
          return res.status(400).json({ message: 'pacienteID and medico are required' });
      }

      // Use the localDb connection to access the Consulta model
      const Consulta = req.localDb.model('Consulta', ConsultaSchema);

      // Find the consultation based on pacienteID and medico
      const consulta = await Consulta.findOne({ pacienteId: pacienteID, medico: medico });

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


// PUT: Update an existing Consulta document
router.put('/update', async (req, res) => {
  try {
    const { consultaId } = req.body;  // Get consultaId from the request body
    const { vitals, comments, consultaData, selectedExams, acceptedDiseases } = req.body.data; // Get data object

    // Determine the state based on whether `selectedExams` is present
    let state = (selectedExams && selectedExams.length > 0) ? 'pending' : 'closed';

    console.log('Consulta ID:', consultaId);
    console.log('Data:', req.body.data);

    // Use the localDb connection to get the Consulta model
    const Consulta = req.localDb.model('Consulta', ConsultaSchema);

    // Update the found consulta document
    const result = await Consulta.updateOne(
      { _id: consultaId }, // Find the document by ID
      {
        $set: {
          vitals,
          comments,
          consultaData,
          selectedExams,
          acceptedDiseases,
          state: state  // Update the state based on selectedExams
        },
      }
    );

    // Respond to the client
    if (result.modifiedCount > 0) {
      res.status(200).json({ message: 'Consulta document updated successfully.' });
    } else {
      res.status(404).json({ message: 'Consulta document not found.' });
    }
  } catch (error) {
    console.error('Error updating consulta document:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
});



module.exports = router;

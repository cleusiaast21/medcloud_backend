const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const Employee = require('../models/Employee');

// Rota de registro
router.post('/register', async (req, res) => {
  const { funcionarioId, password } = req.body;
  try {
    const employeeCollection = req.localDb.model('Employee', Employee.schema); // Use localDb connection

    // Verifique se o funcionário já existe
    let employee = await employeeCollection.findOne({ funcionarioId });
    if (employee) {
      return res.status(400).json({ message: 'Employee already exists' });
    }

    // Crie um novo funcionário
    employee = new employeeCollection({
      funcionarioId,
      password
    });

    // Hash da senha
    const salt = await bcrypt.genSalt(10);
    employee.password = await bcrypt.hash(password, salt);

    await employee.save();

    // Retornar um token
    const payload = {
      employee: {
        funcionarioId: employee.funcionarioId
      }
    };

    jwt.sign(payload, 'secret', { expiresIn: 3600 }, (err, token) => {
      if (err) throw err;
      res.status(200).json({ token });
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Rota de login
router.post('/login', async (req, res) => {
  const { funcionarioId, password } = req.body;

  if (!funcionarioId || !password) {
    return res.status(400).json({ message: 'Please provide funcionarioId and password' });
  }

  try {
    const employeeCollection = req.localDb.model('Employee', Employee.schema);
    let employee = await employeeCollection.findOne({ funcionarioId });

    if (!employee) {
      return res.status(400).json({ message: 'Employee not found' });
    }

    const isMatch = await bcrypt.compare(password, employee.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const payload = {
      employee: {
        funcionarioId: employee.funcionarioId,
        employeeType: employee.employeeType, // Ensure this is included
        nomeCompleto: employee.nomeCompleto // Include nomeCompleto
      }
    };

    jwt.sign(payload, 'secret', { expiresIn: 3600 }, (err, token) => {
      if (err) throw err;
      res.status(200).json({ token, employee: payload.employee }); // Include employee data in response
    });
  } catch (err) {
    console.error('Server error:', err.message);
    res.status(500).send('Server error');
  }
});






module.exports = router;

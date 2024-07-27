const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Rota de registro
router.post('/register', async (req, res) => {
  const { id, password } = req.body;
  try {
    const userCollection = req.localDb.model('User', User.schema); // Use localDb connection

    // Verifique se o usuário já existe
    let user = await userCollection.findOne({ id });
    if (user) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Crie um novo usuário
    user = new userCollection({
      id,
      password
    });

    // Hash da senha
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);

    await user.save();

    // Retornar um token
    const payload = {
      user: {
        id: user.id
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
  const { id, password } = req.body;

  try {
    const userCollection = req.localDb.model('User', User.schema); // Use localDb connection

    // Verifique se o usuário existe
    let user = await userCollection.findOne({ id });
    if (!user) {
      return res.status(400).json({ message: 'User not found' });
    }

    // Verifique a senha
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Retornar um token
    const payload = {
      user: {
        id: user.id
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

module.exports = router;

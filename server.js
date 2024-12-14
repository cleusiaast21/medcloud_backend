const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const authRoutes = require('./routes/auth');
const pacienteRoutes = require('./routes/pacienteRoutes');
const consultaRoutes = require('./routes/consultaRoutes');
const employeeRoutes = require('./routes/employeeRoutes');
const waitingListRoutes = require('./routes/waitingListRoutes');
const bodyParser = require('body-parser');

const app = express();
const PORT = process.env.PORT || 5000;

// Configure body-parser to handle larger payloads
app.use(bodyParser.json({ limit: '50mb' })); // Increase limit to 50MB or as required
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));


// MongoDB local connection
const localUri = 'mongodb://localhost:27017/Medcloud';
const localConnection = mongoose.createConnection(localUri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 30000, // Increase timeout to 30 seconds
  socketTimeoutMS: 45000 // Close sockets after 45 seconds of inactivity
});

localConnection.on('connected', () => console.log('MongoDB local connected'));
localConnection.on('error', (err) => console.log('Failed to connect to local MongoDB:', err));

// MongoDB Atlas connection
const atlasUri = 'mongodb+srv://20190303:Carmelina_12*@cluster0.s0ghlms.mongodb.net/Medcloud';
const atlasConnection = mongoose.createConnection(atlasUri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 30000, // Increase timeout to 30 seconds
  socketTimeoutMS: 45000 // Close sockets after 45 seconds of inactivity
});

atlasConnection.on('connected', () => console.log('MongoDB Atlas connected'));
atlasConnection.on('error', (err) => console.log('Failed to connect to MongoDB Atlas:', err));

app.use(cors());
app.use(express.json());

// Middleware to pass the local connection
app.use((req, res, next) => {
  req.localDb = localConnection;
  req.atlasDb = atlasConnection;
  next();
});

// Routes
app.use('/api/auth', (req, res, next) => authRoutes(req, res, next));
app.use('/api/pacientes', (req, res, next) => pacienteRoutes(req, res, next));
app.use('/api/consultas', (req, res, next) => consultaRoutes(req, res, next));
app.use('/api/employees', (req, res, next) => employeeRoutes(req, res, next));
app.use('/api/waitingList', (req, res, next) => waitingListRoutes(req, res, next));

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

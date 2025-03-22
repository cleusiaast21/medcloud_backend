const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const EmployeeSchema = require('../models/Employee').schema; // Import the schema only

// Route to register a new employee
router.post('/', async (req, res) => {
  try {
    const { password, ...employeeData } = req.body;

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Add hashed password to employeeData
    employeeData.password = hashedPassword;

    // Use the localDb connection from req to create the Employee model
    const Employee = req.localDb.model('Employee', EmployeeSchema);

    const employee = new Employee(employeeData);

    await employee.save();
    res.status(201).json(employee);
  } catch (error) {
    console.error('Error registering employee:', error);
    res.status(500).send('Error registering employee');
  }
});

// Route to get all doctors
router.get('/doctors', async (req, res) => {
  try {
    // Use the localDb connection from req to create the Employee model
    const Employee = req.localDb.model('Employee', EmployeeSchema);

    const doctors = await Employee.find({ employeeType: 'Medico' });
    res.json(doctors);
  } catch (error) {
    console.error('Error fetching doctors:', error);
    res.status(500).send('Error fetching doctors');
  }
});

// Route to get all employees
router.get('/allEmployees', async (req, res) => {
  try {
    // Use the localDb connection from req to create the Employee model
    const Employee = req.localDb.model('Employee', EmployeeSchema);

    const employees = await Employee.find(); // Fetch all employees
    res.json(employees);
  } catch (error) {
    console.error('Error fetching employees:', error);
    res.status(500).send('Error fetching employees');
  }
});

module.exports = router;

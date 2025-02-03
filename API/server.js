require('dotenv').config();
const express = require('express');
const { Sequelize, DataTypes } = require('sequelize');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const mysql = require('mysql2');
const { authenticate, authorizeAdmin } = require('./middleware/auth');  // Import the authentication middleware

// Initialize Express app
const app = express();
app.use(express.json());

// Check environment variables and log them for debugging
console.log('Connecting to MySQL with the following config:');
console.log('User:', process.env.DB_USER);
console.log('Host:', process.env.DB_HOST);
console.log('Database:', process.env.DB_NAME);
console.log('Port:', process.env.DB_PORT);

// MySQL connection to create the database if it doesn't exist
const connection = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS
});

connection.connect((err) => {
  if (err) {
    console.error('Error connecting to MySQL: ', err);
    return;
  }

  // Create database if not exists
  connection.query(`CREATE DATABASE IF NOT EXISTS ${process.env.DB_NAME}`, (err) => {
    if (err) {
      console.error('Error creating database: ', err);
      return;
    }

    console.log(`Database created or already exists: ${process.env.DB_NAME}`);
    connection.end();
  });
});

// Sequelize connection setup
const sequelize = new Sequelize(`mysql://${process.env.DB_USER}:${process.env.DB_PASS}@${process.env.DB_HOST}:${process.env.DB_PORT || 3306}/${process.env.DB_NAME}`, {
  dialect: 'mysql',
  dialectOptions: {
    connectTimeout: 30000
  }
});


// Define models
const User = sequelize.define('User', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING, allowNull: false },
  email: { type: DataTypes.STRING, allowNull: false, unique: true },
  password: { type: DataTypes.STRING, allowNull: false },
  domain: { type: DataTypes.STRING, allowNull: false, unique: true },
  role: { type: DataTypes.STRING, allowNull: false, defaultValue: 'user' }  // New field
});

const Package = sequelize.define('Package', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING, allowNull: false },
  price: { type: DataTypes.FLOAT, allowNull: false },
  description: { type: DataTypes.STRING, allowNull: true }
});

const Subscription = sequelize.define('Subscription', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  userId: { type: DataTypes.INTEGER, allowNull: false, references: { model: User, key: 'id' } },
  packageId: { type: DataTypes.INTEGER, allowNull: false, references: { model: Package, key: 'id' } },
  date: { type: DataTypes.DATE, defaultValue: Sequelize.NOW }
});

// Synchronize database
sequelize.sync({ force: false });  // Avoid dropping tables on each restart

// User registration route
app.post('/register', async (req, res) => {
  try {
    const { name, email, password, domain } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, password: hashedPassword, domain });
    res.status(201).json(user);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Login route
app.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ where: { email } });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: 'Invalid credentials!' });
    }
    const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.json({ token });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all packages
app.get('/packages', async (req, res) => {
  const packages = await Package.findAll();
  res.json(packages);
});

// Subscribe to a package
app.post('/subscribe', authenticate, async (req, res) => {
  try {
    const { packageId } = req.body;
    const user = await User.findByPk(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found!' });

    const existingSubscription = await Subscription.findOne({ where: { userId: user.id } });
    if (existingSubscription) return res.status(400).json({ error: 'You already have an active subscription!' });

    // Save new subscription
    const subscription = await Subscription.create({ userId: user.id, packageId });

    // Generate a unique database name and user for MySQL
    const dbName = `13a_${user.domain.replace(/\./g, '_')}`;
    const dbUser = `13a_${user.domain.replace(/\./g, '_')}`;

    // Create a new MySQL connection to manage database creation and user privileges
    const connection = mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASS
    });

    connection.connect((err) => {
      if (err) {
        console.error('Error connecting to MySQL: ', err);
        return res.status(500).json({ error: 'Error connecting to MySQL.' });
      }

      // Create the database and user, then grant privileges
      connection.query(`CREATE DATABASE IF NOT EXISTS ${dbName}`, (err) => {
        if (err) {
          console.error('Error creating database: ', err);
          connection.end();
          return res.status(500).json({ error: 'Error creating database.' });
        }

        connection.query(`CREATE USER IF NOT EXISTS '${dbUser}'@'localhost' IDENTIFIED BY '${user.password}'`, (err) => {
          if (err) {
            console.error('Error creating user: ', err);
            connection.end();
            return res.status(500).json({ error: 'Error creating user.' });
          }

          connection.query(`GRANT ALL PRIVILEGES ON ${dbName}.* TO '${dbUser}'@'localhost'`, (err) => {
            if (err) {
              console.error('Error setting privileges: ', err);
              connection.end();
              return res.status(500).json({ error: 'Error setting privileges.' });
            }

            connection.query('FLUSH PRIVILEGES', (err) => {
              connection.end();
              if (err) {
                console.error('Error flushing privileges: ', err);
                return res.status(500).json({ error: 'Error flushing privileges.' });
              }

              // Send email with database credentials
              const transporter = nodemailer.createTransport({
                service: 'gmail',
                auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
              });

              const generatedPassword = Math.random().toString(36).slice(-8);
              transporter.sendMail({
                from: process.env.EMAIL_USER,
                to: user.email,
                subject: 'Subscription Details',
                text: `Login details:\nDomain: ${user.domain}\nDatabase Name: ${dbName}\nUser: ${dbUser}\nPassword: ${generatedPassword}`
              });

              res.json(subscription);
            });
          });
        });
      });
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get the current user's subscription
app.get('/my-subscription', authenticate, async (req, res) => {
  const subscription = await Subscription.findOne({
    where: { userId: req.user.id },
    include: [Package]
  });
  if (!subscription) return res.json({ message: 'No active subscription.' });
  res.json(subscription);
});

// Start the server
const PORT = process.env.SERVER_PORT ;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

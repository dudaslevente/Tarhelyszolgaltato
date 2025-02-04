//server.js
require('dotenv').config();
const express = require('express');
const { Sequelize, DataTypes } = require('sequelize');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const mysql = require('mysql2');
const { authenticate, authorizeAdmin } = require('./middleware/auth');
const cors = require('cors');

const PORT = process.env.SERVER_PORT || 3000;

// Initialize Express app
const app = express();
app.use(express.json());
app.use(cors());

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
  } else {
    // Create database if not exists
    connection.query(`CREATE DATABASE IF NOT EXISTS ${process.env.DB_NAME}`, (err) => {
      if (err) {
        console.error('Error creating database: ', err);
      } else {
        console.log(`Database created or already exists: ${process.env.DB_NAME}`);
      }
      connection.end();
    });
  }
});

// Sequelize connection setup
const sequelize = new Sequelize(`mysql://${process.env.DB_USER}:${process.env.DB_PASS}@${process.env.DB_HOST}:${process.env.DB_PORT || 3306}/${process.env.DB_NAME}`, {
  dialect: 'mysql',
  dialectOptions: {
    connectTimeout: 3000
  }
});

// Define models
const User = sequelize.define('User', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING, allowNull: false },
  email: { type: DataTypes.STRING, allowNull: false, unique: true },
  password: { type: DataTypes.STRING, allowNull: false },
  domain: { type: DataTypes.STRING, allowNull: false, unique: true },
  role: { type: DataTypes.STRING, allowNull: false, defaultValue: 'user' }
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

sequelize.sync({ force: false }).catch((error) => {
  console.error('Error syncing database:', error);
});

// Register route
app.post('/register', async (req, res) => {
  try {
    const { name, email, password, domain } = req.body;
    
    // Check if email already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists with this email.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Generate the database name based on the domain
    const dbName = `13af_${domain.replace(/\./g, '_')}`;

    // First, create the user in the Sequelize database
    const user = await User.create({ name, email, password: hashedPassword, domain });

    // Create the database and user for MySQL
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

      // Create the database
      connection.query(`CREATE DATABASE IF NOT EXISTS ${dbName}`, (err) => {
        if (err) {
          console.error('Error creating database: ', err);
          connection.end();
          return res.status(500).json({ error: 'Error creating database.' });
        }

        // Create user for the new database
        const dbUser = `13af_${domain.replace(/\./g, '_')}`;
        const generatedPassword = Math.random().toString(36).slice(-8);

        connection.query(`CREATE USER IF NOT EXISTS '${dbUser}'@'localhost' IDENTIFIED BY '${generatedPassword}'`, (err) => {
          if (err) {
            console.error('Error creating user: ', err);
            connection.end();
            return res.status(500).json({ error: 'Error creating user.' });
          }

          // Grant privileges to the new user on the created database
          connection.query(`GRANT ALL PRIVILEGES ON ${dbName}.* TO '${dbUser}'@'localhost'`, (err) => {
            if (err) {
              console.error('Error granting privileges: ', err);
              connection.end();
              return res.status(500).json({ error: 'Error granting privileges.' });
            }

            // Flush privileges
            connection.query('FLUSH PRIVILEGES', (err) => {
              connection.end();
              if (err) {
                console.error('Error flushing privileges: ', err);
                return res.status(500).json({ error: 'Error flushing privileges.' });
              }

              // Send email with database credentials (handle error without stopping server)
              const transporter = nodemailer.createTransport({
                service: 'gmail',
                auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
              });

              transporter.sendMail({
                from: process.env.EMAIL_USER,
                to: user.email,
                subject: 'Your Subscription and Database Information',
                text: `Your domain: ${domain}\nDatabase Name: ${dbName}\nDatabase User: ${dbUser}\nDatabase Password: ${generatedPassword}`
              }, (error, info) => {
                if (error) {
                  console.error('Error sending email: ', error);
                } else {
                  console.log('Email sent: ' + info.response);
                }
              });

              // Respond with the user data (created user and database information)
              res.status(201).json({
                user,
                message: `User registered and database ${dbName} created successfully.`
              });
            });
          });
        });
      });
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'An error occurred during registration.' });
  }
});


// Login route
app.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ where: { email } });
    if (!user) {
      console.error(`Login failed for user ${email}: User not found.`);
      return res.status(401).json({ error: 'Invalid credentials!' });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      console.error(`Login failed for user ${email}: Incorrect password.`);
      return res.status(401).json({ error: 'Invalid credentials!' });
    }

    // Generate JWT token
    const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '1h' });
    console.log(`User ${email} logged in successfully.`);
    res.json({ token });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: error.message });
  }
});



// Get all packages
app.get('/public/packages', async (req, res) => {
  const packages = await Package.findAll();
  res.json(packages);
});

// Subscribe to a package
app.post('/subscribe', authenticate, async (req, res) => {
  try {
    const { packageId } = req.body;
    const user = await User.findByPk(req.user.id);
    if (!user) {
      console.error('Subscription failed: User not found.');
      return res.status(404).json({ error: 'User not found!' });
    }

    const existingSubscription = await Subscription.findOne({ where: { userId: user.id } });
    if (existingSubscription) {
      console.error(`Subscription failed for user ${user.email}: Already subscribed.`);
      return res.status(400).json({ error: 'You already have an active subscription!' });
    }

    // Save new subscription
    const subscription = await Subscription.create({ userId: user.id, packageId });
    console.log(`User ${user.email} subscribed to package ${packageId}.`);
    res.json(subscription);
  } catch (error) {
    console.error('Subscription error:', error);
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

app.post('/admin/route', authenticate, authorizeAdmin, async (req, res) => {
  try {
    // Example: Admin wants to view all users in the system
    const users = await User.findAll();  // Assuming you have a User model defined
    res.status(200).json({ message: 'Admin access granted', users });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'An error occurred while fetching users.' });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

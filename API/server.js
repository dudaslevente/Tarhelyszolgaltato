require('dotenv').config();
const express = require('express');
const { Sequelize, DataTypes } = require('sequelize');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const mysql = require('mysql2');
const cors = require('cors');

const { authenticate, authorizeAdmin } = require('./middleware/auth');
const PORT = process.env.SERVER_PORT || 3000;

const app = express();
app.use(express.json());
app.use(cors());

const sequelize = new Sequelize(`mysql://${process.env.DB_USER}:${process.env.DB_PASS}@${process.env.DB_HOST}:${process.env.DB_PORT || 3306}/${process.env.DB_NAME}`, {
  dialect: 'mysql',
  dialectOptions: { connectTimeout: 3000 }
});

const User = sequelize.define('User', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING, allowNull: false },
  email: { type: DataTypes.STRING, allowNull: false, unique: true },
  password: { type: DataTypes.STRING, allowNull: false },
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
  domain: { type: DataTypes.STRING, allowNull: false, unique: true },
  date: { type: DataTypes.DATE, defaultValue: Sequelize.NOW }
});

sequelize.sync({ force: false }).catch(error => console.error('Error syncing database:', error));

app.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) return res.status(400).json({ error: 'User already exists.' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, password: hashedPassword });
    res.status(201).json({ user, message: 'Registration successful. Please log in to register your domain.' });
  } catch (error) {
    res.status(500).json({ error: 'Registration error.' });
  }
});

app.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ where: { email } });
    if (!user) return res.status(401).json({ error: 'Invalid credentials!' });

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) return res.status(401).json({ error: 'Invalid credentials!' });

    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.json({ token });
  } catch (error) {
    res.status(500).json({ error: 'Login error.' });
  }
});

app.post('/register-domain', authenticate, async (req, res) => {
  try {
    const { domain, packageId } = req.body;
    const userId = req.user.id;
    const existingSubscription = await Subscription.findOne({ where: { userId } });
    if (existingSubscription) return res.status(400).json({ error: 'User already has an active subscription.' });

    const selectedPackage = await Package.findByPk(packageId);
    if (!selectedPackage) return res.status(400).json({ error: 'Invalid package selection.' });

    const dbName = `db_${domain.replace(/\./g, '_')}`;
    
    const connection = mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASS
    });

    connection.connect(err => {
      if (err) return res.status(500).json({ error: 'Database connection error.' });

      connection.query(`CREATE DATABASE IF NOT EXISTS ${dbName}`, err => {
        if (err) return res.status(500).json({ error: 'Error creating database.' });

        connection.query(`GRANT ALL PRIVILEGES ON ${dbName}.* TO '${process.env.DB_USER}'@'localhost'`, err => {
          connection.end();
          if (err) return res.status(500).json({ error: 'Error granting privileges.' });

          Subscription.create({ userId, packageId, domain });

          const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
          });

          const mailOptions = {
            from: process.env.EMAIL_USER,
            to: req.user.email,
            subject: 'Your Subscription Details',
            text: `Your domain: ${domain}\nDatabase Name: ${dbName}\nPackage: ${selectedPackage.name}`
          };

          transporter.sendMail(mailOptions, (error, info) => {
            if (error) console.error('Error sending email:', error);
          });

          res.status(201).json({ message: `Domain ${domain} registered successfully.` });
        });
      });
    });
  } catch (error) {
    res.status(500).json({ error: 'Domain registration error.' });
  }
});

// Get all packages
app.get('/public/packages', async (req, res) => {
  const packages = await Package.findAll();
  res.json(packages);
});

app.post('/subscriptions', async (req, res) => {
  try {
    const { packageId, userId, domain } = req.body;
    const user = await User.findByPk(userId);
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
    const subscription = await Subscription.create({ userId: user.id, packageId, domain });
    console.log(`User ${user.email} subscribed to package ${packageId}.`);
    res.json(subscription);
  } catch (error) {
    console.error('Subscription error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

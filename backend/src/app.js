const express = require('express');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/authRoutes');
const authMiddleware = require('./middlewares/authMiddleware');
const conversationRoutes = require('./routes/conversationRoutes');
const messageRoutes = require('./routes/messageRoutes');
const fileRoutes = require('./routes/fileRoutes');
const callRoutes = require('./routes/callRoutes');
const userRoutes = require('./routes/userRoutes');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Route de test
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'API WhatsApp fonctionnelle' });
});

app.use('/api/auth', authRoutes);

app.get('/api/protected', authMiddleware, (req, res) => {
  res.json({ message: 'Accès autorisé', user: req.user });
});

app.use('/api/conversations', conversationRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/files', fileRoutes);
app.use('/api/calls', callRoutes);
app.use('/api/users', userRoutes);

module.exports = app;

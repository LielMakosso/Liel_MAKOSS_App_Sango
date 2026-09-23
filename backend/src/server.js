const https = require('https');
const fs = require('fs');
const path = require('path');
const { Server } = require('socket.io');
const app = require('./app');
const pool = require('./config/db');
require('./config/minio');
require('dotenv').config();

const PORT = process.env.PORT || 3000;

const sslOptions = {
  key: fs.readFileSync(path.join(__dirname, '../certs/server.key')),
  cert: fs.readFileSync(path.join(__dirname, '../certs/server.cert')),
};

const server = https.createServer(sslOptions, app);

const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

require('./sockets/chatSocket')(io);

server.listen(PORT, '0.0.0.0', () => {
  console.log(` Serveur HTTPS lancé sur le port ${PORT}`);
});

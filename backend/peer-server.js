const { PeerServer } = require('peer');

const peerServer = PeerServer({
  port: 9002,
  path: '/peerjs',
});

peerServer.on('connection', (client) => {
  console.log(` Peer connecté: ${client.getId()}`);
});

peerServer.on('disconnect', (client) => {
  console.log(`Peer déconnecté: ${client.getId()}`);
});

console.log('Serveur PeerJS lancé sur le port 9002');

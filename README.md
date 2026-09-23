\# Sango - Application de Messagerie et d'Appels



Application mobile de messagerie instantanée et d'appels audio/vidéo, inspirée de WhatsApp.



\# Structure du projet



\- \*\*`mobile/`\*\* - Application React Native (Android/iOS)

\- \*\*`backend/`\*\* - API Node.js + Socket.io + PostgreSQL + MinIO + PeerJS



\#Technologies



\### Mobile

\- React Native 0.82

\- React Navigation

\- Socket.io Client

\- react-native-webrtc

\- react-native-vector-icons



\### Backend

\- Node.js + Express

\- Socket.io

\- PostgreSQL

\- MinIO (stockage S3)

\- PeerJS (WebRTC)

\- JWT (authentification)



\## Installation



\### Backend



```bash

cd backend

cp .env.example .env       # Puis éditez .env avec vos valeurs

npm install

pm2 start src/server.js --name whatsapp-api



\# Mobile

cd mobile

npm install

npx react-native run-android





\# Configuration importante :

\# Modifiez l'adresse IP du serveur dans :

mobile/src/services/socketService.js





\# Auteur

Liel Makosso



GitHub : @LielMakosso



\# Liens

Repository : https://github.com/LielMakosso/Liel\_MAKOSS\_App\_Sango


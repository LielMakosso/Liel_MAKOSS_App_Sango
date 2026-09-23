const Minio = require('minio');
require('dotenv').config();

const minioClient = new Minio.Client({
  endPoint: process.env.MINIO_ENDPOINT,
  port: parseInt(process.env.MINIO_PORT),
  useSSL: process.env.MINIO_USE_SSL === 'true',
  accessKey: process.env.MINIO_ACCESS_KEY,
  secretKey: process.env.MINIO_SECRET_KEY,
});

// Vérification que le bucket existe
const bucketName = process.env.MINIO_BUCKET;

minioClient.bucketExists(bucketName, (err, exists) => {
  if (err) return console.error('Erreur MinIO:', err);
  if (!exists) {
    minioClient.makeBucket(bucketName, '', (err) => {
      if (err) return console.error('Erreur création bucket:', err);
      console.log(` Bucket "${bucketName}" créé`);
    });
  } else {
    console.log(` Bucket "${bucketName}" déjà existant`);
  }
});

module.exports = minioClient;

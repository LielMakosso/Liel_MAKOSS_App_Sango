const minioClient = require('./src/config/minio');
require('dotenv').config();

const bucketName = process.env.MINIO_BUCKET;

const policy = {
  Version: '2012-10-17',
  Statement: [
    {
      Effect: 'Allow',
      Principal: { AWS: ['*'] },
      Action: ['s3:GetObject'],
      Resource: [`arn:aws:s3:::${bucketName}/*`],
    },
  ],
};

minioClient.setBucketPolicy(bucketName, JSON.stringify(policy), (err) => {
  if (err) {
    console.error(' Erreur lors de l\'application de la policy:', err);
  } else {
    console.log(`Policy publique en lecture appliquée au bucket "${bucketName}"`);
  }
});

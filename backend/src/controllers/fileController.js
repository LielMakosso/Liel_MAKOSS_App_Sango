const { v4: uuidv4 } = require('uuid');
const minioClient = require('../config/minio');
const FileModel = require('../models/fileModel');
require('dotenv').config();

const BUCKET = process.env.MINIO_BUCKET;

const FileController = {
 
  async upload(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'Aucun fichier reçu' });
      }

      const userId = req.user.id;
      const ext = req.file.originalname.split('.').pop();
      const objectName = `${uuidv4()}.${ext}`;

      await minioClient.putObject(
        BUCKET,
        objectName,
        req.file.buffer,
        req.file.size,
        { 'Content-Type': req.file.mimetype }
      );

      const fileUrl = `http://${process.env.MINIO_ENDPOINT}:${process.env.MINIO_PORT}/${BUCKET}/${objectName}`;

      const file = await FileModel.create({
        uploaderId: userId,
        fileName: req.file.originalname,
        fileUrl,
        fileType: req.file.mimetype,
        fileSize: req.file.size,
      });

      res.status(201).json({ file });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Erreur lors de l\'upload du fichier' });
    }
  },

  async getOne(req, res) {
    try {
      const file = await FileModel.findById(req.params.id);
      if (!file) {
        return res.status(404).json({ error: 'Fichier introuvable' });
      }
      res.json({ file });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Erreur lors de la récupération du fichier' });
    }
  },
};

module.exports = FileController;

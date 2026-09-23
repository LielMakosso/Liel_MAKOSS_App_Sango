const pool = require('../config/db');

const FileModel = {
  async create({ uploaderId, fileName, fileUrl, fileType, fileSize }) {
    const result = await pool.query(
      `INSERT INTO files (uploader_id, file_name, file_url, file_type, file_size)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [uploaderId, fileName, fileUrl, fileType, fileSize]
    );
    return result.rows[0];
  },

  async findById(fileId) {
    const result = await pool.query(
      `SELECT * FROM files WHERE id = $1`,
      [fileId]
    );
    return result.rows[0];
  },
};

module.exports = FileModel;

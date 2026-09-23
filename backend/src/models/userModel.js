const pool = require('../config/db');

const UserModel = {
  // Création utilisateur
  async create({ username, email, passwordHash }) {
    const result = await pool.query(
      `INSERT INTO users (username, email, password_hash)
       VALUES ($1, $2, $3)
       RETURNING id, username, email, avatar_url, status, created_at`,
      [username, email, passwordHash]
    );
    return result.rows[0];
  },
  // Trouver un utilisateur par email
  async findByEmail(email) {
    const result = await pool.query(
      `SELECT * FROM users WHERE email = $1`,
      [email]
    );
    return result.rows[0];
  },

  // Trouver un utilisateur par id
  async findById(id) {
    const result = await pool.query(
      `SELECT id, username, email, avatar_url, status, created_at
       FROM users WHERE id = $1`,
      [id]
    );
    return result.rows[0];
  },

  // Mettre à jour le statut (en ligne/hors ligne)
  async updateStatus(id, status) {
    await pool.query(
      `UPDATE users SET status = $1 WHERE id = $2`,
      [status, id]
    );
  },
  // Lister tous les utilisateure
  async findAllExcept(userId) {
    const result = await pool.query(
      `SELECT id, username, email, avatar_url, status
       FROM users
       WHERE id != $1
       ORDER BY username ASC`,
      [userId]
    );
    return result.rows;
  },

};

module.exports = UserModel;

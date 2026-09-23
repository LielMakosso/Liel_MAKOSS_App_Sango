const pool = require('../config/db');

const MessageModel = {
  // Créer un message
  async create({ conversationId, senderId, content, fileId = null }) {
    const result = await pool.query(
      `INSERT INTO messages (conversation_id, sender_id, content, file_id)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [conversationId, senderId, content, fileId]
    );
    return result.rows[0];
  },

  // Récupération des messages d'une conversation (avec infos de l'expéditeur)
  async findByConversation(conversationId, limit = 50, offset = 0) {
    const result = await pool.query(
      `SELECT m.*, u.username AS sender_username, u.avatar_url AS sender_avatar,
              f.file_name, f.file_url, f.file_type
       FROM messages m
       JOIN users u ON u.id = m.sender_id
       LEFT JOIN files f ON f.id = m.file_id
       WHERE m.conversation_id = $1
       ORDER BY m.created_at DESC
       LIMIT $2 OFFSET $3`,
      [conversationId, limit, offset]
    );
    return result.rows.reverse();
  },

  // Mettre à jour le statut d'un message
  async updateStatus(messageId, status) {
    const result = await pool.query(
      `UPDATE messages SET status = $1 WHERE id = $2 RETURNING *`,
      [status, messageId]
    );
    return result.rows[0];
  },

  // Récupérer un message par son id
  async findById(messageId) {
    const result = await pool.query(
      `SELECT * FROM messages WHERE id = $1`,
      [messageId]
    );
    return result.rows[0];
  },
};

module.exports = MessageModel;

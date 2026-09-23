const pool = require('../config/db');

const ConversationModel = {
  //conversation (privée/groupe)
  async create({ type, name, createdBy }) {
    const result = await pool.query(
      `INSERT INTO conversations (type, name, created_by)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [type, name || null, createdBy]
    );
    return result.rows[0];
  },

  // Ajout membre à une conversation
  async addMember(conversationId, userId, role = 'member') {
    const result = await pool.query(
      `INSERT INTO conversation_members (conversation_id, user_id, role)
       VALUES ($1, $2, $3)
       ON CONFLICT (conversation_id, user_id) DO NOTHING
       RETURNING *`,
      [conversationId, userId, role]
    );
    return result.rows[0];
  },

  //si une conversation privée existe déjà entre deux users
  async findPrivateBetween(userId1, userId2) {
    const result = await pool.query(
      `SELECT c.* FROM conversations c
       JOIN conversation_members cm1 ON cm1.conversation_id = c.id AND cm1.user_id = $1
       JOIN conversation_members cm2 ON cm2.conversation_id = c.id AND cm2.user_id = $2
       WHERE c.type = 'private'
       LIMIT 1`,
      [userId1, userId2]
    );
    return result.rows[0];
  },

  //Récupérons toutes les conversations d'un utilisateur, avec le nom du correspondant, le dernier message,
  //le nombre de messages non lus et le dernier appel manqué non vu
  async findByUser(userId) {
    const result = await pool.query(
      `SELECT c.*,
              ou.id AS other_user_id,
              ou.username AS other_username,
              ou.status AS other_status,
              cm.last_read_at,
              lm.content AS last_message_content,
              lm.created_at AS last_message_at,
              lm.sender_id AS last_message_sender_id,
              lf.file_type AS last_message_file_type,
              COALESCE(unread.count, 0) AS unread_count,
              mc.id AS missed_call_id,
              mc.call_type AS missed_call_type,
              mc.started_at AS missed_call_at
       FROM conversations c
       JOIN conversation_members cm ON cm.conversation_id = c.id AND cm.user_id = $1
       LEFT JOIN conversation_members ocm ON ocm.conversation_id = c.id AND ocm.user_id != $1 AND c.type = 'private'
       LEFT JOIN users ou ON ou.id = ocm.user_id
       LEFT JOIN LATERAL (
         SELECT m.content, m.created_at, m.sender_id, m.file_id
         FROM messages m
         WHERE m.conversation_id = c.id
         ORDER BY m.created_at DESC
         LIMIT 1
       ) lm ON true
       LEFT JOIN files lf ON lf.id = lm.file_id
       LEFT JOIN LATERAL (
         SELECT COUNT(*) AS count
         FROM messages m
         WHERE m.conversation_id = c.id
           AND m.created_at > cm.last_read_at
           AND m.sender_id != $1
       ) unread ON true
       LEFT JOIN LATERAL (
         SELECT ca.id, ca.call_type, ca.started_at
         FROM calls ca
         WHERE ca.conversation_id = c.id
           AND ca.status IN ('missed', 'declined')
           AND ca.caller_id != $1
           AND ca.started_at > cm.last_read_at
         ORDER BY ca.started_at DESC
         LIMIT 1
       ) mc ON true
       ORDER BY COALESCE(lm.created_at, c.created_at) DESC`,
      [userId]
    );
    return result.rows;
  },

  // Marquer une conversation comme lue par l'utilisateur
  async markAsRead(conversationId, userId) {
    const result = await pool.query(
      `UPDATE conversation_members
       SET last_read_at = NOW()
       WHERE conversation_id = $1 AND user_id = $2
       RETURNING *`,
      [conversationId, userId]
    );
    return result.rows[0];
  },

  //Récupérons une conversation par id
  async findById(conversationId) {
    const result = await pool.query(
      `SELECT * FROM conversations WHERE id = $1`,
      [conversationId]
    );
    return result.rows[0];
  },

  //si un utilisateur appartient à une conversation
  async isMember(conversationId, userId) {
    const result = await pool.query(
      `SELECT * FROM conversation_members WHERE conversation_id = $1 AND user_id = $2`,
      [conversationId, userId]
    );
    return result.rows.length > 0;
  },

  //Récupérons les membres d'une conversation
  async getMembers(conversationId) {
    const result = await pool.query(
      `SELECT u.id, u.username, u.email, u.avatar_url, u.status, cm.role
       FROM conversation_members cm
       JOIN users u ON u.id = cm.user_id
       WHERE cm.conversation_id = $1`,
      [conversationId]
    );
    return result.rows;
  },
};

module.exports = ConversationModel;

const pool = require('../config/db');

const CallModel = {
  async create({ conversationId, callerId, callType }) {
    const result = await pool.query(
      `INSERT INTO calls (conversation_id, caller_id, call_type, status)
       VALUES ($1, $2, $3, 'missed')
       RETURNING *`,
      [conversationId, callerId, callType]
    );
    return result.rows[0];
  },

  async updateStatus(callId, status) {
    const result = await pool.query(
      `UPDATE calls SET status = $1 WHERE id = $2 RETURNING *`,
      [status, callId]
    );
    return result.rows[0];
  },

  async endCall(callId) {
    const result = await pool.query(
      `UPDATE calls
       SET ended_at = NOW(),
           duration = EXTRACT(EPOCH FROM (NOW() - started_at))::INTEGER
       WHERE id = $1
       RETURNING *`,
      [callId]
    );
    return result.rows[0];
  },

  async findByConversation(conversationId) {
    const result = await pool.query(
      `SELECT c.*, u.username AS caller_username
       FROM calls c
       JOIN users u ON u.id = c.caller_id
       WHERE c.conversation_id = $1
       ORDER BY c.started_at DESC`,
      [conversationId]
    );
    return result.rows;
  },

  // Historique complet des appels
  async findAllByUser(userId) {
    const result = await pool.query(
      `SELECT
         c.id AS conversation_id,
         ou.id AS other_user_id,
         ou.username AS other_username,
         last_call.call_type AS last_call_type,
         last_call.status AS last_call_status,
         last_call.started_at AS last_call_at,
         last_call.caller_id AS last_call_caller_id,
         COUNT(ca.id) AS total_calls
       FROM conversations c
       JOIN conversation_members cm ON cm.conversation_id = c.id AND cm.user_id = $1
       JOIN conversation_members ocm ON ocm.conversation_id = c.id AND ocm.user_id != $1
       JOIN users ou ON ou.id = ocm.user_id
       JOIN calls ca ON ca.conversation_id = c.id
       LEFT JOIN LATERAL (
         SELECT call_type, status, started_at, caller_id
         FROM calls
         WHERE conversation_id = c.id
         ORDER BY started_at DESC
         LIMIT 1
       ) last_call ON true
       WHERE c.type = 'private'
       GROUP BY c.id, ou.id, ou.username, last_call.call_type, last_call.status, last_call.started_at, last_call.caller_id
       ORDER BY last_call.started_at DESC`,
      [userId]
    );
    return result.rows;
  },
};

module.exports = CallModel;

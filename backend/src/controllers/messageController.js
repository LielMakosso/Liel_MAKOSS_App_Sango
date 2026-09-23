const MessageModel = require('../models/messageModel');
const ConversationModel = require('../models/conversationModel');

const MessageController = {
  // Envoyer un message
  async send(req, res) {
    try {
      const userId = req.user.id;
      const { conversationId, content, fileId } = req.body;

      if (!conversationId || (!content && !fileId)) {
        return res.status(400).json({ error: 'conversationId et (content ou fileId) requis' });
      }

      const isMember = await ConversationModel.isMember(conversationId, userId);
      if (!isMember) {
        return res.status(403).json({ error: 'Vous n\'appartenez pas à cette conversation' });
      }

      const message = await MessageModel.create({
        conversationId,
        senderId: userId,
        content: content || null,
        fileId: fileId || null,
      });

      res.status(201).json({ message });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Erreur lors de l\'envoi du message' });
    }
  },

  // Récupérer l'historique des messages d'une conversation
  async getHistory(req, res) {
    try {
      const userId = req.user.id;
      const { conversationId } = req.params;
      const limit = parseInt(req.query.limit) || 50;
      const offset = parseInt(req.query.offset) || 0;

      const isMember = await ConversationModel.isMember(conversationId, userId);
      if (!isMember) {
        return res.status(403).json({ error: 'Vous n\'appartenez pas à cette conversation' });
      }

      const messages = await MessageModel.findByConversation(conversationId, limit, offset);
      res.json({ messages });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Erreur lors de la récupération des messages' });
    }
  },
};

module.exports = MessageController;

const CallModel = require('../models/callModel');
const ConversationModel = require('../models/conversationModel');

const CallController = {
  async getHistory(req, res) {
    try {
      const userId = req.user.id;
      const { conversationId } = req.params;

      const isMember = await ConversationModel.isMember(conversationId, userId);
      if (!isMember) {
        return res.status(403).json({ error: 'Accès refusé à cette conversation' });
      }

      const calls = await CallModel.findByConversation(conversationId);
      res.json({ calls });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Erreur lors de la récupération de l\'historique des appels' });
    }
  },

  // Historique global des appels de l'utilisateur
  async getAll(req, res) {
    try {
      const userId = req.user.id;
      const calls = await CallModel.findAllByUser(userId);
      res.json({ calls });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Erreur lors de la récupération de l\'historique des appels' });
    }
  },
};

module.exports = CallController;

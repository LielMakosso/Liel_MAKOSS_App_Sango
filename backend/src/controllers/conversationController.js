const ConversationModel = require('../models/conversationModel');

const ConversationController = {
  //Créer une conversation privée
  async createPrivate(req, res) {
    try {
      const userId = req.user.id;
      const { targetUserId } = req.body;

      if (!targetUserId) {
        return res.status(400).json({ error: 'targetUserId est requis' });
      }

      if (targetUserId === userId) {
        return res.status(400).json({ error: 'Impossible de créer une conversation avec soi-même' });
      }
      //Vérifions si une conversation privée existe déjà
      const existing = await ConversationModel.findPrivateBetween(userId, targetUserId);
      if (existing) {
        return res.status(200).json({ conversation: existing, alreadyExists: true });
      }

      const conversation = await ConversationModel.create({
        type: 'private',
        name: null,
        createdBy: userId,
      });

      await ConversationModel.addMember(conversation.id, userId, 'member');
      await ConversationModel.addMember(conversation.id, targetUserId, 'member');

      res.status(201).json({ conversation });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Erreur lors de la création de la conversation' });
    }
  },

  //Création groupe
  async createGroup(req, res) {
    try {
      const userId = req.user.id;
      const { name, memberIds } = req.body;

      if (!name || !Array.isArray(memberIds) || memberIds.length === 0) {
        return res.status(400).json({ error: 'Nom du groupe et liste de membres requis' });
      }

      const conversation = await ConversationModel.create({
        type: 'group',
        name,
        createdBy: userId,
      });

      // Le créateur devient admin
      await ConversationModel.addMember(conversation.id, userId, 'admin');

      // Ajout des autres membres
      for (const memberId of memberIds) {
        if (memberId !== userId) {
          await ConversationModel.addMember(conversation.id, memberId, 'member');
        }
      }

      const members = await ConversationModel.getMembers(conversation.id);

      res.status(201).json({ conversation, members });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Erreur lors de la création du groupe' });
    }
  },

  // Liste mes conversations
  async listMine(req, res) {
    try {
      const userId = req.user.id;
      const conversations = await ConversationModel.findByUser(userId);
      res.json({ conversations });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Erreur lors de la récupération des conversations' });
    }
  },

  // Détails d'une conversation avec membres
  async getOne(req, res) {
    try {
      const userId = req.user.id;
      const conversationId = req.params.id;

      const isMember = await ConversationModel.isMember(conversationId, userId);
      if (!isMember) {
        return res.status(403).json({ error: 'Accès refusé à cette conversation' });
      }

      const conversation = await ConversationModel.findById(conversationId);
      const members = await ConversationModel.getMembers(conversationId);

      res.json({ conversation, members });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Erreur lors de la récupération de la conversation' });
    }
  },

  // Marquer une conversation comme lue
  async markAsRead(req, res) {
    try {
      const userId = req.user.id;
      const conversationId = req.params.id;

      const isMember = await ConversationModel.isMember(conversationId, userId);
      if (!isMember) {
        return res.status(403).json({ error: 'Accès refusé à cette conversation' });
      }

      await ConversationModel.markAsRead(conversationId, userId);
      res.json({ success: true });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Erreur lors du marquage de la conversation comme lue' });
    }
  },
};

module.exports = ConversationController;

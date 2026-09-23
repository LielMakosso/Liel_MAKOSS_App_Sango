const jwt = require('jsonwebtoken');
const MessageModel = require('../models/messageModel');
const ConversationModel = require('../models/conversationModel');
const CallModel = require('../models/callModel');

module.exports = (io) => {

  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) {
      return next(new Error('Token manquant'));
    }
    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
      if (err) return next(new Error('Token invalide'));
      socket.user = decoded;
      next();
    });
  });

  io.on('connection', (socket) => {
    console.log(`Utilisateur connecté: ${socket.user.email} (socket: ${socket.id})`);

    socket.join(`user_${socket.user.id}`);

    socket.on('join_conversation', async (conversationId) => {
      const isMember = await ConversationModel.isMember(conversationId, socket.user.id);
      if (!isMember) {
        return socket.emit('error', { message: 'Accès refusé à cette conversation' });
      }
      socket.join(`conversation_${conversationId}`);
      console.log(` ${socket.user.email} a rejoint conversation_${conversationId}`);
    });

    socket.on('leave_conversation', (conversationId) => {
      socket.leave(`conversation_${conversationId}`);
    });

    socket.on('send_message', async ({ conversationId, content, fileId }) => {
      try {
        const isMember = await ConversationModel.isMember(conversationId, socket.user.id);
        if (!isMember) {
          return socket.emit('error', { message: 'Vous n\'appartenez pas à cette conversation' });
        }

        const message = await MessageModel.create({
          conversationId,
          senderId: socket.user.id,
          content: content || null,
          fileId: fileId || null,
        });

        io.to(`conversation_${conversationId}`).emit('new_message', message);

        const members = await ConversationModel.getMembers(conversationId);
        members
          .filter((m) => m.id !== socket.user.id)
          .forEach((m) => {
            io.to(`user_${m.id}`).emit('conversation_updated', {
              conversationId,
              lastMessage: message,
            });
          });
      } catch (err) {
        console.error(err);
        socket.emit('error', { message: 'Erreur lors de l\'envoi du message' });
      }
    });

    socket.on('typing', ({ conversationId }) => {
      socket.to(`conversation_${conversationId}`).emit('user_typing', {
        userId: socket.user.id,
        email: socket.user.email,
      });
    });

    socket.on('stop_typing', ({ conversationId }) => {
      socket.to(`conversation_${conversationId}`).emit('user_stop_typing', {
        userId: socket.user.id,
      });
    });

    socket.on('call_user', async ({ conversationId, targetUserId, offer, callType }) => {
      try {
        const isMember = await ConversationModel.isMember(conversationId, socket.user.id);
        if (!isMember) {
          return socket.emit('error', { message: 'Vous n\'appartenez pas à cette conversation' });
        }

        const call = await CallModel.create({
          conversationId,
          callerId: socket.user.id,
          callType,
        });

        io.to(`user_${targetUserId}`).emit('incoming_call', {
          callId: call.id,
          callerId: socket.user.id,
          callerUsername: socket.user.username,
          callerEmail: socket.user.email,
          offer,
          callType,
          conversationId,
        });

        socket.emit('call_initiated', { call });
      } catch (err) {
        console.error(err);
        socket.emit('error', { message: 'Erreur lors de l\'initiation de l\'appel' });
      }
    });

    socket.on('answer_call', async ({ callId, conversationId, answer }) => {
      try {
        await CallModel.updateStatus(callId, 'answered');
        socket.to(`conversation_${conversationId}`).emit('call_answered', {
          callId,
          answer,
          answeredBy: socket.user.id,
        });
      } catch (err) {
        console.error(err);
        socket.emit('error', { message: 'Erreur lors de la réponse à l\'appel' });
      }
    });

    socket.on('ice_candidate', ({ conversationId, candidate }) => {
      socket.to(`conversation_${conversationId}`).emit('ice_candidate', {
        candidate,
        from: socket.user.id,
      });
    });

    socket.on('decline_call', async ({ callId, conversationId }) => {
      try {
        const call = await CallModel.updateStatus(callId, 'declined');
        await notifyOtherMembers(conversationId, socket.user.id, 'call_declined', {
          callId,
          declinedBy: socket.user.id,
        });
        if (call) {
          await notifyOtherMembers(conversationId, call.caller_id, 'call_missed', {
            conversationId,
            call,
          });
        }
      } catch (err) {
        console.error(err);
        socket.emit('error', { message: 'Erreur lors du refus de l\'appel' });
      }
    });

    socket.on('end_call', async ({ callId, conversationId }) => {
      try {
        const call = await CallModel.endCall(callId);
        await notifyOtherMembers(conversationId, socket.user.id, 'call_ended', { callId, call });
        if (call && call.status === 'missed') {
          await notifyOtherMembers(conversationId, call.caller_id, 'call_missed', {
            conversationId,
            call,
          });
        }
      } catch (err) {
        console.error(err);
        socket.emit('error', { message: 'Erreur lors de la fin de l\'appel' });
      }
    });

    socket.on('disconnect', () => {
      console.log(`Utilisateur déconnecté: ${socket.user.email}`);
    });
  });


  async function notifyOtherMembers(conversationId, excludeUserId, event, payload) {
    const members = await ConversationModel.getMembers(conversationId);
    members
      .filter((m) => m.id !== excludeUserId)
      .forEach((m) => {
        io.to(`user_${m.id}`).emit(event, payload);
      });
  }
};

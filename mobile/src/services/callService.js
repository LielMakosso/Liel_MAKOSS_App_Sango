import { mediaDevices, RTCPeerConnection, RTCIceCandidate, RTCSessionDescription } from 'react-native-webrtc';
import InCallManager from 'react-native-incall-manager';
import { socketService } from './socketService';

const PEER_CONFIG = {
  iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
};

class CallService {
  constructor() {
    this.peerConnection = null;
    this.localStream = null;
    this.remoteStream = null;
    this.currentCallId = null;
    this.currentConversationId = null;
    this.isMuted = false;
    this.isSpeakerOn = true;
    this.callbacks = {};
  }

  on(event, callback) {
    this.callbacks[event] = callback;
  }

  emit(event, data) {
    if (this.callbacks[event]) this.callbacks[event](data);
  }

  async getLocalStream(callType) {
    const constraints = {
      audio: true,
      video: callType === 'video' ? { facingMode: 'user' } : false,
    };
    this.localStream = await mediaDevices.getUserMedia(constraints);

    InCallManager.start({ media: callType === 'video' ? 'video' : 'audio' });
    this.isSpeakerOn = callType === 'video';
    InCallManager.setForceSpeakerphoneOn(this.isSpeakerOn);

    return this.localStream;
  }

  createPeerConnection() {
    this.peerConnection = new RTCPeerConnection(PEER_CONFIG);

    this.localStream.getTracks().forEach((track) => {
      this.peerConnection.addTrack(track, this.localStream);
    });

    this.peerConnection.ontrack = (event) => {
      this.remoteStream = event.streams[0];
      this.emit('remoteStream', this.remoteStream);
    };

    this.peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        const socket = socketService.getSocket();
        socket.emit('ice_candidate', {
          conversationId: this.currentConversationId,
          candidate: event.candidate,
        });
      }
    };

    return this.peerConnection;
  }

  async startCall(conversationId, targetUserId, callType) {
    this.currentConversationId = conversationId;
    await this.getLocalStream(callType);
    this.createPeerConnection();

    const offer = await this.peerConnection.createOffer();
    await this.peerConnection.setLocalDescription(offer);

    const socket = socketService.getSocket();
    socket.emit('call_user', {
      conversationId,
      targetUserId,
      offer,
      callType,
    });
  }

 async answerCall(conversationId, callId, offer, callType) {
   this.currentConversationId = conversationId;
   this.currentCallId = callId;
   await this.getLocalStream(callType);
   this.createPeerConnection();
   if (!offer || !offer.type || !offer.sdp || offer.sdp === 'fake_sdp_for_testing') {
     console.error('[CallService] Offer invalide ou factice:', offer);
     throw new Error('Offre SDP invalide ou factice');
   }
   try {
     await this.peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
     const answer = await this.peerConnection.createAnswer();
     await this.peerConnection.setLocalDescription(answer);

     const socket = socketService.getSocket();
     socket.emit('answer_call', { callId, conversationId, answer });
   } catch (err) {
     console.error('[CallService] Erreur answerCall:', err);
     throw err;
   }
 }

  async handleAnswer(answer) {
    if (this.peerConnection) {
      await this.peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
    }
  }

  async addIceCandidate(candidate) {
    if (this.peerConnection) {
      try {
        await this.peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (err) {
        console.log('Erreur ICE candidate', err);
      }
    }
  }

  toggleMute() {
    if (this.localStream) {
      const audioTrack = this.localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        this.isMuted = !audioTrack.enabled;
      }
    }
    return this.isMuted;
  }

  toggleSpeaker() {
    this.isSpeakerOn = !this.isSpeakerOn;
    InCallManager.setForceSpeakerphoneOn(this.isSpeakerOn);
    return this.isSpeakerOn;
  }

  endCall() {
    InCallManager.stop();

    if (this.peerConnection) {
      this.peerConnection.close();
      this.peerConnection = null;
    }
    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => track.stop());
      this.localStream = null;
    }
    this.remoteStream = null;

    const socket = socketService.getSocket();
    if (socket && this.currentCallId) {
      socket.emit('end_call', { callId: this.currentCallId, conversationId: this.currentConversationId });
    }
    this.currentCallId = null;
    this.currentConversationId = null;
    this.isMuted = false;
  }
}

export default new CallService();
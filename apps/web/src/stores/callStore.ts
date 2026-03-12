import { create } from 'zustand';
import { getSocket } from '../lib/socket';
import type { Call } from '../types';

type CallStatus = 'idle' | 'ringing' | 'ongoing' | 'ended';

interface IncomingCallData {
  callId: string;
  callerId: string;
  callerName: string;
  callerAvatar?: string;
  type: 'VOICE' | 'VIDEO';
}

interface CallState {
  activeCall: Call | null;
  incomingCall: IncomingCallData | null;
  callStatus: CallStatus;
  isMuted: boolean;
  isVideoOff: boolean;
  localStream: MediaStream | null;
  remoteStreams: Record<string, MediaStream>;
  peerConnection: RTCPeerConnection | null;

  setIncomingCall: (data: IncomingCallData | null) => void;
  initiateCall: (targetUserId: string, type: 'VOICE' | 'VIDEO') => void;
  acceptCall: () => void;
  declineCall: () => void;
  endCall: () => void;
  toggleMute: () => void;
  toggleVideo: () => void;
  setLocalStream: (stream: MediaStream | null) => void;
  addRemoteStream: (userId: string, stream: MediaStream) => void;
}

export const useCallStore = create<CallState>((set, get) => ({
  activeCall: null,
  incomingCall: null,
  callStatus: 'idle',
  isMuted: false,
  isVideoOff: false,
  localStream: null,
  remoteStreams: {},
  peerConnection: null,

  setIncomingCall: (data) => set({ incomingCall: data, callStatus: data ? 'ringing' : 'idle' }),

  initiateCall: async (targetUserId, type) => {
    try {
      const constraints = { audio: true, video: type === 'VIDEO' };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      set({ localStream: stream, callStatus: 'ringing' });

      const socket = getSocket();
      socket.emit('call_initiate', { targetUserId, type });
    } catch (err) {
      console.error('Failed to get media:', err);
    }
  },

  acceptCall: async () => {
    const { incomingCall } = get();
    if (!incomingCall) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: incomingCall.type === 'VIDEO',
      });
      set({ localStream: stream, callStatus: 'ongoing', incomingCall: null });
      const socket = getSocket();
      socket.emit('call_accept', incomingCall.callId);
    } catch (err) {
      console.error('Failed to accept call:', err);
    }
  },

  declineCall: () => {
    const { incomingCall } = get();
    if (!incomingCall) return;
    const socket = getSocket();
    socket.emit('call_decline', incomingCall.callId);
    set({ incomingCall: null, callStatus: 'idle' });
  },

  endCall: () => {
    const { localStream, peerConnection, activeCall, incomingCall } = get();
    localStream?.getTracks().forEach(t => t.stop());
    peerConnection?.close();
    const callId = activeCall?.id || incomingCall?.callId;
    if (callId) {
      const socket = getSocket();
      socket.emit('call_end', callId);
    }
    set({
      activeCall: null,
      incomingCall: null,
      callStatus: 'idle',
      localStream: null,
      remoteStreams: {},
      peerConnection: null,
      isMuted: false,
      isVideoOff: false,
    });
  },

  toggleMute: () => {
    const { localStream, isMuted } = get();
    localStream?.getAudioTracks().forEach(t => (t.enabled = isMuted));
    set({ isMuted: !isMuted });
  },

  toggleVideo: () => {
    const { localStream, isVideoOff } = get();
    localStream?.getVideoTracks().forEach(t => (t.enabled = isVideoOff));
    set({ isVideoOff: !isVideoOff });
  },

  setLocalStream: (stream) => set({ localStream: stream }),

  addRemoteStream: (userId, stream) =>
    set(s => ({ remoteStreams: { ...s.remoteStreams, [userId]: stream } })),
}));

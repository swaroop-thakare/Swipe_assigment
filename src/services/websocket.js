import { io } from 'socket.io-client';

class WebSocketService {
  constructor() {
    this.socket = null;
    this.listeners = new Map();
    this.isConnected = false;
  }

  connect() {
    if (this.socket && this.isConnected) {
      return;
    }

    const serverUrl = process.env.REACT_APP_WS_URL || 'http://localhost:5001';
    this.socket = io(serverUrl, {
      transports: ['websocket', 'polling'],
      autoConnect: true,
    });

    this.socket.on('connect', () => {
      console.log('🔌 Connected to WebSocket server');
      this.isConnected = true;
      this.emit('connection-status', { connected: true });
    });

    this.socket.on('disconnect', () => {
      console.log('🔌 Disconnected from WebSocket server');
      this.isConnected = false;
      this.emit('connection-status', { connected: false });
    });

    this.socket.on('connect_error', (error) => {
      console.error('❌ WebSocket connection error:', error);
      this.isConnected = false;
      this.emit('connection-status', { connected: false, error });
    });

    // Set up event forwarding
    this.setupEventForwarding();
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
  }

  setupEventForwarding() {
    const events = [
      'interview-started',
      'interview-resumed',
      'interview-paused',
      'interview-completed',
      'timer-started',
      'timer-updated',
      'timer-expired',
      'answer-submitted',
      'question-changed',
      'candidate-updated',
      'interview-updated',
      'meeting-started',
      'meeting-ended',
      'meeting-updated',
      'participant-joined',
      'participant-left'
    ];

    events.forEach(event => {
      this.socket.on(event, (data) => {
        this.emit(event, data);
      });
    });
  }

  // Join interview room for real-time updates
  joinInterview(interviewId) {
    if (this.socket && this.isConnected) {
      this.socket.emit('join-interview', interviewId);
      console.log(`👤 Joined interview room: ${interviewId}`);
    }
  }

  // Leave interview room
  leaveInterview(interviewId) {
    if (this.socket && this.isConnected) {
      this.socket.emit('leave-interview', interviewId);
      console.log(`👤 Left interview room: ${interviewId}`);
    }
  }

  // Event listener management
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event).add(callback);
  }

  off(event, callback) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).delete(callback);
    }
  }

  emit(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in event listener for ${event}:`, error);
        }
      });
    }
  }

  // Interview-specific event handlers
  onInterviewStarted(callback) {
    this.on('interview-started', callback);
  }

  onInterviewResumed(callback) {
    this.on('interview-resumed', callback);
  }

  onInterviewPaused(callback) {
    this.on('interview-paused', callback);
  }

  onInterviewCompleted(callback) {
    this.on('interview-completed', callback);
  }

  onTimerStarted(callback) {
    this.on('timer-started', callback);
  }

  onTimerUpdated(callback) {
    this.on('timer-updated', callback);
  }

  onTimerExpired(callback) {
    this.on('timer-expired', callback);
  }

  onAnswerSubmitted(callback) {
    this.on('answer-submitted', callback);
  }

  onQuestionChanged(callback) {
    this.on('question-changed', callback);
  }

  onCandidateUpdated(callback) {
    this.on('candidate-updated', callback);
  }

  onInterviewUpdated(callback) {
    this.on('interview-updated', callback);
  }

  onConnectionStatus(callback) {
    this.on('connection-status', callback);
  }

  // Meeting-specific event handlers
  onMeetingStarted(callback) {
    this.on('meeting-started', callback);
  }

  onMeetingEnded(callback) {
    this.on('meeting-ended', callback);
  }

  onMeetingUpdated(callback) {
    this.on('meeting-updated', callback);
  }

  onParticipantJoined(callback) {
    this.on('participant-joined', callback);
  }

  onParticipantLeft(callback) {
    this.on('participant-left', callback);
  }

  // Utility methods
  isConnected() {
    return this.isConnected && this.socket && this.socket.connected;
  }

  getSocketId() {
    return this.socket ? this.socket.id : null;
  }
}

export default new WebSocketService();

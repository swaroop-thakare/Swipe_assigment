const mongoose = require('mongoose');

const interviewSchema = new mongoose.Schema({
  candidateId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Candidate',
    required: true
  },
  sessionId: {
    type: String,
    required: true,
    unique: true
  },
  status: {
    type: String,
    enum: ['active', 'paused', 'completed', 'abandoned'],
    default: 'active'
  },
  currentQuestionIndex: {
    type: Number,
    default: 0
  },
  questions: [{
    id: String,
    text: String,
    difficulty: {
      type: String,
      enum: ['easy', 'medium', 'hard']
    },
    timeLimit: Number,
    category: String,
    aiGenerated: {
      type: Boolean,
      default: true
    },
    generatedAt: {
      type: Date,
      default: Date.now
    }
  }],
  answers: [{
    questionId: String,
    answer: String,
    timeSpent: Number,
    submittedAt: {
      type: Date,
      default: Date.now
    },
    score: Number,
    aiFeedback: String,
    autoSubmitted: {
      type: Boolean,
      default: false
    }
  }],
  timerState: {
    isActive: {
      type: Boolean,
      default: false
    },
    timeRemaining: Number,
    startedAt: Date,
    pausedAt: Date,
    totalPausedTime: {
      type: Number,
      default: 0
    }
  },
  finalScore: {
    type: Number,
    min: 0,
    max: 100,
    default: null
  },
  aiSummary: {
    type: String,
    default: null
  },
  startedAt: {
    type: Date,
    default: Date.now
  },
  completedAt: {
    type: Date,
    default: null
  },
  lastActivityAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes
interviewSchema.index({ candidateId: 1 });
interviewSchema.index({ sessionId: 1 });
interviewSchema.index({ status: 1 });
interviewSchema.index({ lastActivityAt: -1 });

// Virtual for progress
interviewSchema.virtual('progress').get(function() {
  if (!this.questions || this.questions.length === 0) return 0;
  return Math.round((this.currentQuestionIndex / this.questions.length) * 100);
});

// Virtual for total time
interviewSchema.virtual('totalTime').get(function() {
  if (!this.answers || this.answers.length === 0) return 0;
  return this.answers.reduce((total, answer) => total + (answer.timeSpent || 0), 0);
});

// Method to get current question
interviewSchema.methods.getCurrentQuestion = function() {
  if (!this.questions || this.currentQuestionIndex >= this.questions.length) {
    return null;
  }
  return this.questions[this.currentQuestionIndex];
};

// Method to start timer
interviewSchema.methods.startTimer = function(timeLimit) {
  this.timerState = {
    isActive: true,
    timeRemaining: timeLimit,
    startedAt: new Date(),
    pausedAt: null,
    totalPausedTime: 0
  };
  return this.save();
};

// Method to pause timer
interviewSchema.methods.pauseTimer = function() {
  if (this.timerState.isActive) {
    this.timerState.pausedAt = new Date();
    this.timerState.isActive = false;
  }
  return this.save();
};

// Method to resume timer
interviewSchema.methods.resumeTimer = function() {
  if (this.timerState.pausedAt) {
    const pausedTime = new Date() - this.timerState.pausedAt;
    this.timerState.totalPausedTime += pausedTime;
    this.timerState.pausedAt = null;
    this.timerState.isActive = true;
  }
  return this.save();
};

// Method to get remaining time
interviewSchema.methods.getRemainingTime = function() {
  if (!this.timerState.isActive) return this.timerState.timeRemaining;
  
  const now = new Date();
  const elapsed = now - this.timerState.startedAt - this.timerState.totalPausedTime;
  const remaining = Math.max(0, this.timerState.timeRemaining - Math.floor(elapsed / 1000));
  
  return remaining;
};

// Method to submit answer
interviewSchema.methods.submitAnswer = function(questionId, answer, timeSpent, autoSubmitted = false) {
  const answerData = {
    questionId,
    answer,
    timeSpent,
    submittedAt: new Date(),
    autoSubmitted
  };
  
  this.answers.push(answerData);
  this.currentQuestionIndex += 1;
  this.lastActivityAt = new Date();
  
  return this.save();
};

// Method to complete interview
interviewSchema.methods.completeInterview = function(finalScore, aiSummary) {
  this.status = 'completed';
  this.finalScore = finalScore;
  this.aiSummary = aiSummary;
  this.completedAt = new Date();
  this.timerState.isActive = false;
  
  return this.save();
};

module.exports = mongoose.model('Interview', interviewSchema);

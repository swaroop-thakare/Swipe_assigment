const mongoose = require('mongoose');

const candidateSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  phone: {
    type: String,
    required: true,
    trim: true
  },
  resumeUrl: {
    type: String,
    default: null
  },
  profileData: {
    extractedFields: {
      name: String,
      email: String,
      phone: String
    },
    missingFields: [String],
    isComplete: {
      type: Boolean,
      default: false
    }
  },
  interviewStatus: {
    type: String,
    enum: ['not_started', 'in_progress', 'completed', 'paused'],
    default: 'not_started'
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
    aiFeedback: String
  }],
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
  interviewStartedAt: {
    type: Date,
    default: null
  },
  interviewCompletedAt: {
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

// Indexes for better performance
candidateSchema.index({ email: 1 });
candidateSchema.index({ interviewStatus: 1 });
candidateSchema.index({ finalScore: -1 });
candidateSchema.index({ createdAt: -1 });

// Virtual for interview progress
candidateSchema.virtual('progress').get(function() {
  if (!this.questions || this.questions.length === 0) return 0;
  return Math.round((this.currentQuestionIndex / this.questions.length) * 100);
});

// Virtual for total interview time
candidateSchema.virtual('totalInterviewTime').get(function() {
  if (!this.answers || this.answers.length === 0) return 0;
  return this.answers.reduce((total, answer) => total + (answer.timeSpent || 0), 0);
});

// Method to get current question
candidateSchema.methods.getCurrentQuestion = function() {
  if (!this.questions || this.currentQuestionIndex >= this.questions.length) {
    return null;
  }
  return this.questions[this.currentQuestionIndex];
};

// Method to check if interview is complete
candidateSchema.methods.isInterviewComplete = function() {
  return this.interviewStatus === 'completed' || 
         (this.questions && this.currentQuestionIndex >= this.questions.length);
};

// Method to get interview statistics
candidateSchema.methods.getInterviewStats = function() {
  const stats = {
    totalQuestions: this.questions ? this.questions.length : 0,
    answeredQuestions: this.answers ? this.answers.length : 0,
    currentQuestion: this.currentQuestionIndex + 1,
    progress: this.progress,
    averageScore: null,
    totalTime: this.totalInterviewTime
  };

  if (this.answers && this.answers.length > 0) {
    const scores = this.answers.filter(a => a.score !== null && a.score !== undefined);
    if (scores.length > 0) {
      stats.averageScore = scores.reduce((sum, a) => sum + a.score, 0) / scores.length;
    }
  }

  return stats;
};

module.exports = mongoose.model('Candidate', candidateSchema);

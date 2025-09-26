const express = require('express');
const router = express.Router();
const Interview = require('../models/Interview');
const Candidate = require('../models/Candidate');
const aiService = require('../services/aiService');

// Get interview by ID
router.get('/:id', async (req, res) => {
  try {
    const interview = await Interview.findById(req.params.id)
      .populate('candidateId', 'name email phone');
    
    if (!interview) {
      return res.status(404).json({ error: 'Interview not found' });
    }

    res.json(interview);

  } catch (error) {
    console.error('Error fetching interview:', error);
    res.status(500).json({ error: 'Failed to fetch interview' });
  }
});

// Get current question
router.get('/:id/current-question', async (req, res) => {
  try {
    const interview = await Interview.findById(req.params.id);
    
    if (!interview) {
      return res.status(404).json({ error: 'Interview not found' });
    }

    const currentQuestion = interview.getCurrentQuestion();
    
    if (!currentQuestion) {
      return res.status(400).json({ error: 'No more questions available' });
    }

    res.json({
      question: currentQuestion,
      progress: interview.progress,
      currentIndex: interview.currentQuestionIndex,
      totalQuestions: interview.questions.length
    });

  } catch (error) {
    console.error('Error fetching current question:', error);
    res.status(500).json({ error: 'Failed to fetch current question' });
  }
});

// Start timer for current question
router.post('/:id/start-timer', async (req, res) => {
  try {
    const interview = await Interview.findById(req.params.id);
    
    if (!interview) {
      return res.status(404).json({ error: 'Interview not found' });
    }

    const currentQuestion = interview.getCurrentQuestion();
    if (!currentQuestion) {
      return res.status(400).json({ error: 'No current question available' });
    }

    await interview.startTimer(currentQuestion.timeLimit);

    // Emit real-time update
    const io = req.app.get('io');
    io.to(`interview-${interview._id}`).emit('timer-started', {
      timeLimit: currentQuestion.timeLimit,
      questionId: currentQuestion.id
    });

    res.json({
      timeLimit: currentQuestion.timeLimit,
      startedAt: interview.timerState.startedAt,
      message: 'Timer started'
    });

  } catch (error) {
    console.error('Error starting timer:', error);
    res.status(500).json({ error: 'Failed to start timer' });
  }
});

// Submit answer
router.post('/:id/submit-answer', async (req, res) => {
  try {
    const { answer, timeSpent, autoSubmitted = false } = req.body;
    
    const interview = await Interview.findById(req.params.id);
    if (!interview) {
      return res.status(404).json({ error: 'Interview not found' });
    }

    const currentQuestion = interview.getCurrentQuestion();
    if (!currentQuestion) {
      return res.status(400).json({ error: 'No current question available' });
    }

    // Submit answer
    await interview.submitAnswer(currentQuestion.id, answer, timeSpent, autoSubmitted);

    // Score the answer using AI
    const scoringResult = await aiService.scoreAnswer(currentQuestion, answer, timeSpent);
    
    // Update the answer with score and feedback
    const lastAnswer = interview.answers[interview.answers.length - 1];
    lastAnswer.score = scoringResult.score;
    lastAnswer.aiFeedback = scoringResult.feedback;
    await interview.save();

    // Check if interview is complete
    if (interview.currentQuestionIndex >= interview.questions.length) {
      await completeInterview(interview);
    }

    // Emit real-time update
    const io = req.app.get('io');
    io.to(`interview-${interview._id}`).emit('answer-submitted', {
      questionId: currentQuestion.id,
      answer,
      score: scoringResult.score,
      feedback: scoringResult.feedback,
      isComplete: interview.currentQuestionIndex >= interview.questions.length
    });

    res.json({
      answer: lastAnswer,
      score: scoringResult.score,
      feedback: scoringResult.feedback,
      isComplete: interview.currentQuestionIndex >= interview.questions.length,
      nextQuestion: interview.getCurrentQuestion()
    });

  } catch (error) {
    console.error('Error submitting answer:', error);
    res.status(500).json({ error: 'Failed to submit answer' });
  }
});

// Get interview progress
router.get('/:id/progress', async (req, res) => {
  try {
    const interview = await Interview.findById(req.params.id);
    
    if (!interview) {
      return res.status(404).json({ error: 'Interview not found' });
    }

    const stats = {
      progress: interview.progress,
      currentQuestion: interview.currentQuestionIndex + 1,
      totalQuestions: interview.questions.length,
      answeredQuestions: interview.answers.length,
      totalTime: interview.totalTime,
      status: interview.status,
      remainingTime: interview.getRemainingTime()
    };

    res.json(stats);

  } catch (error) {
    console.error('Error fetching progress:', error);
    res.status(500).json({ error: 'Failed to fetch progress' });
  }
});

// Get interview history
router.get('/:id/history', async (req, res) => {
  try {
    const interview = await Interview.findById(req.params.id)
      .populate('candidateId', 'name email phone');
    
    if (!interview) {
      return res.status(404).json({ error: 'Interview not found' });
    }

    const history = interview.questions.map((question, index) => {
      const answer = interview.answers[index];
      return {
        question,
        answer: answer || null,
        questionNumber: index + 1
      };
    });

    res.json({
      interview,
      history,
      stats: {
        progress: interview.progress,
        totalTime: interview.totalTime,
        averageScore: interview.answers.length > 0 ? 
          interview.answers.reduce((sum, a) => sum + (a.score || 0), 0) / interview.answers.length : 0
      }
    });

  } catch (error) {
    console.error('Error fetching history:', error);
    res.status(500).json({ error: 'Failed to fetch history' });
  }
});

// Complete interview manually
router.post('/:id/complete', async (req, res) => {
  try {
    const interview = await Interview.findById(req.params.id);
    
    if (!interview) {
      return res.status(404).json({ error: 'Interview not found' });
    }

    if (interview.status === 'completed') {
      return res.status(400).json({ error: 'Interview already completed' });
    }

    await completeInterview(interview);

    res.json({
      interview,
      message: 'Interview completed successfully'
    });

  } catch (error) {
    console.error('Error completing interview:', error);
    res.status(500).json({ error: 'Failed to complete interview' });
  }
});

// Helper function to complete interview
async function completeInterview(interview) {
  try {
    // Calculate final score
    const scores = interview.answers
      .filter(a => a.score !== null && a.score !== undefined)
      .map(a => a.score);
    
    const finalScore = scores.length > 0 ? 
      scores.reduce((sum, score) => sum + score, 0) / scores.length : 0;

    // Generate AI summary
    const candidate = await Candidate.findById(interview.candidateId);
    const aiSummary = await aiService.generateSummary(
      candidate, 
      interview.questions, 
      interview.answers, 
      scores
    );

    // Complete interview
    await interview.completeInterview(finalScore, aiSummary);

    // Update candidate
    candidate.interviewStatus = 'completed';
    candidate.finalScore = finalScore;
    candidate.aiSummary = aiSummary;
    candidate.interviewCompletedAt = new Date();
    await candidate.save();

    // Emit completion event
    const io = interview.constructor.base.connection.db.admin().serverConfig;
    // Note: In a real implementation, you'd need to pass the io instance properly
    console.log('Interview completed:', interview._id);

  } catch (error) {
    console.error('Error in completeInterview helper:', error);
    throw error;
  }
}

module.exports = router;

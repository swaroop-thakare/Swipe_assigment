const express = require('express');
const router = express.Router();
const aiService = require('../services/aiService');

// Generate interview questions
router.post('/generate-questions', async (req, res) => {
  try {
    const { role = 'full-stack developer', difficulty = 'mixed' } = req.body;
    
    const questions = await aiService.generateQuestions(role, difficulty);
    
    res.json({
      questions,
      count: questions.length,
      role,
      difficulty
    });

  } catch (error) {
    console.error('Error generating questions:', error);
    res.status(500).json({ 
      error: 'Failed to generate questions',
      details: error.message 
    });
  }
});

// Score an answer
router.post('/score-answer', async (req, res) => {
  try {
    const { question, answer, timeSpent } = req.body;
    
    if (!question || !answer) {
      return res.status(400).json({ 
        error: 'Question and answer are required' 
      });
    }

    const result = await aiService.scoreAnswer(question, answer, timeSpent);
    
    res.json(result);

  } catch (error) {
    console.error('Error scoring answer:', error);
    res.status(500).json({ 
      error: 'Failed to score answer',
      details: error.message 
    });
  }
});

// Generate interview summary
router.post('/generate-summary', async (req, res) => {
  try {
    const { candidate, questions, answers, scores } = req.body;
    
    if (!candidate || !questions || !answers || !scores) {
      return res.status(400).json({ 
        error: 'Candidate, questions, answers, and scores are required' 
      });
    }

    const summary = await aiService.generateSummary(candidate, questions, answers, scores);
    
    res.json({
      summary,
      candidate: candidate.name,
      averageScore: scores.reduce((a, b) => a + b, 0) / scores.length
    });

  } catch (error) {
    console.error('Error generating summary:', error);
    res.status(500).json({ 
      error: 'Failed to generate summary',
      details: error.message 
    });
  }
});

// Extract profile from text
router.post('/extract-profile', async (req, res) => {
  try {
    const { resumeText } = req.body;
    
    if (!resumeText) {
      return res.status(400).json({ 
        error: 'Resume text is required' 
      });
    }

    const profile = await aiService.extractProfileFromResume(resumeText);
    
    res.json(profile);

  } catch (error) {
    console.error('Error extracting profile:', error);
    res.status(500).json({ 
      error: 'Failed to extract profile',
      details: error.message 
    });
  }
});

// Get AI service status
router.get('/status', (req, res) => {
  res.json({
    status: 'active',
    model: process.env.OPENAI_MODEL || 'gpt-4',
    maxTokens: process.env.OPENAI_MAX_TOKENS || 1000,
    features: [
      'question-generation',
      'answer-scoring',
      'summary-generation',
      'profile-extraction'
    ]
  });
});

// Test AI connection
router.get('/test', async (req, res) => {
  try {
    // Test with a simple question generation
    const testQuestions = await aiService.generateQuestions('test role', 'easy');
    
    res.json({
      status: 'connected',
      testResult: {
        questionsGenerated: testQuestions.length,
        sampleQuestion: testQuestions[0] || null
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('AI test error:', error);
    res.status(500).json({ 
      status: 'error',
      error: 'AI service test failed',
      details: error.message 
    });
  }
});

module.exports = router;

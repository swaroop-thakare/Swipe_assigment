const express = require('express');
const router = express.Router();
const Candidate = require('../models/Candidate');
const Interview = require('../models/Interview');
const aiService = require('../services/aiService');
const resumeService = require('../services/resumeService');
const { v4: uuidv4 } = require('uuid');

// Get all candidates with filtering and sorting
router.get('/', async (req, res) => {
  try {
    const { 
      search, 
      status, 
      sortBy = 'createdAt', 
      sortOrder = 'desc',
      page = 1,
      limit = 10
    } = req.query;

    const query = {};
    
    // Search filter
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Status filter
    if (status) {
      query.interviewStatus = status;
    }

    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const candidates = await Candidate.find(query)
      .sort(sortOptions)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();

    const total = await Candidate.countDocuments(query);

    res.json({
      candidates,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });

  } catch (error) {
    console.error('Error fetching candidates:', error);
    res.status(500).json({ error: 'Failed to fetch candidates' });
  }
});

// Get candidate by ID
router.get('/:id', async (req, res) => {
  try {
    const candidate = await Candidate.findById(req.params.id);
    
    if (!candidate) {
      return res.status(404).json({ error: 'Candidate not found' });
    }

    // Get interview data if exists
    const interview = await Interview.findOne({ candidateId: candidate._id });
    
    res.json({
      candidate,
      interview,
      stats: candidate.getInterviewStats()
    });

  } catch (error) {
    console.error('Error fetching candidate:', error);
    res.status(500).json({ error: 'Failed to fetch candidate' });
  }
});

// Create new candidate
router.post('/', async (req, res) => {
  try {
    const { name, email, phone, resumeData } = req.body;

    // Validate required fields
    if (!name || !email || !phone) {
      return res.status(400).json({ 
        error: 'Name, email, and phone are required' 
      });
    }

    // Check if candidate already exists
    const existingCandidate = await Candidate.findOne({ email });
    if (existingCandidate) {
      return res.status(409).json({ 
        error: 'Candidate with this email already exists' 
      });
    }

    const candidate = new Candidate({
      name,
      email,
      phone,
      profileData: {
        extractedFields: { name, email, phone },
        missingFields: [],
        isComplete: true
      }
    });

    await candidate.save();

    res.status(201).json({
      candidate,
      message: 'Candidate created successfully'
    });

  } catch (error) {
    console.error('Error creating candidate:', error);
    res.status(500).json({ error: 'Failed to create candidate' });
  }
});

// Update candidate profile
router.put('/:id/profile', async (req, res) => {
  try {
    const { name, email, phone } = req.body;
    
    const candidate = await Candidate.findById(req.params.id);
    if (!candidate) {
      return res.status(404).json({ error: 'Candidate not found' });
    }

    // Update profile data
    candidate.name = name || candidate.name;
    candidate.email = email || candidate.email;
    candidate.phone = phone || candidate.phone;
    
    candidate.profileData.extractedFields = {
      name: candidate.name,
      email: candidate.email,
      phone: candidate.phone
    };
    
    candidate.profileData.missingFields = [];
    candidate.profileData.isComplete = true;

    await candidate.save();

    res.json({
      candidate,
      message: 'Profile updated successfully'
    });

  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// Start interview for candidate
router.post('/:id/start-interview', async (req, res) => {
  try {
    const candidate = await Candidate.findById(req.params.id);
    if (!candidate) {
      return res.status(404).json({ error: 'Candidate not found' });
    }

    if (candidate.interviewStatus === 'in_progress') {
      return res.status(400).json({ error: 'Interview already in progress' });
    }

    if (candidate.interviewStatus === 'completed') {
      return res.status(400).json({ error: 'Interview already completed' });
    }

    // Generate AI questions
    const questions = await aiService.generateQuestions('full-stack developer');
    
    // Update candidate with questions
    candidate.questions = questions;
    candidate.interviewStatus = 'in_progress';
    candidate.currentQuestionIndex = 0;
    candidate.interviewStartedAt = new Date();
    candidate.lastActivityAt = new Date();

    await candidate.save();

    // Create interview session
    const interview = new Interview({
      candidateId: candidate._id,
      sessionId: uuidv4(),
      questions: questions,
      status: 'active'
    });

    await interview.save();

    // Emit real-time update
    const io = req.app.get('io');
    io.emit('interview-started', {
      candidateId: candidate._id,
      interviewId: interview._id
    });

    res.json({
      candidate,
      interview,
      currentQuestion: questions[0],
      message: 'Interview started successfully'
    });

  } catch (error) {
    console.error('Error starting interview:', error);
    res.status(500).json({ error: 'Failed to start interview' });
  }
});

// Resume interview
router.post('/:id/resume-interview', async (req, res) => {
  try {
    const candidate = await Candidate.findById(req.params.id);
    if (!candidate) {
      return res.status(404).json({ error: 'Candidate not found' });
    }

    if (candidate.interviewStatus !== 'paused') {
      return res.status(400).json({ error: 'No paused interview to resume' });
    }

    // Find active interview
    const interview = await Interview.findOne({ 
      candidateId: candidate._id, 
      status: 'paused' 
    });

    if (!interview) {
      return res.status(404).json({ error: 'No paused interview found' });
    }

    // Resume interview
    candidate.interviewStatus = 'in_progress';
    candidate.lastActivityAt = new Date();
    await candidate.save();

    interview.status = 'active';
    await interview.save();

    // Emit real-time update
    const io = req.app.get('io');
    io.emit('interview-resumed', {
      candidateId: candidate._id,
      interviewId: interview._id
    });

    res.json({
      candidate,
      interview,
      currentQuestion: candidate.getCurrentQuestion(),
      message: 'Interview resumed successfully'
    });

  } catch (error) {
    console.error('Error resuming interview:', error);
    res.status(500).json({ error: 'Failed to resume interview' });
  }
});

// Pause interview
router.post('/:id/pause-interview', async (req, res) => {
  try {
    const candidate = await Candidate.findById(req.params.id);
    if (!candidate) {
      return res.status(404).json({ error: 'Candidate not found' });
    }

    if (candidate.interviewStatus !== 'in_progress') {
      return res.status(400).json({ error: 'No active interview to pause' });
    }

    // Find active interview
    const interview = await Interview.findOne({ 
      candidateId: candidate._id, 
      status: 'active' 
    });

    if (!interview) {
      return res.status(404).json({ error: 'No active interview found' });
    }

    // Pause interview
    candidate.interviewStatus = 'paused';
    candidate.lastActivityAt = new Date();
    await candidate.save();

    interview.status = 'paused';
    await interview.pauseTimer();
    await interview.save();

    // Emit real-time update
    const io = req.app.get('io');
    io.emit('interview-paused', {
      candidateId: candidate._id,
      interviewId: interview._id
    });

    res.json({
      candidate,
      interview,
      message: 'Interview paused successfully'
    });

  } catch (error) {
    console.error('Error pausing interview:', error);
    res.status(500).json({ error: 'Failed to pause interview' });
  }
});

// Delete candidate
router.delete('/:id', async (req, res) => {
  try {
    const candidate = await Candidate.findByIdAndDelete(req.params.id);
    
    if (!candidate) {
      return res.status(404).json({ error: 'Candidate not found' });
    }

    // Also delete associated interview
    await Interview.deleteOne({ candidateId: candidate._id });

    res.json({ message: 'Candidate deleted successfully' });

  } catch (error) {
    console.error('Error deleting candidate:', error);
    res.status(500).json({ error: 'Failed to delete candidate' });
  }
});

module.exports = router;

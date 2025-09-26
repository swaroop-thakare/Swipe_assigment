const express = require('express');
const multer = require('multer');
const router = express.Router();
const resumeService = require('../services/resumeService');
const Candidate = require('../models/Candidate');

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024, // 10MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = (process.env.ALLOWED_FILE_TYPES || 'application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document').split(',');
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF and DOCX files are allowed.'), false);
    }
  }
});

// Upload and parse resume
router.post('/resume', upload.single('resume'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Process the resume
    const result = await resumeService.processResume(req.file);
    
    if (!result.success) {
      return res.status(400).json({ 
        error: result.error,
        profile: result.profile
      });
    }

    // Validate extracted profile
    const validation = resumeService.validateProfile(result.profile);
    
    res.json({
      success: true,
      profile: result.profile,
      validation,
      fileInfo: {
        name: req.file.originalname,
        size: req.file.size,
        type: req.file.mimetype
      },
      preview: result.resumeText
    });

  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ 
      error: 'Failed to process resume',
      details: error.message 
    });
  }
});

// Create candidate from uploaded resume
router.post('/create-candidate', upload.single('resume'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Process the resume
    const result = await resumeService.processResume(req.file);
    
    if (!result.success) {
      return res.status(400).json({ 
        error: result.error,
        profile: result.profile
      });
    }

    // Validate profile
    const validation = resumeService.validateProfile(result.profile);
    
    if (!validation.isValid) {
      return res.status(400).json({
        error: 'Missing required fields',
        missing: validation.missing,
        profile: result.profile
      });
    }

    // Check if candidate already exists
    const existingCandidate = await Candidate.findOne({ 
      email: result.profile.email 
    });
    
    if (existingCandidate) {
      return res.status(409).json({ 
        error: 'Candidate with this email already exists',
        candidate: existingCandidate
      });
    }

    // Create new candidate
    const candidate = new Candidate({
      name: result.profile.name,
      email: result.profile.email,
      phone: result.profile.phone,
      resumeUrl: `uploads/${req.file.filename}`, // In production, store in cloud storage
      profileData: {
        extractedFields: result.profile,
        missingFields: validation.missing,
        isComplete: validation.isValid,
        extractedBy: result.profile.extractedBy,
        confidence: result.profile.confidence
      }
    });

    await candidate.save();

    res.status(201).json({
      candidate,
      message: 'Candidate created from resume successfully'
    });

  } catch (error) {
    console.error('Create candidate error:', error);
    res.status(500).json({ 
      error: 'Failed to create candidate',
      details: error.message 
    });
  }
});

// Validate profile data
router.post('/validate-profile', (req, res) => {
  try {
    const { profile } = req.body;
    
    if (!profile) {
      return res.status(400).json({ error: 'Profile data is required' });
    }

    const validation = resumeService.validateProfile(profile);
    
    res.json({
      validation,
      profile: validation.profile
    });

  } catch (error) {
    console.error('Validation error:', error);
    res.status(500).json({ 
      error: 'Failed to validate profile',
      details: error.message 
    });
  }
});

// Get supported file types
router.get('/supported-types', (req, res) => {
  res.json({
    supportedTypes: [
      {
        type: 'application/pdf',
        extension: '.pdf',
        name: 'PDF Document'
      },
      {
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        extension: '.docx',
        name: 'Word Document'
      }
    ],
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024,
    maxFileSizeMB: Math.round((parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024) / (1024 * 1024))
  });
});

// Error handling middleware for multer
router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ 
        error: 'File too large',
        maxSize: process.env.MAX_FILE_SIZE || '10MB'
      });
    }
  }
  
  if (error.message === 'Invalid file type. Only PDF and DOCX files are allowed.') {
    return res.status(400).json({ 
      error: 'Invalid file type',
      supportedTypes: ['PDF', 'DOCX']
    });
  }
  
  next(error);
});

module.exports = router;

const express = require('express');
const router = express.Router();
const googleMeetService = require('../services/googleMeetService');
const Interview = require('../models/Interview');
const Candidate = require('../models/Candidate');

// Create a new meeting
router.post('/create', async (req, res) => {
  try {
    const { 
      candidateId, 
      interviewerEmail, 
      startTime, 
      duration = 60,
      interviewType = 'video'
    } = req.body;

    // Get candidate details
    const candidate = await Candidate.findById(candidateId);
    if (!candidate) {
      return res.status(404).json({ error: 'Candidate not found' });
    }

    // Create Google Meet
    const meetingDetails = {
      candidateName: candidate.name,
      candidateEmail: candidate.email,
      interviewerEmail,
      startTime: new Date(startTime).toISOString(),
      duration
    };

    const meeting = await googleMeetService.createMeeting(meetingDetails);

    // Update candidate with meeting info
    candidate.meetingInfo = {
      meetingId: meeting.id,
      meetingUrl: meeting.meetingUrl,
      startTime: meeting.startTime,
      endTime: meeting.endTime,
      status: 'scheduled',
      interviewType
    };
    await candidate.save();

    // Create interview session
    const interview = new Interview({
      candidateId: candidate._id,
      sessionId: `meet-${meeting.id}`,
      meetingId: meeting.id,
      meetingUrl: meeting.meetingUrl,
      interviewType,
      status: 'scheduled',
      scheduledStartTime: meeting.startTime,
      scheduledEndTime: meeting.endTime
    });
    await interview.save();

    res.status(201).json({
      meeting: googleMeetService.formatMeetingData(meeting),
      interview: interview,
      candidate: candidate,
      message: 'Meeting created successfully'
    });

  } catch (error) {
    console.error('Error creating meeting:', error);
    res.status(500).json({ 
      error: 'Failed to create meeting',
      details: error.message 
    });
  }
});

// Get meeting details
router.get('/:meetingId', async (req, res) => {
  try {
    const { meetingId } = req.params;
    
    const meeting = await googleMeetService.getMeetingDetails(meetingId);
    
    res.json(googleMeetService.formatMeetingData(meeting));
  } catch (error) {
    console.error('Error getting meeting details:', error);
    res.status(500).json({ 
      error: 'Failed to get meeting details',
      details: error.message 
    });
  }
});

// Update meeting
router.put('/:meetingId', async (req, res) => {
  try {
    const { meetingId } = req.params;
    const updates = req.body;
    
    const updatedMeeting = await googleMeetService.updateMeeting(meetingId, updates);
    
    res.json(googleMeetService.formatMeetingData(updatedMeeting));
  } catch (error) {
    console.error('Error updating meeting:', error);
    res.status(500).json({ 
      error: 'Failed to update meeting',
      details: error.message 
    });
  }
});

// Cancel meeting
router.delete('/:meetingId', async (req, res) => {
  try {
    const { meetingId } = req.params;
    
    await googleMeetService.cancelMeeting(meetingId);
    
    // Update candidate and interview status
    await Candidate.updateOne(
      { 'meetingInfo.meetingId': meetingId },
      { 'meetingInfo.status': 'cancelled' }
    );
    
    await Interview.updateOne(
      { meetingId: meetingId },
      { status: 'cancelled' }
    );
    
    res.json({ message: 'Meeting cancelled successfully' });
  } catch (error) {
    console.error('Error cancelling meeting:', error);
    res.status(500).json({ 
      error: 'Failed to cancel meeting',
      details: error.message 
    });
  }
});

// List upcoming meetings
router.get('/', async (req, res) => {
  try {
    const { maxResults = 10 } = req.query;
    
    const meetings = await googleMeetService.listUpcomingMeetings(parseInt(maxResults));
    
    res.json(meetings.map(meeting => googleMeetService.formatMeetingData(meeting)));
  } catch (error) {
    console.error('Error listing meetings:', error);
    res.status(500).json({ 
      error: 'Failed to list meetings',
      details: error.message 
    });
  }
});

// Generate meeting link (for quick meetings)
router.post('/generate-link', async (req, res) => {
  try {
    const meeting = await googleMeetService.generateMeetingLink();
    
    res.json(meeting);
  } catch (error) {
    console.error('Error generating meeting link:', error);
    res.status(500).json({ 
      error: 'Failed to generate meeting link',
      details: error.message 
    });
  }
});

// Start meeting (update status)
router.post('/:meetingId/start', async (req, res) => {
  try {
    const { meetingId } = req.params;
    
    // Update interview status
    await Interview.updateOne(
      { meetingId: meetingId },
      { 
        status: 'active',
        startedAt: new Date()
      }
    );
    
    // Update candidate meeting status
    await Candidate.updateOne(
      { 'meetingInfo.meetingId': meetingId },
      { 'meetingInfo.status': 'active' }
    );
    
    // Emit real-time update
    const io = req.app.get('io');
    io.emit('meeting-started', { meetingId });
    
    res.json({ message: 'Meeting started successfully' });
  } catch (error) {
    console.error('Error starting meeting:', error);
    res.status(500).json({ 
      error: 'Failed to start meeting',
      details: error.message 
    });
  }
});

// End meeting
router.post('/:meetingId/end', async (req, res) => {
  try {
    const { meetingId } = req.params;
    const { duration, participants, notes } = req.body;
    
    // Update interview status
    await Interview.updateOne(
      { meetingId: meetingId },
      { 
        status: 'completed',
        completedAt: new Date(),
        meetingDuration: duration,
        meetingParticipants: participants,
        meetingNotes: notes
      }
    );
    
    // Update candidate meeting status
    await Candidate.updateOne(
      { 'meetingInfo.meetingId': meetingId },
      { 'meetingInfo.status': 'completed' }
    );
    
    // Emit real-time update
    const io = req.app.get('io');
    io.emit('meeting-ended', { meetingId, duration, participants });
    
    res.json({ message: 'Meeting ended successfully' });
  } catch (error) {
    console.error('Error ending meeting:', error);
    res.status(500).json({ 
      error: 'Failed to end meeting',
      details: error.message 
    });
  }
});

// Get meeting analytics
router.get('/:meetingId/analytics', async (req, res) => {
  try {
    const { meetingId } = req.params;
    
    const analytics = await googleMeetService.getMeetingAnalytics(meetingId);
    
    res.json(analytics);
  } catch (error) {
    console.error('Error getting meeting analytics:', error);
    res.status(500).json({ 
      error: 'Failed to get meeting analytics',
      details: error.message 
    });
  }
});

// Join meeting (get meeting URL)
router.get('/:meetingId/join', async (req, res) => {
  try {
    const { meetingId } = req.params;
    const { userType } = req.query; // 'candidate' or 'interviewer'
    
    const meeting = await googleMeetService.getMeetingDetails(meetingId);
    
    res.json({
      meetingUrl: meeting.meetingUrl,
      meetingId: meeting.id,
      userType,
      joinTime: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error joining meeting:', error);
    res.status(500).json({ 
      error: 'Failed to join meeting',
      details: error.message 
    });
  }
});

module.exports = router;

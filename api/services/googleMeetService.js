const { google } = require('googleapis');
const { JWT } = require('google-auth-library');

class GoogleMeetService {
  constructor() {
    this.apiKey = process.env.GOOGLE_MEET_API_KEY || 'AIzaSyB6bAQw2psKxRrHXpDJly9jbV2dv6Oxitk';
    this.serviceAccountEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
    this.privateKey = process.env.GOOGLE_PRIVATE_KEY;
    this.calendarId = process.env.GOOGLE_CALENDAR_ID || 'primary';
    
    this.auth = null;
    this.calendar = null;
    this.meet = null;
    
    this.initializeAuth();
  }

  async initializeAuth() {
    try {
      if (this.serviceAccountEmail && this.privateKey) {
        // Service account authentication
        this.auth = new JWT({
          email: this.serviceAccountEmail,
          key: this.privateKey,
          scopes: [
            'https://www.googleapis.com/auth/calendar',
            'https://www.googleapis.com/auth/meet.space.created'
          ]
        });
      } else {
        // API key authentication (limited functionality)
        this.auth = this.apiKey;
        console.warn('⚠️  Using API key authentication. Some features may be limited.');
      }

      this.calendar = google.calendar({ version: 'v3', auth: this.auth });
      this.meet = google.meet({ version: 'v2', auth: this.auth });
      
      console.log('✅ Google Meet service initialized');
    } catch (error) {
      console.error('❌ Failed to initialize Google Meet service:', error);
    }
  }

  async createMeeting(interviewDetails) {
    try {
      const { candidateName, candidateEmail, interviewerEmail, startTime, duration = 60 } = interviewDetails;
      
      const event = {
        summary: `AI Interview - ${candidateName}`,
        description: `AI-powered interview session for ${candidateName}`,
        start: {
          dateTime: startTime,
          timeZone: 'UTC',
        },
        end: {
          dateTime: new Date(new Date(startTime).getTime() + duration * 60000).toISOString(),
          timeZone: 'UTC',
        },
        attendees: [
          { email: candidateEmail, displayName: candidateName },
          { email: interviewerEmail, displayName: 'Interviewer' }
        ],
        conferenceData: {
          createRequest: {
            requestId: `interview-${Date.now()}`,
            conferenceSolutionKey: {
              type: 'hangoutsMeet'
            }
          }
        },
        reminders: {
          useDefault: false,
          overrides: [
            { method: 'email', minutes: 24 * 60 },
            { method: 'popup', minutes: 10 }
          ]
        }
      };

      const response = await this.calendar.events.insert({
        calendarId: this.calendarId,
        resource: event,
        conferenceDataVersion: 1,
        sendUpdates: 'all'
      });

      const meeting = {
        id: response.data.id,
        meetingUrl: response.data.conferenceData?.entryPoints?.[0]?.uri,
        meetingId: response.data.conferenceData?.conferenceId,
        startTime: response.data.start.dateTime,
        endTime: response.data.end.dateTime,
        attendees: response.data.attendees,
        status: 'scheduled'
      };

      console.log('✅ Google Meet created:', meeting.id);
      return meeting;

    } catch (error) {
      console.error('❌ Failed to create Google Meet:', error);
      throw new Error('Failed to create meeting');
    }
  }

  async getMeetingDetails(meetingId) {
    try {
      const response = await this.calendar.events.get({
        calendarId: this.calendarId,
        eventId: meetingId
      });

      return {
        id: response.data.id,
        summary: response.data.summary,
        meetingUrl: response.data.conferenceData?.entryPoints?.[0]?.uri,
        startTime: response.data.start.dateTime,
        endTime: response.data.end.dateTime,
        attendees: response.data.attendees,
        status: response.data.status
      };
    } catch (error) {
      console.error('❌ Failed to get meeting details:', error);
      throw new Error('Failed to get meeting details');
    }
  }

  async updateMeeting(meetingId, updates) {
    try {
      const response = await this.calendar.events.patch({
        calendarId: this.calendarId,
        eventId: meetingId,
        resource: updates,
        sendUpdates: 'all'
      });

      return response.data;
    } catch (error) {
      console.error('❌ Failed to update meeting:', error);
      throw new Error('Failed to update meeting');
    }
  }

  async cancelMeeting(meetingId) {
    try {
      await this.calendar.events.delete({
        calendarId: this.calendarId,
        eventId: meetingId,
        sendUpdates: 'all'
      });

      console.log('✅ Meeting cancelled:', meetingId);
      return { success: true };
    } catch (error) {
      console.error('❌ Failed to cancel meeting:', error);
      throw new Error('Failed to cancel meeting');
    }
  }

  async listUpcomingMeetings(maxResults = 10) {
    try {
      const response = await this.calendar.events.list({
        calendarId: this.calendarId,
        timeMin: new Date().toISOString(),
        maxResults: maxResults,
        singleEvents: true,
        orderBy: 'startTime'
      });

      return response.data.items.map(event => ({
        id: event.id,
        summary: event.summary,
        meetingUrl: event.conferenceData?.entryPoints?.[0]?.uri,
        startTime: event.start.dateTime,
        endTime: event.end.dateTime,
        attendees: event.attendees,
        status: event.status
      }));
    } catch (error) {
      console.error('❌ Failed to list meetings:', error);
      throw new Error('Failed to list meetings');
    }
  }

  async generateMeetingLink() {
    try {
      // Generate a simple meeting link (for demo purposes)
      const meetingId = `interview-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const meetingUrl = `https://meet.google.com/${meetingId}`;
      
      return {
        meetingId,
        meetingUrl,
        status: 'ready'
      };
    } catch (error) {
      console.error('❌ Failed to generate meeting link:', error);
      throw new Error('Failed to generate meeting link');
    }
  }

  async getMeetingAnalytics(meetingId) {
    try {
      // This would require Google Meet API v2 which has limited availability
      // For now, return mock analytics
      return {
        meetingId,
        duration: 0,
        participants: [],
        recordingUrl: null,
        transcript: null,
        analytics: {
          engagement: 0,
          speakingTime: {},
          attentionScore: 0
        }
      };
    } catch (error) {
      console.error('❌ Failed to get meeting analytics:', error);
      return null;
    }
  }

  // Helper method to format meeting data
  formatMeetingData(meeting) {
    return {
      id: meeting.id,
      title: meeting.summary,
      url: meeting.meetingUrl,
      startTime: meeting.startTime,
      endTime: meeting.endTime,
      attendees: meeting.attendees?.map(attendee => ({
        email: attendee.email,
        name: attendee.displayName,
        response: attendee.responseStatus
      })) || [],
      status: meeting.status
    };
  }
}

module.exports = new GoogleMeetService();

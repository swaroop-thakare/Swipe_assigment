const API_BASE_URL = import.meta.env.VITE_API_URL || 
  (import.meta.env.PROD 
    ? 'https://backend-bwykd35u1-swaroop-thakares-projects.vercel.app/api'
    : 'http://localhost:5005/api');

class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // Candidate endpoints
  async getCandidates(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/candidates${queryString ? `?${queryString}` : ''}`);
  }

  async getCandidate(id) {
    return this.request(`/candidates/${id}`);
  }

  async createCandidate(candidateData) {
    return this.request('/candidates', {
      method: 'POST',
      body: JSON.stringify(candidateData),
    });
  }

  async updateCandidateProfile(id, profileData) {
    return this.request(`/candidates/${id}/profile`, {
      method: 'PUT',
      body: JSON.stringify(profileData),
    });
  }

  async startInterview(candidateId) {
    return this.request(`/candidates/${candidateId}/start-interview`, {
      method: 'POST',
    });
  }

  async resumeInterview(candidateId) {
    return this.request(`/candidates/${candidateId}/resume-interview`, {
      method: 'POST',
    });
  }

  async pauseInterview(candidateId) {
    return this.request(`/candidates/${candidateId}/pause-interview`, {
      method: 'POST',
    });
  }

  async deleteCandidate(id) {
    return this.request(`/candidates/${id}`, {
      method: 'DELETE',
    });
  }

  // Interview endpoints
  async getInterview(id) {
    return this.request(`/interviews/${id}`);
  }

  async getCurrentQuestion(interviewId) {
    return this.request(`/interviews/${interviewId}/current-question`);
  }

  async startTimer(interviewId) {
    return this.request(`/interviews/${interviewId}/start-timer`, {
      method: 'POST',
    });
  }

  async submitAnswer(interviewId, answerData) {
    return this.request(`/interviews/${interviewId}/submit-answer`, {
      method: 'POST',
      body: JSON.stringify(answerData),
    });
  }

  async getInterviewProgress(interviewId) {
    return this.request(`/interviews/${interviewId}/progress`);
  }

  async getInterviewHistory(interviewId) {
    return this.request(`/interviews/${interviewId}/history`);
  }

  async completeInterview(interviewId) {
    return this.request(`/interviews/${interviewId}/complete`, {
      method: 'POST',
    });
  }

  // Upload endpoints
  async uploadResume(file) {
    const formData = new FormData();
    formData.append('resume', file);

    return this.request('/upload/resume', {
      method: 'POST',
      headers: {}, // Let browser set Content-Type for FormData
      body: formData,
    });
  }

  async createCandidateFromResume(file) {
    const formData = new FormData();
    formData.append('resume', file);

    return this.request('/upload/create-candidate', {
      method: 'POST',
      headers: {},
      body: formData,
    });
  }

  async validateProfile(profile) {
    return this.request('/upload/validate-profile', {
      method: 'POST',
      body: JSON.stringify({ profile }),
    });
  }

  async getSupportedFileTypes() {
    return this.request('/upload/supported-types');
  }

  // AI endpoints
  async generateQuestions(role = 'full-stack developer', difficulty = 'mixed') {
    return this.request('/ai/generate-questions', {
      method: 'POST',
      body: JSON.stringify({ role, difficulty }),
    });
  }

  async scoreAnswer(question, answer, timeSpent) {
    return this.request('/ai/score-answer', {
      method: 'POST',
      body: JSON.stringify({ question, answer, timeSpent }),
    });
  }

  async generateSummary(candidate, questions, answers, scores) {
    return this.request('/ai/generate-summary', {
      method: 'POST',
      body: JSON.stringify({ candidate, questions, answers, scores }),
    });
  }

  async extractProfile(resumeText) {
    return this.request('/ai/extract-profile', {
      method: 'POST',
      body: JSON.stringify({ resumeText }),
    });
  }

  async getAIStatus() {
    return this.request('/ai/status');
  }

  async testAI() {
    return this.request('/ai/test');
  }

  // Meeting endpoints
  async createMeeting(meetingData) {
    return this.request('/meetings/create', {
      method: 'POST',
      body: JSON.stringify(meetingData),
    });
  }

  async getMeetingDetails(meetingId) {
    return this.request(`/meetings/${meetingId}`);
  }

  async updateMeeting(meetingId, updates) {
    return this.request(`/meetings/${meetingId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async cancelMeeting(meetingId) {
    return this.request(`/meetings/${meetingId}`, {
      method: 'DELETE',
    });
  }

  async listMeetings(maxResults = 10) {
    return this.request(`/meetings?maxResults=${maxResults}`);
  }

  async generateMeetingLink() {
    return this.request('/meetings/generate-link', {
      method: 'POST',
    });
  }

  async startMeeting(meetingId) {
    return this.request(`/meetings/${meetingId}/start`, {
      method: 'POST',
    });
  }

  async endMeeting(meetingId, data) {
    return this.request(`/meetings/${meetingId}/end`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getMeetingAnalytics(meetingId) {
    return this.request(`/meetings/${meetingId}/analytics`);
  }

  async joinMeeting(meetingId, userType) {
    return this.request(`/meetings/${meetingId}/join?userType=${userType}`);
  }

  // Session-based interview methods
  async startInterviewSession(candidateId) {
    return this.request('/interviews/start-interview', {
      method: 'POST',
      body: JSON.stringify({ candidateId }),
    });
  }

  async getNextQuestion(sessionId, previousAnswer, questionNumber) {
    return this.request('/interviews/next-question', {
      method: 'POST',
      body: JSON.stringify({
        sessionId,
        previousAnswer,
        questionNumber
      }),
    });
  }

  async evaluateInterview(sessionId) {
    return this.request('/interviews/evaluate', {
      method: 'POST',
      body: JSON.stringify({ sessionId }),
    });
  }

  // Health check
  async getHealth() {
    return this.request('/health');
  }
}

export default new ApiService();

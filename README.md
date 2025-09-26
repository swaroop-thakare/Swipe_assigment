# 🚀 AI Interview Platform - Full Stack

A comprehensive AI-powered interview platform with React frontend, Node.js backend, and real-time video interview capabilities via Google Meet integration.

## ✨ Features

### 🎯 Core Functionality
- **Resume Upload & AI Extraction**: Upload PDF/DOCX resumes with automatic profile extraction
- **AI-Powered Interviews**: Dynamic question generation and intelligent scoring
- **Video Interviews**: Google Meet integration for live video interviews
- **Real-time Chat**: Interactive chatbot-style interview experience
- **Recruiter Dashboard**: Comprehensive candidate management and analytics
- **Session Persistence**: Resume interviews after page refresh

### 🎨 Modern UI/UX
- **Glass Morphism Design**: Beautiful frosted glass effects
- **Smooth Animations**: CSS animations and micro-interactions
- **Responsive Design**: Perfect on mobile, tablet, and desktop
- **Real-time Updates**: WebSocket integration for live updates
- **Progressive Enhancement**: Works offline with local storage

## 🛠️ Tech Stack

### Frontend
- **React 18** + Vite for fast development
- **Redux Toolkit** + Redux Persist for state management
- **Ant Design** for beautiful, responsive UI components
- **Socket.io Client** for real-time communication
- **PDF.js** + Mammoth for resume parsing

### Backend
- **Node.js** + Express for API server
- **MongoDB** + Mongoose for database
- **Socket.io** for real-time communication
- **OpenAI API** for AI question generation and scoring
- **Google Meet API** for video interviews
- **Multer** for file uploads

### AI Integration
- **OpenAI GPT-4** for dynamic question generation
- **Intelligent Scoring** based on answer quality and time management
- **AI-generated Summaries** for candidate evaluation
- **Smart Profile Extraction** from resumes

## 🚀 Quick Start

### Prerequisites
- **Node.js 16+**
- **MongoDB** (local or cloud)
- **OpenAI API Key** (for AI features)
- **Google Meet API Key** (for video interviews)

### Installation

1. **Clone the repository:**
```bash
git clone https://github.com/swaroop-thakare/Swipe_assigment.git
cd Swipe_assigment
```

2. **Install dependencies:**
```bash
# Install frontend dependencies
npm install

# Install backend dependencies
cd backend
npm install
cd ..
```

3. **Configure environment:**
```bash
# Copy environment template
cp backend/env.example backend/.env

# Edit backend/.env and add your API keys
# OPENAI_API_KEY=your_openai_api_key_here
# GOOGLE_MEET_API_KEY=your_google_meet_api_key_here
```

4. **Start MongoDB:**
```bash
# macOS with Homebrew
brew services start mongodb-community

# Or start manually
mongod --config /usr/local/etc/mongod.conf
```

5. **Start the application:**
```bash
# Option 1: Use the startup script (recommended)
./start.sh

# Option 2: Start manually
# Terminal 1 - Backend
cd backend && npm run dev

# Terminal 2 - Frontend  
npm run dev
```

6. **Access the application:**
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5001
- **API Health**: http://localhost:5001/api/health

## 📁 Project Structure

```
ai-interview-platform/
├── frontend/ (React App)
│   ├── src/
│   │   ├── main.jsx                 # App entry point
│   │   ├── App.jsx                  # Main app component
│   │   ├── store.js                 # Redux store configuration
│   │   ├── services/
│   │   │   ├── api.js               # API service layer
│   │   │   └── websocket.js         # WebSocket service
│   │   ├── features/
│   │   │   └── candidatesSlice.js   # Redux slice for candidate management
│   │   ├── components/
│   │   │   ├── ResumeUploader.jsx   # Resume upload and profile extraction
│   │   │   ├── Interviewee.jsx     # Candidate interview interface
│   │   │   ├── Interviewer.jsx     # Recruiter dashboard
│   │   │   ├── ChatWindow.jsx      # Chat interface component
│   │   │   ├── Timer.jsx           # Countdown timer component
│   │   │   ├── VideoInterview.jsx  # Video interview component
│   │   │   ├── WelcomeBackModal.jsx # Session restore modal
│   │   │   └── CandidateDetailDrawer.jsx # Candidate details drawer
│   │   └── styles.css              # Global styles and custom CSS
│   ├── package.json
│   └── vite.config.js
├── backend/ (Node.js API)
│   ├── server.js                    # Main server file
│   ├── models/
│   │   ├── Candidate.js            # Candidate data model
│   │   └── Interview.js             # Interview data model
│   ├── routes/
│   │   ├── candidates.js           # Candidate API routes
│   │   ├── interviews.js           # Interview API routes
│   │   ├── upload.js               # File upload routes
│   │   ├── ai.js                   # AI service routes
│   │   ├── meetings.js             # Google Meet routes
│   │   └── auth.js                 # Authentication routes
│   ├── services/
│   │   ├── aiService.js            # OpenAI integration
│   │   ├── resumeService.js        # Resume parsing service
│   │   └── googleMeetService.js    # Google Meet integration
│   ├── package.json
│   └── .env.example
├── start.sh                        # Startup script
└── README.md
```

## 🎮 Usage

### For Candidates (Interviewee Tab)
1. **Upload Resume**: Upload a PDF or DOCX resume for automatic profile extraction
2. **Choose Interview Type**: Select between chat or video interview
3. **Start Interview**: Begin the 6-question AI-powered interview
4. **Answer Questions**: Respond to AI questions within time limits
5. **View Results**: See your final score and AI-generated summary

### For Recruiters (Interviewer Tab)
1. **View Candidates**: See all candidates with their status and scores
2. **Search & Filter**: Find specific candidates using search and filters
3. **Sort Results**: Sort by score, name, or date
4. **View Details**: Click on any candidate to see:
   - Complete profile information
   - Interview progress and results
   - Question-by-question analysis
   - Chat history with timestamps
   - AI-generated summary

## 🔧 API Endpoints

### Candidates
- `GET /api/candidates` - List all candidates
- `POST /api/candidates` - Create new candidate
- `GET /api/candidates/:id` - Get candidate details
- `PUT /api/candidates/:id/profile` - Update candidate profile

### Interviews
- `POST /api/interviews` - Start new interview
- `GET /api/interviews/:id` - Get interview details
- `POST /api/interviews/:id/submit-answer` - Submit answer
- `GET /api/interviews/:id/progress` - Get interview progress

### Meetings (Google Meet)
- `POST /api/meetings/create` - Create new meeting
- `GET /api/meetings/:id` - Get meeting details
- `POST /api/meetings/:id/start` - Start meeting
- `POST /api/meetings/:id/end` - End meeting

### AI Services
- `POST /api/ai/generate-questions` - Generate interview questions
- `POST /api/ai/score-answer` - Score candidate answer
- `POST /api/ai/generate-summary` - Generate candidate summary

## 🌐 Environment Variables

```env
# Server Configuration
PORT=5001
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/ai-interview

# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_MODEL=gpt-4
OPENAI_MAX_TOKENS=1000

# Google Meet Configuration
GOOGLE_MEET_API_KEY=your_google_meet_api_key_here
GOOGLE_SERVICE_ACCOUNT_EMAIL=your_service_account_email@project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY=your_private_key_here
GOOGLE_CALENDAR_ID=primary

# CORS
FRONTEND_URL=http://localhost:3000
```

## 🚀 Deployment

### Building for Production

```bash
# Build frontend
npm run build

# Start production backend
cd backend
NODE_ENV=production npm start
```

### Docker Deployment (Optional)

```bash
# Build Docker image
docker build -t ai-interview-platform .

# Run container
docker run -p 3000:3000 -p 5001:5001 ai-interview-platform
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Ant Design** for the beautiful UI components
- **OpenAI** for the AI capabilities
- **Google Meet** for video interview integration
- **MongoDB** for data persistence
- **Socket.io** for real-time communication

## 📞 Support

For support and questions, please open an issue in the repository or contact the development team.

---

**Built with ❤️ by the AI Interview Platform Team**
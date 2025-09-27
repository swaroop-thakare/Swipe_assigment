import React, { useState, useEffect } from 'react'
import { Layout, Tabs, message, Spin, Button, Space } from 'antd'
import { UserOutlined, TrophyOutlined, LogoutOutlined } from '@ant-design/icons'
import { useSelector, useDispatch } from 'react-redux'
import Login from './components/Login'
import Interviewee from './components/Interviewee'
import Interviewer from './components/Interviewer'
import RecruiterDashboard from './components/RecruiterDashboard'
import WelcomeBackModal from './components/WelcomeBackModal'
import { fetchCandidates, setCurrentInterview, updateConnectionStatus } from './features/candidatesSlice'
import websocketService from './services/websocket'
import apiService from './services/api'

const { Header, Content } = Layout
const { TabPane } = Tabs

function App() {
  const [activeTab, setActiveTab] = useState('interviewee')
  const [initializing, setInitializing] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [user, setUser] = useState(null)
  const dispatch = useDispatch()
  const { interviewInProgress, currentInterview, loading, error, connectionStatus } = useSelector(state => state.candidates)
  const [showWelcomeBack, setShowWelcomeBack] = useState(false)

  useEffect(() => {
    initializeApp()
  }, [])

  const initializeApp = async () => {
    try {
      // Check API health
      await apiService.getHealth()
      
      // Connect WebSocket
      websocketService.connect()
      
      // Set up WebSocket listeners
      websocketService.onConnectionStatus((status) => {
        dispatch(updateConnectionStatus(status))
      })
      
      // Fetch candidates
      await dispatch(fetchCandidates()).unwrap()
      
      // Check for interrupted interviews
      checkForInterruptedInterviews()
      
    } catch (error) {
      console.error('App initialization error:', error)
      console.error('Failed to connect to server. Please check your connection.')
    } finally {
      setInitializing(false)
    }
  }

  const checkForInterruptedInterviews = async () => {
    try {
      // Look for candidates with in-progress interviews
      const response = await apiService.getCandidates({ status: 'in_progress' })
      if (response.candidates.length > 0) {
        const candidate = response.candidates[0]
        const interview = await apiService.getInterview(candidate._id)
        if (interview) {
          dispatch(setCurrentInterview(interview))
          setShowWelcomeBack(true)
        }
      }
    } catch (error) {
      console.error('Error checking for interrupted interviews:', error)
    }
  }

  const handleResumeInterview = async () => {
    try {
      if (currentInterview) {
        await apiService.resumeInterview(currentInterview.candidateId)
        setShowWelcomeBack(false)
        console.log('Interview resumed!')
      }
    } catch (error) {
      console.error('Failed to resume interview')
    }
  }

  const handleStartNewInterview = () => {
    setShowWelcomeBack(false)
    dispatch(setCurrentInterview(null))
    console.log('Starting new interview session')
  }

  const handleLogin = (userData) => {
    setUser(userData)
    setIsAuthenticated(true)
    // Use notification instead of message for better context
    console.log(`Welcome, ${userData.username}!`)
  }

  const handleLogout = () => {
    setUser(null)
    setIsAuthenticated(false)
    setActiveTab('interviewee')
    console.log('Logged out successfully')
  }

  if (initializing) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh' 
      }}>
        <div style={{ textAlign: 'center' }}>
          <Spin size="large" />
          <div style={{ marginTop: 16, fontSize: 16, color: '#666' }}>
            Initializing AI Interview Platform...
          </div>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} />
  }

  return (
    <Layout style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
      <Header style={{ 
        background: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(10px)',
        padding: '0 24px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: '1px solid rgba(255, 255, 255, 0.2)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{
            width: 40,
            height: 40,
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            borderRadius: 12,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontSize: 20,
            fontWeight: 'bold'
          }}>
            AI
          </div>
          <h1 style={{ 
            margin: 0, 
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            fontSize: '28px',
            fontWeight: '800',
            letterSpacing: '-0.5px'
          }}>
            Interview Platform
          </h1>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            padding: '8px 16px',
            background: connectionStatus === 'connected' ? '#52c41a' : '#ff4d4f',
            borderRadius: 20,
            color: 'white',
            fontSize: 12,
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: 6
          }}>
            <div style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: 'white',
              animation: connectionStatus === 'connected' ? 'pulse 2s infinite' : 'none'
            }} />
            {connectionStatus === 'connected' ? 'Connected' : 'Disconnected'}
          </div>
          
          <Space>
            <span style={{ color: '#2c3e50', fontWeight: 500 }}>
              Welcome, {user?.username}!
            </span>
            <Button
              type="text"
              icon={<LogoutOutlined />}
              onClick={handleLogout}
              style={{
                color: '#667eea',
                border: '1px solid rgba(102, 126, 234, 0.3)',
                borderRadius: 8
              }}
            >
              Logout
            </Button>
          </Space>
        </div>
      </Header>
      
      <Content style={{ 
        padding: '32px 24px',
        background: 'transparent'
      }}>
        <div style={{
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(20px)',
          borderRadius: 24,
          boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
          overflow: 'hidden',
          border: '1px solid rgba(255, 255, 255, 0.2)'
        }}>
          <Tabs 
            activeKey={activeTab} 
            onChange={setActiveTab}
            size="large"
            className="custom-tabs"
            items={[
              {
                key: 'interviewee',
                label: (
                  <span style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 8,
                    padding: '8px 0'
                  }}>
                    <UserOutlined style={{ fontSize: 18 }} />
                    Interviewee
                  </span>
                ),
                children: <Interviewee />
              },
              {
                key: 'interviewer',
                label: (
                  <span style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 8,
                    padding: '8px 0'
                  }}>
                    <TrophyOutlined style={{ fontSize: 18 }} />
                    Interviewer
                  </span>
                ),
                children: <Interviewer />
              },
              {
                key: 'recruiter',
                label: (
                  <span style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 8,
                    padding: '8px 0'
                  }}>
                    <TrophyOutlined style={{ fontSize: 18 }} />
                    Recruiter Dashboard
                  </span>
                ),
                children: <RecruiterDashboard />
              }
            ]}
          />
        </div>
      </Content>

      <WelcomeBackModal
        visible={showWelcomeBack}
        onResume={handleResumeInterview}
        onStartNew={handleStartNewInterview}
        candidateName={currentInterview?.name}
      />
    </Layout>
  )
}

export default App

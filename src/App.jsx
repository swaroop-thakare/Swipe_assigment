import React, { useState, useEffect } from 'react'
import { Layout, Tabs, message, Spin } from 'antd'
import { UserOutlined, TrophyOutlined } from '@ant-design/icons'
import { useSelector, useDispatch } from 'react-redux'
import Interviewee from './components/Interviewee'
import Interviewer from './components/Interviewer'
import WelcomeBackModal from './components/WelcomeBackModal'
import { fetchCandidates, setCurrentInterview, updateConnectionStatus } from './features/candidatesSlice'
import websocketService from './services/websocket'
import apiService from './services/api'

const { Header, Content } = Layout
const { TabPane } = Tabs

function App() {
  const [activeTab, setActiveTab] = useState('interviewee')
  const [initializing, setInitializing] = useState(true)
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
      message.error('Failed to connect to server. Please check your connection.')
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
        message.success('Interview resumed!')
      }
    } catch (error) {
      message.error('Failed to resume interview')
    }
  }

  const handleStartNewInterview = () => {
    setShowWelcomeBack(false)
    dispatch(setCurrentInterview(null))
    message.info('Starting new interview session')
  }

  if (initializing) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh' 
      }}>
        <Spin size="large" tip="Initializing AI Interview Platform..." />
      </div>
    )
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
            style={{
              '& .ant-tabs-tab': {
                padding: '16px 24px',
                fontSize: '16px',
                fontWeight: '600'
              }
            }}
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

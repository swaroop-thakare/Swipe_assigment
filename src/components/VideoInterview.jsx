import React, { useState, useEffect, useRef } from 'react'
import { 
  Card, 
  Button, 
  Typography, 
  Space, 
  Alert, 
  Spin, 
  Modal, 
  Row, 
  Col,
  Badge,
  Tooltip
} from 'antd'
import { 
  VideoCameraOutlined, 
  PhoneOutlined, 
  MicrophoneOutlined,
  AudioOutlined,
  UserOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons'
import apiService from '../services/api'
import websocketService from '../services/websocket'

const { Title, Text } = Typography

const VideoInterview = ({ candidate, interview, onInterviewComplete }) => {
  const [meeting, setMeeting] = useState(null)
  const [meetingStatus, setMeetingStatus] = useState('preparing')
  const [isConnected, setIsConnected] = useState(false)
  const [meetingDuration, setMeetingDuration] = useState(0)
  const [participants, setParticipants] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  
  const durationInterval = useRef(null)
  const meetingRef = useRef(null)

  useEffect(() => {
    initializeMeeting()
    setupWebSocketListeners()
    
    return () => {
      if (durationInterval.current) {
        clearInterval(durationInterval.current)
      }
    }
  }, [])

  const initializeMeeting = async () => {
    try {
      setLoading(true)
      
      if (interview?.meetingId) {
        // Join existing meeting
        const response = await apiService.getMeetingDetails(interview.meetingId)
        setMeeting(response)
        setMeetingStatus('ready')
      } else {
        // Create new meeting
        const response = await apiService.createMeeting({
          candidateId: candidate._id,
          interviewerEmail: 'interviewer@company.com', // This should come from user context
          startTime: new Date().toISOString(),
          duration: 60
        })
        setMeeting(response.meeting)
        setMeetingStatus('scheduled')
      }
    } catch (error) {
      console.error('Error initializing meeting:', error)
      setError('Failed to initialize video meeting')
    } finally {
      setLoading(false)
    }
  }

  const setupWebSocketListeners = () => {
    websocketService.onMeetingStarted((data) => {
      if (data.meetingId === meeting?.id) {
        setMeetingStatus('active')
        startDurationTimer()
      }
    })

    websocketService.onMeetingEnded((data) => {
      if (data.meetingId === meeting?.id) {
        setMeetingStatus('completed')
        stopDurationTimer()
        onInterviewComplete?.(data)
      }
    })
  }

  const startDurationTimer = () => {
    durationInterval.current = setInterval(() => {
      setMeetingDuration(prev => prev + 1)
    }, 1000)
  }

  const stopDurationTimer = () => {
    if (durationInterval.current) {
      clearInterval(durationInterval.current)
    }
  }

  const handleJoinMeeting = async () => {
    try {
      setLoading(true)
      
      const response = await apiService.joinMeeting(meeting.id, 'interviewer')
      
      // Open Google Meet in new tab
      window.open(response.meetingUrl, '_blank', 'width=1200,height=800')
      
      // Start the meeting
      await apiService.startMeeting(meeting.id)
      
      setMeetingStatus('active')
      setIsConnected(true)
      startDurationTimer()
      
    } catch (error) {
      console.error('Error joining meeting:', error)
      setError('Failed to join meeting')
    } finally {
      setLoading(false)
    }
  }

  const handleEndMeeting = async () => {
    try {
      setLoading(true)
      
      await apiService.endMeeting(meeting.id, {
        duration: meetingDuration,
        participants: participants,
        notes: 'Interview completed via video call'
      })
      
      setMeetingStatus('completed')
      setIsConnected(false)
      stopDurationTimer()
      
      onInterviewComplete?.({
        meetingId: meeting.id,
        duration: meetingDuration,
        participants: participants
      })
      
    } catch (error) {
      console.error('Error ending meeting:', error)
      setError('Failed to end meeting')
    } finally {
      setLoading(false)
    }
  }

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'scheduled': return <ClockCircleOutlined style={{ color: '#1890ff' }} />
      case 'active': return <VideoCameraOutlined style={{ color: '#52c41a' }} />
      case 'completed': return <CheckCircleOutlined style={{ color: '#52c41a' }} />
      default: return <ExclamationCircleOutlined style={{ color: '#faad14' }} />
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'scheduled': return 'processing'
      case 'active': return 'success'
      case 'completed': return 'success'
      default: return 'default'
    }
  }

  if (loading && !meeting) {
    return (
      <Card style={{ textAlign: 'center', padding: '40px' }}>
        <Spin size="large" />
        <div style={{ marginTop: 16 }}>
          <Text>Setting up video interview...</Text>
        </div>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <Alert
          message="Video Interview Error"
          description={error}
          type="error"
          showIcon
          action={
            <Button size="small" onClick={initializeMeeting}>
              Retry
            </Button>
          }
        />
      </Card>
    )
  }

  return (
    <Card title="Video Interview Session">
      <Row gutter={[16, 16]}>
        <Col span={24}>
          <Space direction="vertical" style={{ width: '100%' }}>
            {/* Meeting Status */}
            <div style={{ textAlign: 'center' }}>
              <Badge 
                status={getStatusColor(meetingStatus)} 
                text={
                  <Space>
                    {getStatusIcon(meetingStatus)}
                    <Text strong>
                      {meetingStatus === 'scheduled' ? 'Meeting Scheduled' :
                       meetingStatus === 'active' ? 'Meeting Active' :
                       meetingStatus === 'completed' ? 'Meeting Completed' : 'Preparing'}
                    </Text>
                  </Space>
                }
              />
            </div>

            {/* Candidate Info */}
            <Card size="small">
              <Space>
                <UserOutlined />
                <Text strong>{candidate.name}</Text>
                <Text type="secondary">({candidate.email})</Text>
              </Space>
            </Card>

            {/* Meeting Details */}
            {meeting && (
              <Card size="small" title="Meeting Details">
                <Space direction="vertical" style={{ width: '100%' }}>
                  <div>
                    <Text strong>Meeting ID: </Text>
                    <Text code>{meeting.id}</Text>
                  </div>
                  
                  {meeting.startTime && (
                    <div>
                      <Text strong>Start Time: </Text>
                      <Text>{new Date(meeting.startTime).toLocaleString()}</Text>
                    </div>
                  )}
                  
                  {meetingDuration > 0 && (
                    <div>
                      <Text strong>Duration: </Text>
                      <Text>{formatDuration(meetingDuration)}</Text>
                    </div>
                  )}
                  
                  {meeting.url && (
                    <div>
                      <Text strong>Meeting URL: </Text>
                      <Text copyable={{ text: meeting.url }}>
                        {meeting.url}
                      </Text>
                    </div>
                  )}
                </Space>
              </Card>
            )}

            {/* Action Buttons */}
            <div style={{ textAlign: 'center' }}>
              {meetingStatus === 'scheduled' && (
                <Button
                  type="primary"
                  size="large"
                  icon={<VideoCameraOutlined />}
                  onClick={handleJoinMeeting}
                  loading={loading}
                >
                  Join Video Interview
                </Button>
              )}
              
              {meetingStatus === 'active' && (
                <Space>
                  <Button
                    type="primary"
                    size="large"
                    icon={<VideoCameraOutlined />}
                    onClick={() => window.open(meeting.url, '_blank')}
                  >
                    Open Meeting
                  </Button>
                  
                  <Button
                    danger
                    size="large"
                    icon={<PhoneOutlined />}
                    onClick={handleEndMeeting}
                    loading={loading}
                  >
                    End Interview
                  </Button>
                </Space>
              )}
              
              {meetingStatus === 'completed' && (
                <Button
                  type="default"
                  size="large"
                  icon={<CheckCircleOutlined />}
                  disabled
                >
                  Interview Completed
                </Button>
              )}
            </div>

            {/* Meeting Controls */}
            {meetingStatus === 'active' && (
              <Card size="small" title="Meeting Controls">
                <Row gutter={16}>
                  <Col span={8}>
                    <Tooltip title="Toggle Camera">
                      <Button 
                        icon={<VideoCameraOutlined />} 
                        block
                        type={isConnected ? 'primary' : 'default'}
                      >
                        Camera
                      </Button>
                    </Tooltip>
                  </Col>
                  
                  <Col span={8}>
                    <Tooltip title="Toggle Microphone">
                      <Button 
                        icon={<MicrophoneOutlined />} 
                        block
                        type={isConnected ? 'primary' : 'default'}
                      >
                        Mic
                      </Button>
                    </Tooltip>
                  </Col>
                  
                  <Col span={8}>
                    <Tooltip title="Toggle Speaker">
                      <Button 
                        icon={<AudioOutlined />} 
                        block
                        type={isConnected ? 'primary' : 'default'}
                      >
                        Speaker
                      </Button>
                    </Tooltip>
                  </Col>
                </Row>
              </Card>
            )}

            {/* Instructions */}
            <Alert
              message="Video Interview Instructions"
              description={
                <div>
                  <p>• Ensure you have a stable internet connection</p>
                  <p>• Test your camera and microphone before starting</p>
                  <p>• Find a quiet, well-lit environment</p>
                  <p>• Have your resume and any relevant documents ready</p>
                  <p>• The interview will be recorded for evaluation purposes</p>
                </div>
              }
              type="info"
              showIcon
            />
          </Space>
        </Col>
      </Row>
    </Card>
  )
}

export default VideoInterview

import React, { useState, useEffect } from 'react'
import { Card, Steps, Button, Typography, Space, Progress, message, Radio, Divider } from 'antd'
import { UserOutlined, QuestionCircleOutlined, CheckCircleOutlined, VideoCameraOutlined, MessageOutlined, ClockCircleOutlined } from '@ant-design/icons'
import { useSelector, useDispatch } from 'react-redux'
import ResumeUploader from './ResumeUploader'
import ChatWindow from './ChatWindow'
import Timer from './Timer'
import VideoInterview from './VideoInterview'
import { 
  addCandidate, 
  startInterview, 
  submitAnswer, 
  completeInterview 
} from '../features/candidatesSlice'
import { generateQuestions, scoreAnswer, generateSummary } from '../utils/aiSimulator'

const { Title, Text } = Typography
const { Step } = Steps

const Interviewee = () => {
  const dispatch = useDispatch()
  const { currentInterview, interviewInProgress } = useSelector(state => state.candidates)
  
  const [currentStep, setCurrentStep] = useState(0)
  const [messages, setMessages] = useState([])
  const [currentQuestion, setCurrentQuestion] = useState(null)
  const [currentAnswer, setCurrentAnswer] = useState('')
  const [isAnswering, setIsAnswering] = useState(false)
  const [interviewComplete, setInterviewComplete] = useState(false)
  const [interviewType, setInterviewType] = useState('chat') // 'chat' or 'video'

  useEffect(() => {
    if (currentInterview && currentInterview.interviewStatus === 'in_progress') {
      setCurrentStep(2) // Skip to interview step
      loadInterviewState()
    }
  }, [currentInterview])

  const loadInterviewState = () => {
    if (!currentInterview) return

    const { questions, answers, currentQuestionIndex } = currentInterview
    
    // Load previous messages
    const loadedMessages = []
    
    // Add AI questions that were already asked
    for (let i = 0; i < currentQuestionIndex; i++) {
      if (questions[i]) {
        loadedMessages.push({
          sender: 'ai',
          text: questions[i].text,
          timestamp: new Date().toISOString(),
          metadata: {
            difficulty: questions[i].difficulty,
            timeLimit: questions[i].timeLimit
          }
        })
      }
      
      if (answers[i]) {
        loadedMessages.push({
          sender: 'candidate',
          text: answers[i].answer,
          timestamp: answers[i].submittedAt
        })
      }
    }

    setMessages(loadedMessages)

    // Set current question if not all questions are answered
    if (currentQuestionIndex < questions.length) {
      setCurrentQuestion(questions[currentQuestionIndex])
    } else {
      setInterviewComplete(true)
    }
  }

  const handleProfileExtracted = (profile) => {
    dispatch(addCandidate(profile))
    setCurrentStep(1)
    message.success('Profile created successfully!')
  }

  const handleStartInterview = () => {
    if (!currentInterview) return

    const questions = generateQuestions()
    dispatch(startInterview({ candidateId: currentInterview.id, questions }))
    
    // Start with first question
    const firstQuestion = questions[0]
    setCurrentQuestion(firstQuestion)
    setCurrentStep(2)
    
    // Add first question to messages
    const firstMessage = {
      sender: 'ai',
      text: firstQuestion.text,
      timestamp: new Date().toISOString(),
      metadata: {
        difficulty: firstQuestion.difficulty,
        timeLimit: firstQuestion.timeLimit
      }
    }
    setMessages([firstMessage])
    setIsAnswering(true)
  }

  const handleAnswerSubmit = (answer) => {
    if (!currentInterview || !currentQuestion) return

    const questionIndex = currentInterview.currentQuestionIndex
    const timeSpent = currentQuestion.timeLimit - 0 // This would be calculated from timer
    
    // Add candidate's answer to messages
    const answerMessage = {
      sender: 'candidate',
      text: answer,
      timestamp: new Date().toISOString()
    }
    setMessages(prev => [...prev, answerMessage])

    // Submit answer
    dispatch(submitAnswer({
      candidateId: currentInterview.id,
      questionIndex,
      answer,
      timeSpent
    }))

    // Move to next question or complete interview
    const nextQuestionIndex = questionIndex + 1
    if (nextQuestionIndex < currentInterview.questions.length) {
      const nextQuestion = currentInterview.questions[nextQuestionIndex]
      setCurrentQuestion(nextQuestion)
      
      // Add next question to messages
      const nextMessage = {
        sender: 'ai',
        text: nextQuestion.text,
        timestamp: new Date().toISOString(),
        metadata: {
          difficulty: nextQuestion.difficulty,
          timeLimit: nextQuestion.timeLimit
        }
      }
      setMessages(prev => [...prev, nextMessage])
    } else {
      // Interview complete
      handleInterviewComplete()
    }
  }

  const handleTimeUp = () => {
    if (currentAnswer.trim()) {
      handleAnswerSubmit(currentAnswer)
    } else {
      handleAnswerSubmit("No answer provided (time expired)")
    }
    setCurrentAnswer('')
  }

  const handleInterviewComplete = () => {
    if (!currentInterview) return

    // Calculate scores
    const scores = currentInterview.answers.map((answer, index) => {
      const question = currentInterview.questions[index]
      return scoreAnswer(question, answer.answer, answer.timeSpent)
    })

    const averageScore = scores.reduce((sum, score) => sum + score, 0) / scores.length
    const summary = generateSummary(currentInterview, currentInterview.questions, currentInterview.answers, scores)

    dispatch(completeInterview({
      candidateId: currentInterview.id,
      finalScore: averageScore,
      aiSummary: summary
    }))

    setInterviewComplete(true)
    setCurrentStep(3)
    setIsAnswering(false)
    
    // Add completion message
    const completionMessage = {
      sender: 'ai',
      text: `Interview completed! Your final score is ${averageScore.toFixed(1)}/100. Thank you for participating!`,
      timestamp: new Date().toISOString()
    }
    setMessages(prev => [...prev, completionMessage])
  }

  const getCurrentProgress = () => {
    if (!currentInterview) return 0
    return Math.round((currentInterview.currentQuestionIndex / currentInterview.questions.length) * 100)
  }

  const steps = [
    {
      title: 'Profile Setup',
      description: 'Upload resume or enter information',
      icon: <UserOutlined />
    },
    {
      title: 'Ready to Start',
      description: 'Review and begin interview',
      icon: <QuestionCircleOutlined />
    },
    {
      title: 'Interview',
      description: 'Answer AI questions',
      icon: <QuestionCircleOutlined />
    },
    {
      title: 'Complete',
      description: 'Interview finished',
      icon: <CheckCircleOutlined />
    }
  ]

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '20px' }}>
      <Card style={{
        background: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
        borderRadius: 24
      }}>
        <div style={{ marginBottom: 32 }}>
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 12,
              padding: '16px 32px',
              background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)',
              borderRadius: 20,
              border: '1px solid rgba(102, 126, 234, 0.2)',
              marginBottom: 24
            }}>
              <div style={{
                width: 48,
                height: 48,
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                borderRadius: 16,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontSize: 24,
                fontWeight: 'bold',
                animation: 'float 3s ease-in-out infinite'
              }}>
                AI
              </div>
              <Title level={2} style={{ 
                margin: 0,
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                fontSize: '32px',
                fontWeight: '800'
              }}>
                AI-Powered Interview
              </Title>
            </div>
          </div>
          
          <Steps 
            current={currentStep} 
            items={steps}
            style={{
              '& .ant-steps-item': {
                animation: 'slideInUp 0.6s ease-out'
              }
            }}
          />
          
          {currentStep === 2 && currentInterview && (
            <div style={{ 
              marginTop: 24,
              padding: '20px',
              background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.05) 0%, rgba(118, 75, 162, 0.05) 100%)',
              borderRadius: 16,
              border: '1px solid rgba(102, 126, 234, 0.1)'
            }}>
              <Progress 
                percent={getCurrentProgress()} 
                status="active"
                strokeColor={{
                  '0%': '#667eea',
                  '100%': '#764ba2',
                }}
                format={() => (
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 8,
                    fontWeight: '600',
                    color: '#2c3e50'
                  }}>
                    <ClockCircleOutlined />
                    Question {currentInterview.currentQuestionIndex + 1} of {currentInterview.questions.length}
                  </div>
                )}
              />
            </div>
          )}
        </div>

        {currentStep === 0 && (
          <ResumeUploader 
            onProfileExtracted={handleProfileExtracted}
          />
        )}

        {currentStep === 1 && (
          <Card>
            <Title level={4}>Choose Interview Type</Title>
            
            <Radio.Group 
              value={interviewType} 
              onChange={(e) => setInterviewType(e.target.value)}
              style={{ marginBottom: 24 }}
            >
              <Space direction="vertical" size="large">
                <Radio value="chat" style={{ display: 'flex', alignItems: 'center' }}>
                  <Space>
                    <MessageOutlined style={{ fontSize: 20, color: '#1890ff' }} />
                    <div>
                      <div style={{ fontWeight: 'bold' }}>Chat Interview</div>
                      <div style={{ color: '#666', fontSize: 12 }}>
                        Text-based interview with AI questions and timers
                      </div>
                    </div>
                  </Space>
                </Radio>
                
                <Radio value="video" style={{ display: 'flex', alignItems: 'center' }}>
                  <Space>
                    <VideoCameraOutlined style={{ fontSize: 20, color: '#52c41a' }} />
                    <div>
                      <div style={{ fontWeight: 'bold' }}>Video Interview</div>
                      <div style={{ color: '#666', fontSize: 12 }}>
                        Live video interview via Google Meet with AI monitoring
                      </div>
                    </div>
                  </Space>
                </Radio>
              </Space>
            </Radio.Group>

            <Divider />

            <Text>
              You will be asked 6 questions with different difficulty levels:
              <br />• 2 Easy questions (20 seconds each)
              <br />• 2 Medium questions (60 seconds each)  
              <br />• 2 Hard questions (120 seconds each)
            </Text>
            <br /><br />
            <Button 
              type="primary" 
              size="large" 
              onClick={handleStartInterview}
              block
            >
              Start {interviewType === 'video' ? 'Video' : 'Chat'} Interview
            </Button>
          </Card>
        )}

        {currentStep === 2 && (
          <div>
            {interviewType === 'video' ? (
              <VideoInterview
                candidate={currentInterview}
                interview={currentInterview}
                onInterviewComplete={handleInterviewComplete}
              />
            ) : (
              <div>
                {currentQuestion && (
                  <Timer
                    timeLimit={currentQuestion.timeLimit}
                    onTimeUp={handleTimeUp}
                    isActive={isAnswering}
                  />
                )}
                
                <ChatWindow
                  messages={messages}
                  onSendMessage={(message) => {
                    setCurrentAnswer(message)
                    handleAnswerSubmit(message)
                  }}
                  disabled={!isAnswering}
                  placeholder="Type your answer here..."
                />
              </div>
            )}
          </div>
        )}

        {currentStep === 3 && (
          <Card style={{ textAlign: 'center' }}>
            <CheckCircleOutlined style={{ fontSize: 48, color: '#52c41a', marginBottom: 16 }} />
            <Title level={3}>Interview Complete!</Title>
            <Text>
              Thank you for completing the interview. Your responses have been evaluated.
            </Text>
            <br /><br />
            <Button 
              type="primary" 
              onClick={() => window.location.reload()}
            >
              Start New Interview
            </Button>
          </Card>
        )}
      </Card>
    </div>
  )
}

export default Interviewee

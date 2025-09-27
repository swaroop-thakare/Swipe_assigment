import React, { useState, useEffect, useRef } from 'react'
import { Card, Button, Typography, Progress, Space, message, Modal, Result } from 'antd'
import { ClockCircleOutlined, CheckCircleOutlined, RobotOutlined, UserOutlined } from '@ant-design/icons'
import { useSelector, useDispatch } from 'react-redux'
import apiService from '../services/api'

const { Title, Text } = Typography

const SessionInterview = ({ candidate, onComplete }) => {
  const dispatch = useDispatch()
  const { currentCandidate } = useSelector(state => state.candidates)
  
  // Session state
  const [sessionId, setSessionId] = useState(null)
  const [currentQuestion, setCurrentQuestion] = useState(null)
  const [questionNumber, setQuestionNumber] = useState(0)
  const [totalQuestions, setTotalQuestions] = useState(6)
  const [isComplete, setIsComplete] = useState(false)
  
  // Timer state
  const [timeLeft, setTimeLeft] = useState(0)
  const [isTimerActive, setIsTimerActive] = useState(false)
  const [timeSpent, setTimeSpent] = useState(0)
  
  // Answer state
  const [currentAnswer, setCurrentAnswer] = useState('')
  const [answers, setAnswers] = useState([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // Evaluation state
  const [evaluation, setEvaluation] = useState(null)
  const [showResults, setShowResults] = useState(false)
  
  // Welcome Back modal state
  const [showWelcomeBackModal, setShowWelcomeBackModal] = useState(false)
  
  // Refs
  const timerRef = useRef(null)
  const startTimeRef = useRef(null)
  
  // Load session from localStorage on mount
  useEffect(() => {
    const savedSession = localStorage.getItem('interviewSession')
    if (savedSession) {
      try {
        const session = JSON.parse(savedSession)
        
        // Restore all session state
        setSessionId(session.sessionId)
        setQuestionNumber(session.questionNumber || 0)
        setTotalQuestions(session.totalQuestions || 6)
        setAnswers(session.answers || [])
        setCurrentQuestion(session.currentQuestion)
        setTimeLeft(session.timeLeft || 0)
        setIsTimerActive(session.isTimerActive || false)
        setTimeSpent(session.timeSpent || 0)
        setIsComplete(session.isComplete || false)
        
        console.log('🔄 Session loaded from localStorage:', {
          sessionId: session.sessionId,
          questionNumber: session.questionNumber,
          answersCount: session.answers?.length || 0,
          candidateName: session.candidateName
        })
        
        // Show welcome back modal if session exists
        setShowWelcomeBackModal(true)
      } catch (error) {
        console.error('Error loading saved session:', error)
        localStorage.removeItem('interviewSession')
      }
    }
  }, [])

  // Auto-save session every 10 seconds
  useEffect(() => {
    if (sessionId) {
      const interval = setInterval(() => {
        saveSession()
      }, 10000) // Save every 10 seconds
      
      return () => clearInterval(interval)
    }
  }, [sessionId, questionNumber, answers, currentQuestion, timeLeft, isTimerActive, timeSpent, isComplete])
  
  // Save session to localStorage
  const saveSession = () => {
    const session = {
      sessionId,
      questionNumber,
      totalQuestions,
      answers,
      currentQuestion,
      timeLeft,
      isTimerActive,
      timeSpent,
      isComplete,
      timestamp: Date.now(),
      candidateId: candidate?._id,
      candidateName: candidate?.name
    }
    localStorage.setItem('interviewSession', JSON.stringify(session))
    console.log('💾 Session saved to localStorage')
  }
  
  // Clear session from localStorage
  const clearSession = () => {
    localStorage.removeItem('interviewSession')
  }
  
  // Timer functions
  const startTimer = (timeLimit) => {
    setTimeLeft(timeLimit)
    setIsTimerActive(true)
    startTimeRef.current = Date.now()
    
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          handleTimeUp()
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }
  
  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
    setIsTimerActive(false)
    
    if (startTimeRef.current) {
      setTimeSpent(Math.floor((Date.now() - startTimeRef.current) / 1000))
    }
  }
  
  const handleTimeUp = () => {
    stopTimer()
    if (currentAnswer.trim()) {
      handleSubmitAnswer(currentAnswer, true) // auto-submitted
    } else {
      handleSubmitAnswer("No answer provided (time expired)", true)
    }
  }
  
  // Start interview session
  const startInterview = async () => {
    try {
      setIsSubmitting(true)
      const response = await apiService.startInterviewSession(currentCandidate._id || currentCandidate.id)
      
      setSessionId(response.sessionId)
      setCurrentQuestion(response.currentQuestion)
      setTotalQuestions(response.totalQuestions)
      setQuestionNumber(1)
      
      // Start timer for first question
      startTimer(response.currentQuestion.timeLimit)
      
      console.log('Interview started successfully!')
    } catch (error) {
      console.error('Error starting interview:', error)
      console.error('Failed to start interview')
    } finally {
      setIsSubmitting(false)
    }
  }
  
  // Resume interview session
  const resumeInterview = async () => {
    try {
      // Get next question from saved session
      const response = await apiService.getNextQuestion(
        sessionId, 
        answers[answers.length - 1]?.answer || '', 
        questionNumber
      )
      
      if (response.isComplete) {
        handleInterviewComplete()
        return
      }
      
      setCurrentQuestion(response.currentQuestion)
      setQuestionNumber(response.progress.current)
      
      // Start timer for current question
      startTimer(response.currentQuestion.timeLimit)
      
      console.log('Interview resumed successfully!')
    } catch (error) {
      console.error('Error resuming interview:', error)
      console.error('Failed to resume interview')
    }
  }
  
  // Submit answer
  const handleSubmitAnswer = async (answer, autoSubmitted = false) => {
    if (!sessionId || !currentQuestion) return
    
    try {
      setIsSubmitting(true)
      stopTimer()
      
      const timeSpentValue = timeSpent || (currentQuestion.timeLimit - timeLeft)
      
      const newAnswer = {
        questionNumber,
        answer,
        timeSpent: timeSpentValue,
        autoSubmitted,
        submittedAt: new Date().toISOString()
      }
      
      // Score the answer using AI
      try {
        const scoringResponse = await apiService.scoreAnswer(
          currentQuestion,
          answer,
          timeSpentValue
        )
        newAnswer.score = scoringResponse.score
        newAnswer.feedback = scoringResponse.feedback
        newAnswer.strengths = scoringResponse.strengths
        newAnswer.improvements = scoringResponse.improvements
      } catch (scoringError) {
        console.warn('AI scoring failed, using fallback:', scoringError)
        // Fallback scoring
        newAnswer.score = Math.min(100, Math.max(0, 
          50 + (answer.length > 50 ? 20 : 10) + 
          (timeSpentValue / currentQuestion.timeLimit > 0.7 ? 15 : 5) +
          Math.random() * 20
        ))
        newAnswer.feedback = `Answer shows ${answer.length > 50 ? 'good' : 'limited'} detail. Time management was ${timeSpentValue / currentQuestion.timeLimit > 0.7 ? 'effective' : 'could be improved'}.`
      }
      
      setAnswers(prev => [...prev, newAnswer])
      setCurrentAnswer('')
      setTimeSpent(0)
      
      // Get next question
      const response = await apiService.getNextQuestion(
        sessionId,
        answer,
        questionNumber
      )
      
      if (response.isComplete) {
        handleInterviewComplete()
        return
      }
      
      setCurrentQuestion(response.currentQuestion)
      setQuestionNumber(response.progress.current)
      
      // Start timer for next question
      startTimer(response.currentQuestion.timeLimit)
      
      // Save session
      saveSession()
      
    } catch (error) {
      console.error('Error submitting answer:', error)
      console.error('Failed to submit answer')
    } finally {
      setIsSubmitting(false)
    }
  }
  
  // Complete interview
  const handleInterviewComplete = async () => {
    try {
      setIsSubmitting(true)
      const response = await apiService.evaluateInterview(sessionId)
      
      setEvaluation(response.evaluation)
      setIsComplete(true)
      setShowResults(true)
      
      // Clear session
      clearSession()
      
      console.log('Interview completed successfully!')
    } catch (error) {
      console.error('Error completing interview:', error)
      console.error('Failed to complete interview')
    } finally {
      setIsSubmitting(false)
    }
  }
  
  // Format time display
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }
  
  // Get progress percentage
  const getProgress = () => {
    return Math.round((questionNumber / totalQuestions) * 100)
  }
  
  // Resume modal state
  const [showResumeModal, setShowResumeModal] = useState(false)
  
  if (!currentCandidate) {
    return (
      <Card>
        <Result
          status="error"
          title="No Candidate Found"
          subTitle="Please complete your profile setup first"
        />
      </Card>
    )
  }
  
  if (showResults && evaluation) {
    return (
      <Card>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <CheckCircleOutlined style={{ fontSize: 64, color: '#52c41a', marginBottom: 16 }} />
          <Title level={2}>Interview Complete!</Title>
          <Text type="secondary">Thank you for completing the interview</Text>
        </div>
        
        <Card style={{ marginBottom: 24 }}>
          <Title level={4}>Your Results</Title>
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            <div>
              <Text strong>Overall Score: </Text>
              <Text style={{ fontSize: 24, color: '#1890ff' }}>{evaluation.score}/100</Text>
            </div>
            <div>
              <Text strong>Performance Level: </Text>
              <Text style={{ fontSize: 18 }}>{evaluation.performanceLevel}</Text>
            </div>
            <div>
              <Text strong>Recommendation: </Text>
              <Text style={{ fontSize: 16 }}>{evaluation.recommendation}</Text>
            </div>
          </Space>
        </Card>
        
        <Card style={{ marginBottom: 24 }}>
          <Title level={4}>Question-by-Question Breakdown</Title>
          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            {answers.map((answer, index) => (
              <div key={index} style={{ 
                padding: 16, 
                border: '1px solid #f0f0f0', 
                borderRadius: 8,
                backgroundColor: '#fafafa'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <Text strong>Question {index + 1}</Text>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Progress
                      type="circle"
                      size={40}
                      percent={answer.score || 0}
                      strokeColor={answer.score >= 80 ? '#52c41a' : answer.score >= 60 ? '#1890ff' : answer.score >= 40 ? '#faad14' : '#ff4d4f'}
                    />
                    <Text strong style={{ fontSize: 16 }}>
                      {answer.score || 0}/100
                    </Text>
                  </div>
                </div>
                <div style={{ marginBottom: 8 }}>
                  <Text type="secondary">Your Answer: </Text>
                  <Text>{answer.answer}</Text>
                </div>
                {answer.feedback && (
                  <div style={{ marginBottom: 8 }}>
                    <Text type="secondary">AI Feedback: </Text>
                    <Text>{answer.feedback}</Text>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#666' }}>
                  <span>Time: {answer.timeSpent}s / {currentQuestion?.timeLimit || 60}s</span>
                  <span>{answer.autoSubmitted ? 'Auto-submitted' : 'Manually submitted'}</span>
                </div>
              </div>
            ))}
          </Space>
        </Card>

        <Card style={{ marginBottom: 24 }}>
          <Title level={4}>Detailed Assessment</Title>
          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            <div>
              <Text strong>Technical Skills: </Text>
              <Text>{evaluation.technicalSkills}</Text>
            </div>
            <div>
              <Text strong>Communication: </Text>
              <Text>{evaluation.communication}</Text>
            </div>
            <div>
              <Text strong>Problem Solving: </Text>
              <Text>{evaluation.problemSolving}</Text>
            </div>
            <div>
              <Text strong>Time Management: </Text>
              <Text>{evaluation.timeManagement}</Text>
            </div>
          </Space>
        </Card>
        
        <Card style={{ marginBottom: 24 }}>
          <Title level={4}>Strengths</Title>
          <ul>
            {evaluation.strengths.map((strength, index) => (
              <li key={index}>{strength}</li>
            ))}
          </ul>
        </Card>
        
        <Card style={{ marginBottom: 24 }}>
          <Title level={4}>Areas for Development</Title>
          <ul>
            {evaluation.developmentAreas.map((area, index) => (
              <li key={index}>{area}</li>
            ))}
          </ul>
        </Card>
        
        <Card>
          <Title level={4}>Summary</Title>
          <Text>{evaluation.summary}</Text>
        </Card>
        
        <div style={{ textAlign: 'center', marginTop: 32 }}>
          <Button 
            type="primary" 
            size="large"
            onClick={() => window.location.reload()}
          >
            Start New Interview
          </Button>
        </div>
      </Card>
    )
  }
  
  if (!sessionId) {
    return (
      <Card>
        <div style={{ textAlign: 'center' }}>
          <RobotOutlined style={{ fontSize: 64, color: '#1890ff', marginBottom: 24 }} />
          <Title level={2}>Ready to Start Your Interview?</Title>
          <Text type="secondary" style={{ fontSize: 16, display: 'block', marginBottom: 32 }}>
            You will be asked 6 questions with different difficulty levels
          </Text>
          
          <Space direction="vertical" size="middle" style={{ width: '100%', marginBottom: 32 }}>
            <div>• 2 Easy questions (20 seconds each)</div>
            <div>• 2 Medium questions (60 seconds each)</div>
            <div>• 2 Hard questions (120 seconds each)</div>
          </Space>
          
          <Button 
            type="primary" 
            size="large" 
            onClick={startInterview}
            loading={isSubmitting}
            style={{ minWidth: 200 }}
          >
            Start Interview
          </Button>
        </div>
      </Card>
    )
  }
  
  if (!currentQuestion) {
    return (
      <Card>
        <div style={{ textAlign: 'center' }}>
          <Title level={3}>Loading next question...</Title>
        </div>
      </Card>
    )
  }
  
  return (
    <div>
      {/* Progress Bar */}
      <Card style={{ marginBottom: 24 }}>
        <div style={{ marginBottom: 16 }}>
          <Text strong>Question {questionNumber} of {totalQuestions}</Text>
          <Progress 
            percent={getProgress()} 
            status="active"
            strokeColor={{
              '0%': '#1890ff',
              '100%': '#52c41a',
            }}
          />
        </div>
      </Card>
      
      {/* Timer */}
      <Card style={{ marginBottom: 24 }}>
        <div style={{ textAlign: 'center' }}>
          <ClockCircleOutlined style={{ fontSize: 24, marginRight: 8 }} />
          <Text style={{ fontSize: 24, fontWeight: 'bold' }}>
            {formatTime(timeLeft)}
          </Text>
          <div style={{ marginTop: 8 }}>
            <Text type="secondary">
              {currentQuestion.difficulty.charAt(0).toUpperCase() + currentQuestion.difficulty.slice(1)} Question
            </Text>
          </div>
        </div>
      </Card>
      
      {/* Question */}
      <Card style={{ marginBottom: 24 }}>
        <div style={{ marginBottom: 16 }}>
          <Space>
            <RobotOutlined style={{ color: '#1890ff' }} />
            <Text strong style={{ fontSize: 16 }}>AI Interviewer</Text>
          </Space>
        </div>
        <Text style={{ fontSize: 18, lineHeight: 1.6 }}>
          {currentQuestion.text}
        </Text>
        <div style={{ marginTop: 16 }}>
          <Text type="secondary">
            Category: {currentQuestion.category}
          </Text>
        </div>
      </Card>
      
      {/* Answer Input */}
      <Card>
        <div style={{ marginBottom: 16 }}>
          <Space>
            <UserOutlined style={{ color: '#52c41a' }} />
            <Text strong style={{ fontSize: 16 }}>Your Answer</Text>
          </Space>
        </div>
        
        <textarea
          value={currentAnswer}
          onChange={(e) => setCurrentAnswer(e.target.value)}
          placeholder="Type your answer here..."
          style={{
            width: '100%',
            minHeight: 120,
            padding: 12,
            border: '1px solid #d9d9d9',
            borderRadius: 6,
            fontSize: 16,
            lineHeight: 1.5,
            resize: 'vertical'
          }}
          disabled={!isTimerActive || isSubmitting}
        />
        
        <div style={{ marginTop: 16, textAlign: 'right' }}>
          <Button
            type="primary"
            size="large"
            onClick={() => handleSubmitAnswer(currentAnswer, false)}
            disabled={!currentAnswer.trim() || !isTimerActive || isSubmitting}
            loading={isSubmitting}
          >
            Submit Answer
          </Button>
        </div>
      </Card>
      
      {/* Resume Modal */}
      <Modal
        title="Welcome Back!"
        open={showWelcomeBackModal}
        onOk={() => setShowWelcomeBackModal(false)}
        onCancel={() => setShowWelcomeBackModal(false)}
        footer={[
          <Button key="cancel" onClick={() => {
            clearSession()
            setShowWelcomeBackModal(false)
          }}>
            Start Fresh
          </Button>,
          <Button key="resume" type="primary" onClick={() => {
            resumeInterview()
            setShowWelcomeBackModal(false)
          }}>
            Resume Interview
          </Button>
        ]}
      >
        <p>We found an unfinished interview session. Would you like to resume where you left off?</p>
        <p><strong>Progress:</strong> Question {questionNumber} of {totalQuestions}</p>
      </Modal>
    </div>
  )
}

export default SessionInterview

import React, { useState, useEffect } from 'react'
import { Card, Input, Button, Typography, Space, message } from 'antd'
import { RobotOutlined, UserOutlined, CheckCircleOutlined } from '@ant-design/icons'

const { Title, Text } = Typography

const MissingDetailsChatbot = ({ profile, onComplete, onSkip }) => {
  const [messages, setMessages] = useState([])
  const [currentInput, setCurrentInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [missingFields, setMissingFields] = useState([])
  const [collectedData, setCollectedData] = useState({})
  const [currentField, setCurrentField] = useState(null)
  const [isComplete, setIsComplete] = useState(false)

  useEffect(() => {
    // Analyze profile for missing fields
    const missing = []
    if (!profile.name) missing.push('name')
    if (!profile.email) missing.push('email')
    if (!profile.phone) missing.push('phone')
    
    setMissingFields(missing)
    
    if (missing.length === 0) {
      // No missing fields, complete immediately
      setIsComplete(true)
      setTimeout(() => onComplete(profile), 1000)
      return
    }

    // Start chatbot conversation
    startConversation(missing)
  }, [profile])

  const startConversation = (missing) => {
    const welcomeMessage = {
      id: 1,
      sender: 'bot',
      text: `Hi! I'm your AI assistant. I've reviewed your resume and found some missing information. Let me help you complete your profile before we start the interview.`,
      timestamp: new Date().toISOString()
    }
    
    setMessages([welcomeMessage])
    setCurrentField(missing[0])
    askForField(missing[0])
  }

  const askForField = (field) => {
    const fieldMessages = {
      name: "What's your full name?",
      email: "What's your email address?",
      phone: "What's your phone number?"
    }

    const message = {
      id: Date.now(),
      sender: 'bot',
      text: fieldMessages[field],
      timestamp: new Date().toISOString()
    }

    setTimeout(() => {
      setMessages(prev => [...prev, message])
      setIsTyping(false)
    }, 1000)

    setIsTyping(true)
  }

  const handleSubmit = () => {
    if (!currentInput.trim()) return

    // Add user message
    const userMessage = {
      id: Date.now(),
      sender: 'user',
      text: currentInput,
      timestamp: new Date().toISOString()
    }
    setMessages(prev => [...prev, userMessage])

    // Validate and collect data
    const field = currentField
    const value = currentInput.trim()
    
    if (validateField(field, value)) {
      setCollectedData(prev => ({ ...prev, [field]: value }))
      
      // Check if we have all missing fields
      const remainingFields = missingFields.filter(f => f !== field)
      setMissingFields(remainingFields)
      
      if (remainingFields.length === 0) {
        // All fields collected
        const completeProfile = { ...profile, ...collectedData, [field]: value }
        setIsComplete(true)
        
        const successMessage = {
          id: Date.now() + 1,
          sender: 'bot',
          text: "Perfect! I have all the information I need. Let's start your interview!",
          timestamp: new Date().toISOString()
        }
        
        setTimeout(() => {
          setMessages(prev => [...prev, successMessage])
          setTimeout(() => onComplete(completeProfile), 2000)
        }, 1000)
      } else {
        // Move to next field
        setCurrentField(remainingFields[0])
        setTimeout(() => askForField(remainingFields[0]), 1000)
      }
    } else {
      // Invalid input, ask again
      const errorMessage = {
        id: Date.now() + 1,
        sender: 'bot',
        text: getValidationError(field),
        timestamp: new Date().toISOString()
      }
      
      setTimeout(() => {
        setMessages(prev => [...prev, errorMessage])
      }, 1000)
    }

    setCurrentInput('')
  }

  const validateField = (field, value) => {
    switch (field) {
      case 'name':
        return value.length >= 2 && /^[a-zA-Z\s]+$/.test(value)
      case 'email':
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
      case 'phone':
        return /^[\+]?[1-9][\d]{0,15}$/.test(value.replace(/[\s\-\(\)]/g, ''))
      default:
        return true
    }
  }

  const getValidationError = (field) => {
    switch (field) {
      case 'name':
        return "Please enter a valid name (at least 2 characters, letters only)."
      case 'email':
        return "Please enter a valid email address (e.g., john@example.com)."
      case 'phone':
        return "Please enter a valid phone number (e.g., +1234567890 or 123-456-7890)."
      default:
        return "Please enter a valid value."
    }
  }

  const handleSkip = () => {
    onSkip(profile)
  }

  if (isComplete) {
    return (
      <Card style={{ textAlign: 'center' }}>
        <CheckCircleOutlined style={{ fontSize: 48, color: '#52c41a', marginBottom: 16 }} />
        <Title level={3}>Profile Complete!</Title>
        <Text>All information collected. Starting interview...</Text>
      </Card>
    )
  }

  return (
    <Card>
      <div style={{ marginBottom: 16 }}>
        <Space>
          <RobotOutlined style={{ color: '#1890ff' }} />
          <Title level={4} style={{ margin: 0 }}>AI Assistant</Title>
        </Space>
        <Text type="secondary" style={{ display: 'block', marginTop: 4 }}>
          Let's complete your profile
        </Text>
      </div>

      {/* Chat Messages */}
      <div style={{ 
        height: 300, 
        overflowY: 'auto', 
        border: '1px solid #d9d9d9', 
        borderRadius: 8, 
        padding: 16, 
        marginBottom: 16,
        backgroundColor: '#fafafa'
      }}>
        {messages.map((msg) => (
          <div key={msg.id} style={{ 
            marginBottom: 16,
            display: 'flex',
            justifyContent: msg.sender === 'user' ? 'flex-end' : 'flex-start'
          }}>
            <div style={{
              maxWidth: '80%',
              padding: '12px 16px',
              borderRadius: 16,
              backgroundColor: msg.sender === 'user' ? '#1890ff' : '#f0f0f0',
              color: msg.sender === 'user' ? 'white' : 'black',
              position: 'relative'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: 4 }}>
                {msg.sender === 'bot' ? <RobotOutlined /> : <UserOutlined />}
                <Text style={{ 
                  marginLeft: 8, 
                  fontSize: 12, 
                  color: msg.sender === 'user' ? 'rgba(255,255,255,0.8)' : '#666'
                }}>
                  {msg.sender === 'bot' ? 'AI Assistant' : 'You'}
                </Text>
              </div>
              <Text style={{ color: msg.sender === 'user' ? 'white' : 'black' }}>
                {msg.text}
              </Text>
            </div>
          </div>
        ))}
        
        {isTyping && (
          <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
            <div style={{
              padding: '12px 16px',
              borderRadius: 16,
              backgroundColor: '#f0f0f0',
              display: 'flex',
              alignItems: 'center'
            }}>
              <RobotOutlined style={{ marginRight: 8 }} />
              <Text>AI is typing...</Text>
            </div>
          </div>
        )}
      </div>

      {/* Input Area */}
      <div style={{ display: 'flex', gap: 8 }}>
        <Input
          value={currentInput}
          onChange={(e) => setCurrentInput(e.target.value)}
          placeholder="Type your response here..."
          onPressEnter={handleSubmit}
          disabled={isTyping}
          style={{ flex: 1 }}
        />
        <Button 
          type="primary" 
          onClick={handleSubmit}
          disabled={!currentInput.trim() || isTyping}
        >
          Send
        </Button>
      </div>

      {/* Progress */}
      <div style={{ marginTop: 16, textAlign: 'center' }}>
        <Text type="secondary">
          Missing fields: {missingFields.length} remaining
        </Text>
        {missingFields.length > 0 && (
          <div style={{ marginTop: 8 }}>
            <Text type="secondary">
              Current: {currentField?.charAt(0).toUpperCase() + currentField?.slice(1)}
            </Text>
          </div>
        )}
      </div>

      {/* Skip Option */}
      <div style={{ marginTop: 16, textAlign: 'center' }}>
        <Button type="link" onClick={handleSkip}>
          Skip and use extracted data only
        </Button>
      </div>
    </Card>
  )
}

export default MissingDetailsChatbot

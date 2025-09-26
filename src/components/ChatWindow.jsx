import React, { useState, useEffect, useRef } from 'react'
import { Card, Input, Button, Avatar, Typography, Space, Tag } from 'antd'
import { UserOutlined, RobotOutlined, SendOutlined } from '@ant-design/icons'

const { TextArea } = Input
const { Text, Paragraph } = Typography

const ChatWindow = ({ messages, onSendMessage, disabled, placeholder }) => {
  const [inputValue, setInputValue] = useState('')
  const messagesEndRef = useRef(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSend = () => {
    if (inputValue.trim() && !disabled) {
      onSendMessage(inputValue.trim())
      setInputValue('')
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <Card 
      title={
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 12,
          fontSize: '18px',
          fontWeight: '700'
        }}>
          <div style={{
            width: 36,
            height: 36,
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            borderRadius: 10,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontSize: 16
          }}>
            💬
          </div>
          Interview Chat
        </div>
      }
      style={{ 
        height: '500px', 
        display: 'flex', 
        flexDirection: 'column',
        background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.02) 0%, rgba(118, 75, 162, 0.02) 100%)',
        border: '1px solid rgba(102, 126, 234, 0.1)'
      }}
      bodyStyle={{ 
        flex: 1, 
        display: 'flex', 
        flexDirection: 'column', 
        padding: 0,
        borderRadius: '0 0 16px 16px'
      }}
    >
      <div style={{ 
        flex: 1, 
        overflowY: 'auto', 
        padding: '20px',
        background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.02) 0%, rgba(118, 75, 162, 0.02) 100%)'
      }}>
        {messages.map((message, index) => (
          <div
            key={index}
            style={{
              display: 'flex',
              marginBottom: 16,
              justifyContent: message.sender === 'ai' ? 'flex-start' : 'flex-end'
            }}
          >
            <div style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 8,
              maxWidth: '80%',
              flexDirection: message.sender === 'ai' ? 'row' : 'row-reverse'
            }}>
              <Avatar 
                icon={message.sender === 'ai' ? <RobotOutlined /> : <UserOutlined />}
                style={{ 
                  backgroundColor: message.sender === 'ai' ? '#1890ff' : '#52c41a',
                  flexShrink: 0
                }}
              />
              <div style={{
                background: message.sender === 'ai' 
                  ? 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(255, 255, 255, 0.9) 100%)'
                  : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: message.sender === 'ai' ? '#2c3e50' : '#fff',
                padding: '16px 20px',
                borderRadius: '16px',
                boxShadow: message.sender === 'ai' 
                  ? '0 4px 12px rgba(0,0,0,0.1)' 
                  : '0 4px 12px rgba(102, 126, 234, 0.3)',
                maxWidth: '100%',
                border: message.sender === 'ai' 
                  ? '1px solid rgba(102, 126, 234, 0.1)' 
                  : 'none',
                backdropFilter: 'blur(10px)',
                animation: 'fadeInScale 0.3s ease-out'
              }}>
                {message.timestamp && (
                  <Text 
                    style={{ 
                      fontSize: 12, 
                      opacity: 0.7,
                      color: message.sender === 'ai' ? '#666' : '#fff'
                    }}
                  >
                    {new Date(message.timestamp).toLocaleTimeString()}
                  </Text>
                )}
                <Paragraph 
                  style={{ 
                    margin: '4px 0 0 0',
                    color: message.sender === 'ai' ? '#000' : '#fff'
                  }}
                >
                  {message.text}
                </Paragraph>
                {message.metadata && (
                  <Space size={4} style={{ marginTop: 8 }}>
                    {message.metadata.difficulty && (
                      <Tag color={
                        message.metadata.difficulty === 'easy' ? 'green' :
                        message.metadata.difficulty === 'medium' ? 'orange' : 'red'
                      }>
                        {message.metadata.difficulty.toUpperCase()}
                      </Tag>
                    )}
                    {message.metadata.timeLimit && (
                      <Tag color="blue">
                        {message.metadata.timeLimit}s
                      </Tag>
                    )}
                  </Space>
                )}
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div style={{ 
        padding: '16px', 
        borderTop: '1px solid #f0f0f0',
        background: '#fff'
      }}>
        <Space.Compact style={{ width: '100%' }}>
          <TextArea
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={placeholder || "Type your answer here..."}
            disabled={disabled}
            autoSize={{ minRows: 2, maxRows: 4 }}
            style={{ flex: 1 }}
          />
          <Button
            type="primary"
            icon={<SendOutlined />}
            onClick={handleSend}
            disabled={!inputValue.trim() || disabled}
            style={{ height: 'auto' }}
          >
            Send
          </Button>
        </Space.Compact>
      </div>
    </Card>
  )
}

export default ChatWindow

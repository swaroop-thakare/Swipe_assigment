import React, { useState, useEffect } from 'react'
import { Progress, Typography } from 'antd'
import { ClockCircleOutlined } from '@ant-design/icons'

const { Text } = Typography

const Timer = ({ timeLimit, onTimeUp, isActive }) => {
  const [timeLeft, setTimeLeft] = useState(timeLimit)
  const [isRunning, setIsRunning] = useState(false)

  useEffect(() => {
    setTimeLeft(timeLimit)
    setIsRunning(isActive)
  }, [timeLimit, isActive])

  useEffect(() => {
    let interval = null
    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(timeLeft => {
          if (timeLeft <= 1) {
            setIsRunning(false)
            onTimeUp()
            return 0
          }
          return timeLeft - 1
        })
      }, 1000)
    } else if (!isRunning) {
      clearInterval(interval)
    }
    return () => clearInterval(interval)
  }, [isRunning, timeLeft, onTimeUp])

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const percentage = (timeLeft / timeLimit) * 100
  const isLowTime = timeLeft <= 10

  return (
    <div style={{ 
      display: 'flex', 
      alignItems: 'center', 
      gap: 12,
      marginBottom: 16
    }}>
      <ClockCircleOutlined style={{ 
        fontSize: 20, 
        color: isLowTime ? '#ff4d4f' : '#1890ff' 
      }} />
      
      <div style={{ flex: 1 }}>
        <Progress
          percent={percentage}
          showInfo={false}
          strokeColor={isLowTime ? '#ff4d4f' : '#1890ff'}
          trailColor="#f0f0f0"
        />
      </div>
      
      <Text 
        strong 
        style={{ 
          fontSize: 18,
          color: isLowTime ? '#ff4d4f' : '#1890ff',
          minWidth: 60,
          textAlign: 'right'
        }}
      >
        {formatTime(timeLeft)}
      </Text>
    </div>
  )
}

export default Timer

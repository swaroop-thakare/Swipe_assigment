import React from 'react'
import { Modal, Button, Typography, Space } from 'antd'
import { ClockCircleOutlined, UserOutlined } from '@ant-design/icons'

const { Title, Text } = Typography

const WelcomeBackModal = ({ visible, onResume, onStartNew, candidateName }) => {
  return (
    <Modal
      title={
        <Space>
          <ClockCircleOutlined style={{ color: '#1890ff' }} />
          <span>Welcome Back!</span>
        </Space>
      }
      open={visible}
      onCancel={onStartNew}
      footer={[
        <Button key="new" onClick={onStartNew}>
          Start New Interview
        </Button>,
        <Button key="resume" type="primary" onClick={onResume}>
          Resume Interview
        </Button>
      ]}
      centered
      width={500}
    >
      <div style={{ textAlign: 'center', padding: '20px 0' }}>
        <UserOutlined style={{ fontSize: 48, color: '#1890ff', marginBottom: 16 }} />
        
        <Title level={4} style={{ marginBottom: 8 }}>
          {candidateName ? `Welcome back, ${candidateName}!` : 'Welcome back!'}
        </Title>
        
        <Text style={{ color: '#666', display: 'block', marginBottom: 16 }}>
          We noticed you have an interview in progress. Would you like to continue where you left off?
        </Text>

        <div style={{ 
          background: '#f6ffed', 
          padding: 12, 
          borderRadius: 6,
          border: '1px solid #b7eb8f',
          textAlign: 'left'
        }}>
          <Text strong style={{ color: '#389e0d' }}>Resume Interview:</Text>
          <br />
          <Text style={{ fontSize: 12, color: '#666' }}>
            Continue with your current interview session and pick up where you left off.
          </Text>
        </div>

        <div style={{ 
          background: '#fff7e6', 
          padding: 12, 
          borderRadius: 6,
          border: '1px solid #ffd591',
          textAlign: 'left',
          marginTop: 8
        }}>
          <Text strong style={{ color: '#d48806' }}>Start New Interview:</Text>
          <br />
          <Text style={{ fontSize: 12, color: '#666' }}>
            Begin a fresh interview session (your previous progress will be saved).
          </Text>
        </div>
      </div>
    </Modal>
  )
}

export default WelcomeBackModal

import React from 'react'
import { 
  Drawer, 
  Descriptions, 
  Typography, 
  Card, 
  Tag, 
  Space, 
  Timeline, 
  Progress,
  Divider,
  Badge
} from 'antd'
import { 
  UserOutlined, 
  MailOutlined, 
  PhoneOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  TrophyOutlined
} from '@ant-design/icons'

const { Title, Text, Paragraph } = Typography

const CandidateDetailDrawer = ({ visible, candidate, onClose }) => {
  if (!candidate) return null

  const getScoreColor = (score) => {
    if (score >= 80) return '#52c41a'
    if (score >= 60) return '#faad14'
    if (score >= 40) return '#fa8c16'
    return '#ff4d4f'
  }

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'easy': return 'green'
      case 'medium': return 'orange'
      case 'hard': return 'red'
      default: return 'default'
    }
  }

  const renderChatHistory = () => {
    if (!candidate.questions || !candidate.answers) return null

    const timelineItems = []
    
    for (let i = 0; i < candidate.questions.length; i++) {
      const question = candidate.questions[i]
      const answer = candidate.answers[i]
      
      timelineItems.push({
        children: (
          <div>
            <Title level={5} style={{ marginBottom: 8 }}>
              Question {i + 1}: {question.text}
            </Title>
            <Space style={{ marginBottom: 8 }}>
              <Tag color={getDifficultyColor(question.difficulty)}>
                {question.difficulty.toUpperCase()}
              </Tag>
              <Tag color="blue">{question.timeLimit}s</Tag>
            </Space>
            {answer && (
              <div style={{ marginTop: 8 }}>
                <Text strong>Answer:</Text>
                <Paragraph style={{ marginTop: 4, background: '#f5f5f5', padding: 8, borderRadius: 4 }}>
                  {answer.answer}
                </Paragraph>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  Time spent: {answer.timeSpent}s | Submitted: {new Date(answer.submittedAt).toLocaleString()}
                </Text>
              </div>
            )}
          </div>
        )
      })
    }

    return <Timeline items={timelineItems} />
  }

  return (
    <Drawer
      title={
        <Space>
          <UserOutlined />
          <span>{candidate.name || 'Unknown Candidate'}</span>
        </Space>
      }
      width={800}
      open={visible}
      onClose={onClose}
      extra={
        <Space>
          {candidate.finalScore !== null && (
            <Badge 
              count={`${candidate.finalScore.toFixed(1)}/100`}
              style={{ backgroundColor: getScoreColor(candidate.finalScore) }}
            />
          )}
        </Space>
      }
    >
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        {/* Profile Information */}
        <Card title="Profile Information" size="small">
          <Descriptions column={1} size="small">
            <Descriptions.Item label={<><UserOutlined /> Name</>}>
              {candidate.name || 'Not provided'}
            </Descriptions.Item>
            <Descriptions.Item label={<><MailOutlined /> Email</>}>
              {candidate.email || 'Not provided'}
            </Descriptions.Item>
            <Descriptions.Item label={<><PhoneOutlined /> Phone</>}>
              {candidate.phone || 'Not provided'}
            </Descriptions.Item>
            <Descriptions.Item label="Interview Date">
              {new Date(candidate.createdAt).toLocaleString()}
            </Descriptions.Item>
            <Descriptions.Item label="Status">
              <Badge 
                status={
                  candidate.interviewStatus === 'completed' ? 'success' :
                  candidate.interviewStatus === 'in_progress' ? 'processing' : 'default'
                }
                text={
                  candidate.interviewStatus === 'not_started' ? 'Not Started' :
                  candidate.interviewStatus === 'in_progress' ? 'In Progress' :
                  candidate.interviewStatus === 'completed' ? 'Completed' : candidate.interviewStatus
                }
              />
            </Descriptions.Item>
          </Descriptions>
        </Card>

        {/* Interview Results */}
        {candidate.interviewStatus === 'completed' && (
          <Card title="Interview Results" size="small">
            <Space direction="vertical" style={{ width: '100%' }}>
              <div style={{ textAlign: 'center' }}>
                <Title level={2} style={{ color: getScoreColor(candidate.finalScore), margin: 0 }}>
                  {candidate.finalScore.toFixed(1)}/100
                </Title>
                <Progress 
                  percent={candidate.finalScore} 
                  strokeColor={getScoreColor(candidate.finalScore)}
                  style={{ marginTop: 8 }}
                />
              </div>
              
              {candidate.aiSummary && (
                <div>
                  <Title level={5}>AI Summary:</Title>
                  <Paragraph style={{ 
                    background: '#f9f9f9', 
                    padding: 12, 
                    borderRadius: 4,
                    whiteSpace: 'pre-line'
                  }}>
                    {candidate.aiSummary}
                  </Paragraph>
                </div>
              )}
            </Space>
          </Card>
        )}

        {/* Progress Information */}
        {candidate.interviewStatus === 'in_progress' && (
          <Card title="Interview Progress" size="small">
            <Space direction="vertical" style={{ width: '100%' }}>
              <div>
                <Text strong>Progress: </Text>
                <Text>
                  {candidate.currentQuestionIndex || 0} of {candidate.questions?.length || 0} questions
                </Text>
                <Progress 
                  percent={candidate.questions ? 
                    Math.round((candidate.currentQuestionIndex / candidate.questions.length) * 100) : 0
                  } 
                  status="active"
                />
              </div>
            </Space>
          </Card>
        )}

        {/* Chat History */}
        {candidate.questions && candidate.questions.length > 0 && (
          <Card title="Interview History" size="small">
            {renderChatHistory()}
          </Card>
        )}

        {/* Question Analysis */}
        {candidate.interviewStatus === 'completed' && candidate.answers && (
          <Card title="Question Analysis" size="small">
            <Space direction="vertical" style={{ width: '100%' }}>
              {candidate.questions.map((question, index) => {
                const answer = candidate.answers[index]
                if (!answer) return null
                
                return (
                  <div key={index} style={{ 
                    border: '1px solid #f0f0f0', 
                    borderRadius: 4, 
                    padding: 12,
                    marginBottom: 8
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                      <Text strong>Question {index + 1}</Text>
                      <Space>
                        <Tag color={getDifficultyColor(question.difficulty)}>
                          {question.difficulty.toUpperCase()}
                        </Tag>
                        <Tag color="blue">{question.timeLimit}s</Tag>
                      </Space>
                    </div>
                    <Text style={{ fontSize: 12, color: '#666' }}>{question.text}</Text>
                    <Divider style={{ margin: '8px 0' }} />
                    <div>
                      <Text strong style={{ fontSize: 12 }}>Answer:</Text>
                      <Paragraph style={{ margin: '4px 0', fontSize: 12 }}>
                        {answer.answer}
                      </Paragraph>
                      <Text type="secondary" style={{ fontSize: 11 }}>
                        Time: {answer.timeSpent}s | Submitted: {new Date(answer.submittedAt).toLocaleString()}
                      </Text>
                    </div>
                  </div>
                )
              })}
            </Space>
          </Card>
        )}
      </Space>
    </Drawer>
  )
}

export default CandidateDetailDrawer

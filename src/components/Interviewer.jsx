import React, { useState } from 'react'
import { 
  Card, 
  Table, 
  Input, 
  Button, 
  Space, 
  Tag, 
  Typography, 
  Drawer, 
  Descriptions,
  Progress,
  Badge,
  Tooltip
} from 'antd'
import { 
  SearchOutlined, 
  EyeOutlined, 
  UserOutlined,
  TrophyOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons'
import { useSelector } from 'react-redux'
import CandidateDetailDrawer from './CandidateDetailDrawer'

const { Title, Text } = Typography
const { Search } = Input

const Interviewer = () => {
  const { candidates } = useSelector(state => state.candidates)
  const [searchText, setSearchText] = useState('')
  const [sortBy, setSortBy] = useState('score')
  const [selectedCandidate, setSelectedCandidate] = useState(null)
  const [drawerVisible, setDrawerVisible] = useState(false)

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'success'
      case 'in_progress': return 'processing'
      case 'not_started': return 'default'
      default: return 'default'
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed': return <CheckCircleOutlined />
      case 'in_progress': return <ClockCircleOutlined />
      case 'not_started': return <ExclamationCircleOutlined />
      default: return <ExclamationCircleOutlined />
    }
  }

  const getScoreColor = (score) => {
    if (score >= 80) return '#52c41a'
    if (score >= 60) return '#faad14'
    if (score >= 40) return '#fa8c16'
    return '#ff4d4f'
  }

  const filteredCandidates = candidates
    .filter(candidate => 
      candidate.name?.toLowerCase().includes(searchText.toLowerCase()) ||
      candidate.email?.toLowerCase().includes(searchText.toLowerCase())
    )
    .sort((a, b) => {
      if (sortBy === 'score') {
        return (b.finalScore || 0) - (a.finalScore || 0)
      }
      if (sortBy === 'name') {
        return (a.name || '').localeCompare(b.name || '')
      }
      if (sortBy === 'date') {
        return new Date(b.createdAt) - new Date(a.createdAt)
      }
      return 0
    })

  const columns = [
    {
      title: 'Candidate',
      key: 'candidate',
      render: (_, record) => (
        <div>
          <div style={{ fontWeight: 'bold' }}>{record.name || 'Unknown'}</div>
          <div style={{ fontSize: 12, color: '#666' }}>{record.email}</div>
        </div>
      ),
      sorter: (a, b) => (a.name || '').localeCompare(b.name || ''),
    },
    {
      title: 'Status',
      dataIndex: 'interviewStatus',
      key: 'status',
      render: (status) => (
        <Badge 
          status={getStatusColor(status)} 
          text={
            <Space>
              {getStatusIcon(status)}
              {status === 'not_started' ? 'Not Started' :
               status === 'in_progress' ? 'In Progress' :
               status === 'completed' ? 'Completed' : status}
            </Space>
          }
        />
      ),
      filters: [
        { text: 'Not Started', value: 'not_started' },
        { text: 'In Progress', value: 'in_progress' },
        { text: 'Completed', value: 'completed' },
      ],
      onFilter: (value, record) => record.interviewStatus === value,
    },
    {
      title: 'Score',
      dataIndex: 'finalScore',
      key: 'score',
      render: (score) => (
        score !== null ? (
          <div style={{ textAlign: 'center' }}>
            <div style={{ 
              fontSize: 18, 
              fontWeight: 'bold', 
              color: getScoreColor(score) 
            }}>
              {score.toFixed(1)}
            </div>
            <Progress 
              percent={score} 
              size="small" 
              strokeColor={getScoreColor(score)}
              showInfo={false}
            />
          </div>
        ) : (
          <Text type="secondary">-</Text>
        )
      ),
      sorter: (a, b) => (a.finalScore || 0) - (b.finalScore || 0),
    },
    {
      title: 'Progress',
      key: 'progress',
      render: (_, record) => {
        if (record.interviewStatus === 'not_started') {
          return <Text type="secondary">0%</Text>
        }
        if (record.interviewStatus === 'completed') {
          return <Text type="success">100%</Text>
        }
        const progress = record.questions ? 
          Math.round((record.currentQuestionIndex / record.questions.length) * 100) : 0
        return (
          <div>
            <Text>{progress}%</Text>
            <Progress 
              percent={progress} 
              size="small" 
              status="active"
              showInfo={false}
            />
          </div>
        )
      },
    },
    {
      title: 'Date',
      dataIndex: 'createdAt',
      key: 'date',
      render: (date) => new Date(date).toLocaleDateString(),
      sorter: (a, b) => new Date(a.createdAt) - new Date(b.createdAt),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Button
          type="link"
          icon={<EyeOutlined />}
          onClick={() => {
            setSelectedCandidate(record)
            setDrawerVisible(true)
          }}
        >
          View Details
        </Button>
      ),
    },
  ]

  return (
    <div style={{ padding: '20px' }}>
      <Card style={{ 
        marginBottom: 24,
        background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.02) 0%, rgba(118, 75, 162, 0.02) 100%)',
        border: '1px solid rgba(102, 126, 234, 0.1)',
        borderRadius: 20
      }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          marginBottom: 24,
          padding: '20px',
          background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.05) 0%, rgba(118, 75, 162, 0.05) 100%)',
          borderRadius: 16,
          border: '1px solid rgba(102, 126, 234, 0.1)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
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
              🏆
            </div>
            <div>
              <Title level={2} style={{ 
                margin: 0,
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                fontSize: '28px',
                fontWeight: '800'
              }}>
                Interview Dashboard
              </Title>
              <Text style={{ 
                color: '#7f8c8d',
                fontSize: 16,
                fontWeight: '500'
              }}>
                Manage and track candidate interviews
              </Text>
            </div>
          </div>
          
          <div style={{
            padding: '12px 20px',
            background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)',
            borderRadius: 12,
            border: '1px solid rgba(102, 126, 234, 0.2)'
          }}>
            <Text style={{ 
              fontSize: 18,
              fontWeight: '700',
              color: '#2c3e50'
            }}>
              {filteredCandidates.length} candidate{filteredCandidates.length !== 1 ? 's' : ''}
            </Text>
          </div>
        </div>

        <Space style={{ width: '100%', marginBottom: 16 }}>
          <Search
            placeholder="Search candidates..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ width: 300 }}
            prefix={<SearchOutlined />}
          />
          
          <Button.Group>
            <Button 
              type={sortBy === 'score' ? 'primary' : 'default'}
              onClick={() => setSortBy('score')}
            >
              Sort by Score
            </Button>
            <Button 
              type={sortBy === 'name' ? 'primary' : 'default'}
              onClick={() => setSortBy('name')}
            >
              Sort by Name
            </Button>
            <Button 
              type={sortBy === 'date' ? 'primary' : 'default'}
              onClick={() => setSortBy('date')}
            >
              Sort by Date
            </Button>
          </Button.Group>
        </Space>

        <Table
          columns={columns}
          dataSource={filteredCandidates}
          rowKey="id"
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => 
              `${range[0]}-${range[1]} of ${total} candidates`
          }}
          scroll={{ x: 800 }}
        />
      </Card>

      <CandidateDetailDrawer
        visible={drawerVisible}
        candidate={selectedCandidate}
        onClose={() => setDrawerVisible(false)}
      />
    </div>
  )
}

export default Interviewer

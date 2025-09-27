import React, { useState, useEffect } from 'react'
import { 
  Card, 
  Table, 
  Button, 
  Input, 
  Select, 
  Space, 
  Typography, 
  Tag, 
  Modal, 
  Descriptions, 
  Progress, 
  Badge,
  message,
  Tooltip
} from 'antd'
import { 
  SearchOutlined, 
  UserOutlined, 
  EyeOutlined, 
  TrophyOutlined, 
  ClockCircleOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons'
import { useSelector, useDispatch } from 'react-redux'
import { fetchCandidates } from '../features/candidatesSlice'
import apiService from '../services/api'

const { Title, Text } = Typography
const { Option } = Select

const RecruiterDashboard = () => {
  const dispatch = useDispatch()
  const { candidates, loading } = useSelector(state => state.candidates)
  
  const [searchText, setSearchText] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [sortBy, setSortBy] = useState('createdAt')
  const [sortOrder, setSortOrder] = useState('desc')
  const [selectedCandidate, setSelectedCandidate] = useState(null)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [filteredCandidates, setFilteredCandidates] = useState([])

  useEffect(() => {
    dispatch(fetchCandidates())
  }, [dispatch])

  useEffect(() => {
    let filtered = [...candidates]

    // Search filter
    if (searchText) {
      filtered = filtered.filter(candidate => 
        candidate.name?.toLowerCase().includes(searchText.toLowerCase()) ||
        candidate.email?.toLowerCase().includes(searchText.toLowerCase())
      )
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(candidate => candidate.interviewStatus === statusFilter)
    }

    // Sort
    filtered.sort((a, b) => {
      let aValue = a[sortBy]
      let bValue = b[sortBy]

      if (sortBy === 'finalScore') {
        aValue = a.finalScore || 0
        bValue = b.finalScore || 0
      }

      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase()
        bValue = bValue.toLowerCase()
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1
      } else {
        return aValue < bValue ? 1 : -1
      }
    })

    setFilteredCandidates(filtered)
  }, [candidates, searchText, statusFilter, sortBy, sortOrder])

  const getStatusTag = (status) => {
    const statusConfig = {
      'not_started': { color: 'default', text: 'Not Started', icon: <ClockCircleOutlined /> },
      'in_progress': { color: 'processing', text: 'In Progress', icon: <ClockCircleOutlined /> },
      'completed': { color: 'success', text: 'Completed', icon: <CheckCircleOutlined /> },
      'paused': { color: 'warning', text: 'Paused', icon: <ExclamationCircleOutlined /> }
    }

    const config = statusConfig[status] || statusConfig['not_started']
    return (
      <Tag color={config.color} icon={config.icon}>
        {config.text}
      </Tag>
    )
  }

  const getScoreColor = (score) => {
    if (score >= 80) return '#52c41a'
    if (score >= 60) return '#1890ff'
    if (score >= 40) return '#faad14'
    return '#ff4d4f'
  }

  const getPerformanceLevel = (score) => {
    if (score >= 80) return 'Excellent'
    if (score >= 60) return 'Good'
    if (score >= 40) return 'Fair'
    return 'Needs Improvement'
  }

  const handleViewDetails = async (candidate) => {
    try {
      const response = await apiService.getCandidate(candidate._id)
      setSelectedCandidate(response)
      setShowDetailModal(true)
    } catch (error) {
      console.error('Error fetching candidate details:', error)
      console.error('Failed to load candidate details')
    }
  }

  const columns = [
    {
      title: 'Candidate',
      key: 'candidate',
      render: (_, record) => (
        <div>
          <div style={{ fontWeight: 'bold', marginBottom: 4 }}>
            {record.name || 'N/A'}
          </div>
          <div style={{ fontSize: 12, color: '#666' }}>
            {record.email}
          </div>
        </div>
      ),
      sorter: (a, b) => (a.name || '').localeCompare(b.name || ''),
    },
    {
      title: 'Phone',
      dataIndex: 'phone',
      key: 'phone',
      render: (phone) => phone || 'N/A',
    },
    {
      title: 'Status',
      dataIndex: 'interviewStatus',
      key: 'status',
      render: (status) => getStatusTag(status),
      filters: [
        { text: 'Not Started', value: 'not_started' },
        { text: 'In Progress', value: 'in_progress' },
        { text: 'Completed', value: 'completed' },
        { text: 'Paused', value: 'paused' },
      ],
      onFilter: (value, record) => record.interviewStatus === value,
    },
    {
      title: 'Score',
      dataIndex: 'finalScore',
      key: 'score',
      render: (score) => {
        if (score === null || score === undefined) {
          return <Text type="secondary">-</Text>
        }
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Progress
              type="circle"
              size={40}
              percent={score}
              strokeColor={getScoreColor(score)}
              format={() => score}
            />
            <div>
              <div style={{ fontWeight: 'bold', color: getScoreColor(score) }}>
                {score}/100
              </div>
              <div style={{ fontSize: 12, color: '#666' }}>
                {getPerformanceLevel(score)}
              </div>
            </div>
          </div>
        )
      },
      sorter: (a, b) => (a.finalScore || 0) - (b.finalScore || 0),
    },
    {
      title: 'AI Summary',
      dataIndex: 'aiSummary',
      key: 'summary',
      render: (summary) => (
        <Tooltip title={summary || 'No summary available'}>
          <Text 
            ellipsis={{ tooltip: summary || 'No summary available' }}
            style={{ maxWidth: 200 }}
          >
            {summary || 'No summary available'}
          </Text>
        </Tooltip>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button
            type="primary"
            icon={<EyeOutlined />}
            onClick={() => handleViewDetails(record)}
            size="small"
          >
            View Details
          </Button>
        </Space>
      ),
    },
  ]

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '20px' }}>
      {/* Header */}
      <Card style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <Title level={2} style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 12 }}>
              <TrophyOutlined style={{ color: '#1890ff' }} />
              Recruiter Dashboard
            </Title>
            <Text type="secondary">
              Manage and review candidate interviews
            </Text>
          </div>
          <Badge count={filteredCandidates.length} showZero>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 24, fontWeight: 'bold', color: '#1890ff' }}>
                {filteredCandidates.length}
              </div>
              <div style={{ fontSize: 12, color: '#666' }}>Candidates</div>
            </div>
          </Badge>
        </div>
      </Card>

      {/* Filters */}
      <Card style={{ marginBottom: 24 }}>
        <Space wrap>
          <Input
            placeholder="Search candidates..."
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ width: 300 }}
          />
          <Select
            placeholder="Filter by status"
            value={statusFilter}
            onChange={setStatusFilter}
            style={{ width: 150 }}
          >
            <Option value="all">All Status</Option>
            <Option value="not_started">Not Started</Option>
            <Option value="in_progress">In Progress</Option>
            <Option value="completed">Completed</Option>
            <Option value="paused">Paused</Option>
          </Select>
          <Select
            placeholder="Sort by"
            value={sortBy}
            onChange={setSortBy}
            style={{ width: 150 }}
          >
            <Option value="createdAt">Date Created</Option>
            <Option value="finalScore">Score</Option>
            <Option value="name">Name</Option>
          </Select>
          <Select
            value={sortOrder}
            onChange={setSortOrder}
            style={{ width: 120 }}
          >
            <Option value="desc">Descending</Option>
            <Option value="asc">Ascending</Option>
          </Select>
        </Space>
      </Card>

      {/* Candidates Table */}
      <Card>
        <Table
          columns={columns}
          dataSource={filteredCandidates}
          rowKey={(record) => record._id || record.id || Math.random().toString(36)}
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => 
              `${range[0]}-${range[1]} of ${total} candidates`,
          }}
          scroll={{ x: 800 }}
        />
      </Card>

      {/* Candidate Detail Modal */}
      <Modal
        title={`Candidate Details - ${selectedCandidate?.name}`}
        open={showDetailModal}
        onCancel={() => setShowDetailModal(false)}
        footer={[
          <Button key="close" onClick={() => setShowDetailModal(false)}>
            Close
          </Button>
        ]}
        width={800}
      >
        {selectedCandidate && (
          <div>
            {/* Basic Info */}
            <Card title="Basic Information" style={{ marginBottom: 16 }}>
              <Descriptions column={2}>
                <Descriptions.Item label="Name">{selectedCandidate.name}</Descriptions.Item>
                <Descriptions.Item label="Email">{selectedCandidate.email}</Descriptions.Item>
                <Descriptions.Item label="Phone">{selectedCandidate.phone}</Descriptions.Item>
                <Descriptions.Item label="Status">
                  {getStatusTag(selectedCandidate.interviewStatus)}
                </Descriptions.Item>
                <Descriptions.Item label="Final Score">
                  {selectedCandidate.finalScore ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Progress
                        type="circle"
                        size={60}
                        percent={selectedCandidate.finalScore}
                        strokeColor={getScoreColor(selectedCandidate.finalScore)}
                        format={() => selectedCandidate.finalScore}
                      />
                      <div>
                        <div style={{ fontWeight: 'bold', fontSize: 18 }}>
                          {selectedCandidate.finalScore}/100
                        </div>
                        <div style={{ color: '#666' }}>
                          {getPerformanceLevel(selectedCandidate.finalScore)}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <Text type="secondary">Not completed</Text>
                  )}
                </Descriptions.Item>
              </Descriptions>
            </Card>

            {/* AI Summary */}
            {selectedCandidate.aiSummary && (
              <Card title="AI Summary" style={{ marginBottom: 16 }}>
                <Text>{selectedCandidate.aiSummary}</Text>
              </Card>
            )}

            {/* Interview History */}
            {selectedCandidate.interview && (
              <Card title="Interview History">
                <div>
                  <Text strong>Session ID: </Text>
                  <Text code>{selectedCandidate.interview.sessionId}</Text>
                </div>
                <div style={{ marginTop: 16 }}>
                  <Text strong>Questions: </Text>
                  <Text>{selectedCandidate.interview.questions?.length || 0} total</Text>
                </div>
                <div>
                  <Text strong>Answers: </Text>
                  <Text>{selectedCandidate.interview.answers?.length || 0} provided</Text>
                </div>
                {selectedCandidate.interview.completedAt && (
                  <div>
                    <Text strong>Completed: </Text>
                    <Text>{new Date(selectedCandidate.interview.completedAt).toLocaleString()}</Text>
                  </div>
                )}
              </Card>
            )}
          </div>
        )}
      </Modal>
    </div>
  )
}

export default RecruiterDashboard

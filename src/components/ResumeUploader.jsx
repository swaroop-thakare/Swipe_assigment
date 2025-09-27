import React, { useState } from 'react'
import { Upload, Button, Card, Form, Input, message, Spin } from 'antd'
import { UploadOutlined, FileTextOutlined } from '@ant-design/icons'
import { parsePDF, parseDOCX } from '../utils/parseResume'
import { parsePDFWithPython, parseDOCXWithPython, checkPythonParserHealth } from '../utils/pythonParser'
import MissingDetailsChatbot from './MissingDetailsChatbot'

const ResumeUploader = ({ onProfileExtracted, onManualInput }) => {
  const [loading, setLoading] = useState(false)
  const [extractedProfile, setExtractedProfile] = useState(null)
  const [showChatbot, setShowChatbot] = useState(false)
  const [form] = Form.useForm()

  const handleFileUpload = async (file) => {
    setLoading(true)
    try {
      // Check if Python parser is available
      const pythonParserAvailable = await checkPythonParserHealth()
      
      let profile
      if (file.type === 'application/pdf') {
        if (pythonParserAvailable) {
          console.log('🐍 Using Python parser for PDF')
          profile = await parsePDFWithPython(file)
        } else {
          console.log('📄 Using JavaScript parser for PDF')
          profile = await parsePDF(file)
        }
      } else if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        if (pythonParserAvailable) {
          console.log('🐍 Using Python parser for DOCX')
          profile = await parseDOCXWithPython(file)
        } else {
          console.log('📝 Using JavaScript parser for DOCX')
          profile = await parseDOCX(file)
        }
      } else {
        console.error('Please upload a PDF or DOCX file')
        return false
      }

      setExtractedProfile(profile)
      
      // Check which fields are missing
      const missingFields = []
      if (!profile.name) missingFields.push('Name')
      if (!profile.email) missingFields.push('Email')
      if (!profile.phone) missingFields.push('Phone')

      // Always populate the form with extracted information
      form.setFieldsValue({
        name: profile.name || '',
        email: profile.email || '',
        phone: profile.phone || ''
      })

      if (missingFields.length === 0) {
        console.log('Profile extracted successfully!')
        onProfileExtracted(profile)
      } else {
        console.warn(`Extracted some information. Missing: ${missingFields.join(', ')}`)
        setExtractedProfile(profile)
        setShowChatbot(true)
      }
    } catch (error) {
      console.error('Failed to parse resume. Please try again or enter information manually.')
      console.error('Parse error:', error)
    } finally {
      setLoading(false)
    }
    return false // Prevent default upload
  }

  const handleManualSubmit = (values) => {
    onProfileExtracted(values)
  }

  const handleChatbotComplete = (completeProfile) => {
    setShowChatbot(false)
    onProfileExtracted(completeProfile)
  }

  const handleChatbotSkip = (profile) => {
    setShowChatbot(false)
    onProfileExtracted(profile)
  }

  const uploadProps = {
    beforeUpload: handleFileUpload,
    accept: '.pdf,.docx',
    showUploadList: false,
    multiple: false
  }

  return (
    <Card 
      title={
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 12,
          fontSize: '20px',
          fontWeight: '700'
        }}>
          <div style={{
            width: 40,
            height: 40,
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            borderRadius: 12,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontSize: 18
          }}>
            📄
          </div>
          Resume Upload & Profile Setup
        </div>
      } 
      style={{ 
        marginBottom: 24,
        background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.02) 0%, rgba(118, 75, 162, 0.02) 100%)',
        border: '1px solid rgba(102, 126, 234, 0.1)'
      }}
    >
      <div style={{ 
        marginBottom: 24,
        padding: '24px',
        background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.05) 0%, rgba(118, 75, 162, 0.05) 100%)',
        borderRadius: 16,
        border: '2px dashed rgba(102, 126, 234, 0.3)',
        textAlign: 'center',
        transition: 'all 0.3s ease'
      }}>
        <Upload {...uploadProps}>
          <Button 
            icon={<UploadOutlined />} 
            size="large" 
            loading={loading}
            style={{
              height: 56,
              fontSize: 16,
              fontWeight: '600',
              borderRadius: 16,
              background: loading ? undefined : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              border: 'none',
              boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)'
            }}
          >
            {loading ? 'Processing...' : 'Upload Resume (PDF/DOCX)'}
          </Button>
        </Upload>
        <p style={{ 
          marginTop: 12, 
          color: '#7f8c8d',
          fontSize: 14,
          fontWeight: '500'
        }}>
          📎 Supported formats: PDF, DOCX • Max size: 10MB
        </p>
      </div>

      <div style={{ marginTop: 24 }}>
        <h4>Or enter your information manually:</h4>
        <Form
          form={form}
          layout="vertical"
          onFinish={handleManualSubmit}
          initialValues={extractedProfile || {}}
        >
          <Form.Item
            name="name"
            label="Full Name"
            rules={[{ required: true, message: 'Please enter your name' }]}
          >
            <Input placeholder="Enter your full name" />
          </Form.Item>

          <Form.Item
            name="email"
            label="Email"
            rules={[
              { required: true, message: 'Please enter your email' },
              { type: 'email', message: 'Please enter a valid email' }
            ]}
          >
            <Input placeholder="Enter your email address" />
          </Form.Item>

          <Form.Item
            name="phone"
            label="Phone Number"
            rules={[{ required: true, message: 'Please enter your phone number' }]}
          >
            <Input placeholder="Enter your phone number" />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" size="large" block>
              Continue to Interview
            </Button>
          </Form.Item>
        </Form>
      </div>

      {extractedProfile && !showChatbot && (
        <div style={{ 
          marginTop: 16, 
          padding: 12, 
          background: '#f6ffed', 
          border: '1px solid #b7eb8f',
          borderRadius: 6
        }}>
          <h4 style={{ margin: '0 0 8px 0', color: '#389e0d' }}>
            <FileTextOutlined /> Extracted Information:
          </h4>
          {extractedProfile.name && <p><strong>Name:</strong> {extractedProfile.name}</p>}
          {extractedProfile.email && <p><strong>Email:</strong> {extractedProfile.email}</p>}
          {extractedProfile.phone && <p><strong>Phone:</strong> {extractedProfile.phone}</p>}
        </div>
      )}

      {showChatbot && (
        <div style={{ marginTop: 24 }}>
          <MissingDetailsChatbot
            profile={extractedProfile}
            onComplete={handleChatbotComplete}
            onSkip={handleChatbotSkip}
          />
        </div>
      )}
    </Card>
  )
}

export default ResumeUploader

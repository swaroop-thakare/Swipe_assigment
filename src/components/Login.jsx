import React, { useState } from 'react';
import { Card, Input, Button, Typography, Space, Alert } from 'antd';
import { UserOutlined, LockOutlined, LoginOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

const Login = ({ onLogin }) => {
  const [credentials, setCredentials] = useState({
    username: '',
    password: ''
  });
  const [error, setError] = useState('');

  const handleLogin = () => {
    // Simple static login - anyone can login
    if (credentials.username && credentials.password) {
      onLogin({
        username: credentials.username,
        role: 'candidate', // Default role
        isAuthenticated: true
      });
    } else {
      setError('Please enter both username and password');
    }
  };

  const handleQuickLogin = (role) => {
    onLogin({
      username: `demo_${role}`,
      role: role,
      isAuthenticated: true
    });
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <Card style={{
        width: '100%',
        maxWidth: 400,
        background: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(20px)',
        borderRadius: 24,
        boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
        border: '1px solid rgba(255, 255, 255, 0.2)'
      }}>
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
              width: 40,
              height: 40,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: 18,
              fontWeight: 'bold'
            }}>
              AI
            </div>
            <Title level={2} style={{
              margin: 0,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}>
              AI Interview Platform
            </Title>
          </div>
        </div>

        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <div>
            <Text strong style={{ color: '#2c3e50', marginBottom: 8, display: 'block' }}>
              Username
            </Text>
            <Input
              prefix={<UserOutlined style={{ color: '#667eea' }} />}
              placeholder="Enter any username"
              value={credentials.username}
              onChange={(e) => setCredentials({ ...credentials, username: e.target.value })}
              style={{
                borderRadius: 12,
                border: '2px solid rgba(102, 126, 234, 0.2)',
                padding: '12px 16px',
                fontSize: 16
              }}
            />
          </div>

          <div>
            <Text strong style={{ color: '#2c3e50', marginBottom: 8, display: 'block' }}>
              Password
            </Text>
            <Input.Password
              prefix={<LockOutlined style={{ color: '#667eea' }} />}
              placeholder="Enter any password"
              value={credentials.password}
              onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
              style={{
                borderRadius: 12,
                border: '2px solid rgba(102, 126, 234, 0.2)',
                padding: '12px 16px',
                fontSize: 16
              }}
            />
          </div>

          {error && (
            <Alert
              message={error}
              type="error"
              showIcon
              style={{ borderRadius: 12 }}
            />
          )}

          <Button
            type="primary"
            size="large"
            icon={<LoginOutlined />}
            onClick={handleLogin}
            style={{
              width: '100%',
              height: 48,
              borderRadius: 12,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              border: 'none',
              boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)',
              fontSize: 16,
              fontWeight: 600
            }}
          >
            Login
          </Button>

          <div style={{ textAlign: 'center', marginTop: 16 }}>
            <Text style={{ color: '#7f8c8d', fontSize: 14 }}>
              Or try quick access:
            </Text>
            <div style={{ marginTop: 12, display: 'flex', gap: 8, justifyContent: 'center' }}>
              <Button
                size="small"
                onClick={() => handleQuickLogin('candidate')}
                style={{
                  borderRadius: 8,
                  background: 'rgba(102, 126, 234, 0.1)',
                  border: '1px solid rgba(102, 126, 234, 0.3)',
                  color: '#667eea'
                }}
              >
                As Candidate
              </Button>
              <Button
                size="small"
                onClick={() => handleQuickLogin('recruiter')}
                style={{
                  borderRadius: 8,
                  background: 'rgba(118, 75, 162, 0.1)',
                  border: '1px solid rgba(118, 75, 162, 0.3)',
                  color: '#764ba2'
                }}
              >
                As Recruiter
              </Button>
            </div>
          </div>

          <div style={{
            textAlign: 'center',
            padding: '16px',
            background: 'rgba(102, 126, 234, 0.05)',
            borderRadius: 12,
            border: '1px solid rgba(102, 126, 234, 0.1)'
          }}>
            <Text style={{ color: '#7f8c8d', fontSize: 12 }}>
              💡 This is a demo login - any username/password will work
            </Text>
          </div>
        </Space>
      </Card>
    </div>
  );
};

export default Login;

import React from 'react';

const TestApp = () => {
  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: 'white',
      fontSize: '24px',
      fontWeight: 'bold'
    }}>
      <div>
        <h1>🚀 AI Interview Platform</h1>
        <p>Frontend is working!</p>
        <p>Backend: http://localhost:5002</p>
        <p>Frontend: http://localhost:3000</p>
      </div>
    </div>
  );
};

export default TestApp;

import React from 'react';

const ErrorScreen = ({ error }) => {
  if (!error) return null;
  
  return (
    <div style={{ 
      padding: '15px', 
      backgroundColor: '#fee', 
      border: '1px solid #c00', 
      borderRadius: '5px',
      margin: '10px 0',
      color: '#c00'
    }}>
      <strong>Error:</strong> {error}
    </div>
  );
};

export default ErrorScreen;

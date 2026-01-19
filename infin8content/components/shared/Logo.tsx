"use client"

import React from 'react';

const Logo = ({ width = 192, height = 41 }) => {
  return (
    <div style={{ 
      width: `${width}px`, 
      height: `${height}px`,
      borderRadius: '6px',
      background: 'linear-gradient(to right, #FF0000, #00FF00)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: 'white',
      fontWeight: 'bold',
      fontSize: '16px',
      fontFamily: 'Arial, sans-serif',
      border: '5px solid yellow',
      boxShadow: '0 0 20px rgba(255,0,0,0.8)'
    }}>
      I8 Infin8Content
    </div>
  );
};

export default Logo;

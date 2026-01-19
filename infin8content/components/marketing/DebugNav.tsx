"use client"

import React from 'react';

const DebugNav = () => {
  return (
    <nav style={{ 
      position: 'sticky', 
      top: 0, 
      zIndex: 50, 
      backgroundColor: '#FFFFFF',
      borderBottom: '1px solid #E5E7EB',
      padding: '1rem'
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '1rem 1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <img 
              src="/infin8content-logo.svg" 
              alt="Infin8Content Logo"
              style={{ 
                width: '192px', 
                height: '41px',
                borderRadius: '6px',
                objectFit: 'contain',
                border: '2px solid green'
              }}
            />
            <span style={{ marginLeft: '1rem', color: 'red' }}>DEBUG: Logo should be here</span>
          </div>
          
          <div style={{ color: 'blue' }}>
            Debug Navigation - Logo Test
          </div>
        </div>
      </div>
    </nav>
  );
};

export default DebugNav;

"use client"

import React from 'react';
import Logo from '@/components/shared/Logo';

const SimpleNav = () => {
  return (
    <nav style={{ 
      position: 'sticky', 
      top: 0, 
      zIndex: 50, 
      backgroundColor: '#FFFFFF',
      borderBottom: '1px solid #E5E7EB',
      padding: '1rem 0'
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <Logo width={192} height={41} />
          </div>
          
          {/* Simple menu */}
          <div style={{ color: '#2C2C2E', fontSize: '1rem' }}>
            Simple Navigation - Logo Test
          </div>
        </div>
      </div>
    </nav>
  );
};

export default SimpleNav;

"use client";

import React from 'react';

interface ComingSoonPageProps {
  title?: string;
  description?: string;
  showCTA?: boolean;
}

const ComingSoonPage = ({ 
  title = "Coming Soon", 
  description = "This page is under construction and will be available soon.",
  showCTA = false 
}: ComingSoonPageProps) => {
  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      padding: '2rem',
      backgroundColor: '#f8fafc'
    }}>
      <div style={{ 
        textAlign: 'center', 
        maxWidth: '600px',
        padding: '3rem',
        backgroundColor: 'white',
        borderRadius: '12px',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
      }}>
        <h1 style={{ 
          fontSize: '2.5rem', 
          fontWeight: 'bold', 
          color: '#1a202c',
          marginBottom: '1rem'
        }}>
          {title}
        </h1>
        <p style={{ 
          fontSize: '1.125rem', 
          color: '#4a5568',
          marginBottom: '2rem',
          lineHeight: '1.6'
        }}>
          {description}
        </p>
        {showCTA && (
          <div>
            <button style={{
              backgroundColor: '#3b82f6',
              color: 'white',
              padding: '0.75rem 2rem',
              borderRadius: '6px',
              border: 'none',
              fontSize: '1rem',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'background-color 0.2s'
            }}>
              Get Notified
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ComingSoonPage;

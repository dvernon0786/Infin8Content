"use client"

import React, { useState } from 'react';
import { ChevronDown, Menu, X } from 'lucide-react';

const Navigation = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [featuresOpen, setFeaturesOpen] = useState(false);
  const [solutionsOpen, setSolutionsOpen] = useState(false);
  const [resourcesOpen, setResourcesOpen] = useState(false);

  return (
    <nav style={{ 
      position: 'sticky', 
      top: 0, 
      zIndex: 50, 
      backgroundColor: '#FFFFFF',
      borderBottom: '1px solid #E5E7EB'
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '1rem 1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <img 
              src="/infin8content-logo.png" 
              alt="Infin8Content Logo"
              style={{ 
                width: '192px', 
                height: '41px',
                borderRadius: '6px',
                objectFit: 'contain'
              }}
            />
          </div>

          {/* Desktop Menu */}
          <div style={{ alignItems: 'center', gap: '2rem' }} className="hidden md:flex">
            <a 
              href="/pricing" 
              style={{ 
                color: '#2C2C2E', 
                textDecoration: 'none', 
                fontSize: '1rem',
                fontWeight: '500'
              }}
            >
              Pricing
            </a>

            <div style={{ position: 'relative' }}>
              <button 
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '0.25rem', 
                  color: '#2C2C2E', 
                  cursor: 'pointer', 
                  border: 'none', 
                  background: 'none', 
                  fontSize: '1rem' 
                }}
                onMouseEnter={() => setFeaturesOpen(true)}
                onMouseLeave={() => setFeaturesOpen(false)}
              >
                Features <ChevronDown style={{ width: '16px', height: '16px' }} />
              </button>
              {featuresOpen && (
                <div 
                  style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    marginTop: '0.5rem',
                    width: '224px',
                    backgroundColor: '#FFFFFF',
                    borderRadius: '8px',
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                    border: '1px solid #F4F4F6',
                    padding: '0.5rem 0'
                  }}
                  onMouseEnter={() => setFeaturesOpen(true)}
                  onMouseLeave={() => setFeaturesOpen(false)}
                >
                  <a href="/features/ai-article-generator" style={{ display: 'block', padding: '0.5rem 1rem', color: '#2C2C2E', textDecoration: 'none' }}>AI Article Generator</a>
                  <a href="/features/brand-voice-engine" style={{ display: 'block', padding: '0.5rem 1rem', color: '#2C2C2E', textDecoration: 'none' }}>Brand Voice Engine</a>
                  <a href="/features/research-assistant" style={{ display: 'block', padding: '0.5rem 1rem', color: '#2C2C2E', textDecoration: 'none' }}>Research Assistant</a>
                  <a href="/features/seo-optimization" style={{ display: 'block', padding: '0.5rem 1rem', color: '#2C2C2E', textDecoration: 'none' }}>SEO Optimization</a>
                </div>
              )}
            </div>

            <div style={{ position: 'relative' }}>
              <button 
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '0.25rem', 
                  color: '#2C2C2E', 
                  cursor: 'pointer', 
                  border: 'none', 
                  background: 'none', 
                  fontSize: '1rem' 
                }}
                onMouseEnter={() => setSolutionsOpen(true)}
                onMouseLeave={() => setSolutionsOpen(false)}
              >
                Solutions <ChevronDown style={{ width: '16px', height: '16px' }} />
              </button>
              {solutionsOpen && (
                <div 
                  style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    marginTop: '0.5rem',
                    width: '224px',
                    backgroundColor: '#FFFFFF',
                    borderRadius: '8px',
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                    border: '1px solid #F4F4F6',
                    padding: '0.5rem 0'
                  }}
                  onMouseEnter={() => setSolutionsOpen(true)}
                  onMouseLeave={() => setSolutionsOpen(false)}
                >
                  <a href="/solutions/content-marketing" style={{ display: 'block', padding: '0.5rem 1rem', color: '#2C2C2E', textDecoration: 'none' }}>Content Marketing</a>
                  <a href="/solutions/seo-teams" style={{ display: 'block', padding: '0.5rem 1rem', color: '#2C2C2E', textDecoration: 'none' }}>SEO Teams</a>
                  <a href="/solutions/agencies" style={{ display: 'block', padding: '0.5rem 1rem', color: '#2C2C2E', textDecoration: 'none' }}>Agencies</a>
                  <a href="/solutions/enterprise" style={{ display: 'block', padding: '0.5rem 1rem', color: '#2C2C2E', textDecoration: 'none' }}>Enterprise</a>
                </div>
              )}
            </div>

            <div style={{ position: 'relative' }}>
              <button 
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '0.25rem', 
                  color: '#2C2C2E', 
                  cursor: 'pointer', 
                  border: 'none', 
                  background: 'none', 
                  fontSize: '1rem' 
                }}
                onMouseEnter={() => setResourcesOpen(true)}
                onMouseLeave={() => setResourcesOpen(false)}
              >
                Resources <ChevronDown style={{ width: '16px', height: '16px' }} />
              </button>
              {resourcesOpen && (
                <div 
                  style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    marginTop: '0.5rem',
                    width: '224px',
                    backgroundColor: '#FFFFFF',
                    borderRadius: '8px',
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                    border: '1px solid #F4F4F6',
                    padding: '0.5rem 0'
                  }}
                  onMouseEnter={() => setResourcesOpen(true)}
                  onMouseLeave={() => setResourcesOpen(false)}
                >
                  <a href="/resources/documentation" style={{ display: 'block', padding: '0.5rem 1rem', color: '#2C2C2E', textDecoration: 'none' }}>Documentation</a>
                  <a href="/resources/blog" style={{ display: 'block', padding: '0.5rem 1rem', color: '#2C2C2E', textDecoration: 'none' }}>Blog</a>
                  <a href="/resources/support" style={{ display: 'block', padding: '0.5rem 1rem', color: '#2C2C2E', textDecoration: 'none' }}>Support</a>
                  <a href="/resources/community" style={{ display: 'block', padding: '0.5rem 1rem', color: '#2C2C2E', textDecoration: 'none' }}>Community</a>
                </div>
              )}
            </div>

            <button 
              style={{
                background: 'linear-gradient(to right, #217CEB, #4A42CC)',
                color: '#FFFFFF',
                padding: '0.75rem 1.5rem',
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer',
                fontWeight: 'bold',
                fontSize: '1rem'
              }}
            >
              Get Started
            </button>
          </div>

          {/* Mobile Menu Button */}
          <button 
            style={{ 
              display: 'none', 
              background: 'none', 
              border: 'none', 
              cursor: 'pointer' 
            }}
            className="md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X style={{ width: '24px', height: '24px' }} /> : <Menu style={{ width: '24px', height: '24px' }} />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div style={{ 
            display: 'none',
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            backgroundColor: '#FFFFFF',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
            padding: '1rem'
          }} className="md:hidden">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <a href="/pricing" style={{ color: '#2C2C2E', textDecoration: 'none', padding: '0.5rem 0' }}>Pricing</a>
              <a href="#" style={{ color: '#2C2C2E', textDecoration: 'none', padding: '0.5rem 0' }}>Features</a>
              <a href="#" style={{ color: '#2C2C2E', textDecoration: 'none', padding: '0.5rem 0' }}>Solutions</a>
              <a href="#" style={{ color: '#2C2C2E', textDecoration: 'none', padding: '0.5rem 0' }}>Resources</a>
              <button 
                style={{
                  background: 'linear-gradient(to right, #217CEB, #4A42CC)',
                  color: '#FFFFFF',
                  padding: '0.75rem 1.5rem',
                  borderRadius: '8px',
                  border: 'none',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  fontSize: '1rem',
                  width: '100%'
                }}
              >
                Get Started
              </button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navigation;

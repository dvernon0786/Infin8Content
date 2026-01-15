/**
 * Design System Compliance Dashboard
 * 
 * Interactive dashboard for monitoring design system compliance across the project.
 * Provides real-time metrics, violation tracking, and trend analysis.
 */

import React, { useState, useEffect } from 'react';
import { Card, Button, Badge, ProgressBar } from '@/components/ui';

interface ComplianceMetrics {
  overallScore: number;
  tokenCompliance: number;
  componentCompliance: number;
  accessibilityCompliance: number;
  performanceCompliance: number;
  trendData: TrendPoint[];
}

interface TrendPoint {
  date: string;
  score: number;
  violations: number;
  fixes: number;
}

interface ViolationData {
  type: string;
  count: number;
  severity: 'error' | 'warning';
  files: string[];
  examples: {
    file: string;
    line: number;
    message: string;
  }[];
}

interface FileCompliance {
  file: string;
  score: number;
  violations: number;
  lastChecked: string;
}

const ComplianceDashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<ComplianceMetrics | null>(null);
  const [violations, setViolations] = useState<ViolationData[]>([]);
  const [files, setFiles] = useState<FileCompliance[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedViolation, setSelectedViolation] = useState<string | null>(null);

  useEffect(() => {
    loadComplianceData();
  }, []);

  const loadComplianceData = async () => {
    try {
      // In a real implementation, this would fetch from an API
      const mockData = {
        overallScore: 87,
        tokenCompliance: 92,
        componentCompliance: 85,
        accessibilityCompliance: 94,
        performanceCompliance: 78,
        trendData: [
          { date: '2026-01-08', score: 75, violations: 45, fixes: 0 },
          { date: '2026-01-09', score: 78, violations: 38, fixes: 7 },
          { date: '2026-01-10', score: 82, violations: 28, fixes: 10 },
          { date: '2026-01-11', score: 85, violations: 22, fixes: 6 },
          { date: '2026-01-12', score: 87, violations: 18, fixes: 4 },
          { date: '2026-01-13', score: 87, violations: 18, fixes: 0 },
        ]
      };

      const mockViolations: ViolationData[] = [
        {
          type: 'hardcoded-color',
          count: 8,
          severity: 'error',
          files: ['src/components/Button.tsx', 'src/components/Card.tsx'],
          examples: [
            { file: 'src/components/Button.tsx', line: 15, message: 'Hard-coded color found: #217CEB' },
            { file: 'src/components/Card.tsx', line: 23, message: 'Hard-coded color found: #ffffff' }
          ]
        },
        {
          type: 'inline-style',
          count: 5,
          severity: 'error',
          files: ['src/components/Header.tsx', 'src/components/Footer.tsx'],
          examples: [
            { file: 'src/components/Header.tsx', line: 8, message: 'Inline style found' }
          ]
        },
        {
          type: 'arbitrary-spacing',
          count: 3,
          severity: 'warning',
          files: ['src/components/Layout.tsx'],
          examples: [
            { file: 'src/components/Layout.tsx', line: 12, message: 'Arbitrary spacing found: padding: 20px' }
          ]
        },
        {
          type: 'arbitrary-font-size',
          count: 2,
          severity: 'warning',
          files: ['src/components/Text.tsx'],
          examples: [
            { file: 'src/components/Text.tsx', line: 6, message: 'Arbitrary font size found: font-size: 14px' }
          ]
        }
      ];

      const mockFiles: FileCompliance[] = [
        { file: 'src/components/Button.tsx', score: 75, violations: 3, lastChecked: '2026-01-13T10:30:00Z' },
        { file: 'src/components/Card.tsx', score: 90, violations: 1, lastChecked: '2026-01-13T10:30:00Z' },
        { file: 'src/components/Header.tsx', score: 60, violations: 4, lastChecked: '2026-01-13T10:30:00Z' },
        { file: 'src/components/Footer.tsx', score: 85, violations: 2, lastChecked: '2026-01-13T10:30:00Z' },
        { file: 'src/components/Layout.tsx', score: 95, violations: 1, lastChecked: '2026-01-13T10:30:00Z' },
      ];

      setMetrics(mockData);
      setViolations(mockViolations);
      setFiles(mockFiles);
    } catch (error) {
      console.error('Failed to load compliance data:', error);
    } finally {
      setLoading(false);
    }
  };

  const runComplianceCheck = async () => {
    setLoading(true);
    try {
      // Trigger compliance check
      await fetch('/api/compliance-check', { method: 'POST' });
      await loadComplianceData();
    } catch (error) {
      console.error('Failed to run compliance check:', error);
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'var(--color-success)';
    if (score >= 80) return 'var(--color-warning)';
    return 'var(--color-error)';
  };

  const getSeverityColor = (severity: 'error' | 'warning') => {
    return severity === 'error' ? 'var(--color-error)' : 'var(--color-warning)';
  };

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '400px' 
      }}>
        <ProgressBar variant="brand" />
      </div>
    );
  }

  if (!metrics) {
    return (
      <Card>
        <div style={{ textAlign: 'center', padding: 'var(--spacing-xl)' }}>
          <h3>Unable to load compliance data</h3>
          <Button variant="primary" onClick={loadComplianceData}>
            Retry
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <div style={{ padding: 'var(--spacing-xl)' }}>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: 'var(--spacing-xl)'
      }}>
        <h1 style={{ fontSize: 'var(--font-h2)', margin: 0 }}>
          Design System Compliance Dashboard
        </h1>
        <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
          <Button variant="secondary" onClick={loadComplianceData}>
            Refresh
          </Button>
          <Button variant="primary" onClick={runComplianceCheck}>
            Run Check
          </Button>
        </div>
      </div>

      {/* Overall Metrics */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: 'var(--spacing-lg)',
        marginBottom: 'var(--spacing-xl)'
      }}>
        <Card>
          <h3 style={{ fontSize: 'var(--font-h4)', marginBottom: 'var(--spacing-sm)' }}>
            Overall Score
          </h3>
          <div style={{ 
            fontSize: 'var(--font-h2)', 
            fontWeight: 'var(--font-weight-bold)',
            color: getScoreColor(metrics.overallScore),
            marginBottom: 'var(--spacing-sm)'
          }}>
            {metrics.overallScore}%
          </div>
          <ProgressBar value={metrics.overallScore} variant="default" />
        </Card>

        <Card>
          <h3 style={{ fontSize: 'var(--font-h4)', marginBottom: 'var(--spacing-sm)' }}>
            Token Compliance
          </h3>
          <div style={{ 
            fontSize: 'var(--font-h2)', 
            fontWeight: 'var(--font-weight-bold)',
            color: getScoreColor(metrics.tokenCompliance),
            marginBottom: 'var(--spacing-sm)'
          }}>
            {metrics.tokenCompliance}%
          </div>
          <ProgressBar value={metrics.tokenCompliance} variant="success" />
        </Card>

        <Card>
          <h3 style={{ fontSize: 'var(--font-h4)', marginBottom: 'var(--spacing-sm)' }}>
            Component Compliance
          </h3>
          <div style={{ 
            fontSize: 'var(--font-h2)', 
            fontWeight: 'var(--font-weight-bold)',
            color: getScoreColor(metrics.componentCompliance),
            marginBottom: 'var(--spacing-sm)'
          }}>
            {metrics.componentCompliance}%
          </div>
          <ProgressBar value={metrics.componentCompliance} variant="brand" />
        </Card>

        <Card>
          <h3 style={{ fontSize: 'var(--font-h4)', marginBottom: 'var(--spacing-sm)' }}>
            Accessibility Compliance
          </h3>
          <div style={{ 
            fontSize: 'var(--font-h2)', 
            fontWeight: 'var(--font-weight-bold)',
            color: getScoreColor(metrics.accessibilityCompliance),
            marginBottom: 'var(--spacing-sm)'
          }}>
            {metrics.accessibilityCompliance}%
          </div>
          <ProgressBar value={metrics.accessibilityCompliance} variant="success" />
        </Card>
      </div>

      {/* Trend Chart */}
      <Card style={{ marginBottom: 'var(--spacing-xl)' }}>
        <h3 style={{ fontSize: 'var(--font-h4)', marginBottom: 'var(--spacing-md)' }}>
          Compliance Trend
        </h3>
        <div style={{ 
          display: 'flex', 
          alignItems: 'flex-end',
          gap: 'var(--spacing-xs)',
          height: '200px',
          padding: 'var(--spacing-md)',
          backgroundColor: 'var(--color-background-accent)',
          borderRadius: 'var(--radius-md)'
        }}>
          {metrics.trendData.map((point, index) => (
            <div
              key={index}
              style={{
                flex: 1,
                backgroundColor: 'var(--color-primary-blue)',
                borderRadius: 'var(--radius-sm)',
                height: `${(point.score / 100) * 100}%`,
                position: 'relative',
                cursor: 'pointer'
              }}
              title={`${point.date}: ${point.score}%`}
            >
              <div style={{
                position: 'absolute',
                top: '-20px',
                left: '50%',
                transform: 'translateX(-50%)',
                fontSize: 'var(--font-caption)',
                color: 'var(--color-text-muted)'
              }}>
                {point.score}%
              </div>
            </div>
          ))}
        </div>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between',
          marginTop: 'var(--spacing-sm)',
          fontSize: 'var(--font-caption)',
          color: 'var(--color-text-muted)'
        }}>
          {metrics.trendData.map((point, index) => (
            <span key={index}>{new Date(point.date).toLocaleDateString()}</span>
          ))}
        </div>
      </Card>

      {/* Violations Breakdown */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: '1fr 1fr',
        gap: 'var(--spacing-lg)',
        marginBottom: 'var(--spacing-xl)'
      }}>
        <Card>
          <h3 style={{ fontSize: 'var(--font-h4)', marginBottom: 'var(--spacing-md)' }}>
            Violations by Type
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)' }}>
            {violations.map((violation) => (
              <div
                key={violation.type}
                style={{
                  padding: 'var(--spacing-sm)',
                  backgroundColor: 'var(--color-background-accent)',
                  borderRadius: 'var(--radius-md)',
                  border: `1px solid ${getSeverityColor(violation.severity)}`,
                  cursor: 'pointer'
                }}
                onClick={() => setSelectedViolation(
                  selectedViolation === violation.type ? null : violation.type
                )}
              >
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <span style={{ fontWeight: 'var(--font-weight-medium)' }}>
                    {violation.type.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </span>
                  <Badge variant={violation.severity === 'error' ? 'error' : 'warning'}>
                    {violation.count}
                  </Badge>
                </div>
                
                {selectedViolation === violation.type && (
                  <div style={{ marginTop: 'var(--spacing-sm)' }}>
                    <div style={{ fontSize: 'var(--font-small)', marginBottom: 'var(--spacing-xs)' }}>
                      <strong>Files:</strong> {violation.files.join(', ')}
                    </div>
                    <div style={{ fontSize: 'var(--font-small)' }}>
                      <strong>Examples:</strong>
                    </div>
                    {violation.examples.slice(0, 3).map((example, index) => (
                      <div key={index} style={{ 
                        fontSize: 'var(--font-caption)', 
                        color: 'var(--color-text-muted)',
                        marginTop: 'var(--spacing-xs)'
                      }}>
                        {example.file}:{example.line} - {example.message}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <h3 style={{ fontSize: 'var(--font-h4)', marginBottom: 'var(--spacing-md)' }}>
            File Compliance
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)' }}>
            {files.map((file) => (
              <div
                key={file.file}
                style={{
                  padding: 'var(--spacing-sm)',
                  backgroundColor: 'var(--color-background-accent)',
                  borderRadius: 'var(--radius-md)',
                  border: `1px solid ${getScoreColor(file.score)}`
                }}
              >
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 'var(--spacing-xs)'
                }}>
                  <span style={{ 
                    fontSize: 'var(--font-small)',
                    fontWeight: 'var(--font-weight-medium')
                  }}>
                    {file.file.split('/').pop()}
                  </span>
                  <Badge variant={file.score >= 80 ? 'success' : file.score >= 60 ? 'warning' : 'error'}>
                    {file.score}%
                  </Badge>
                </div>
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between',
                  fontSize: 'var(--font-caption)',
                  color: 'var(--color-text-muted)'
                }}>
                  <span>{file.violations} violations</span>
                  <span>{new Date(file.lastChecked).toLocaleDateString()}</span>
                </div>
                <ProgressBar value={file.score} size="sm" />
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Actions */}
      <Card>
        <h3 style={{ fontSize: 'var(--font-h4)', marginBottom: 'var(--spacing-md)' }}>
          Quick Actions
        </h3>
        <div style={{ display: 'flex', gap: 'var(--spacing-md)', flexWrap: 'wrap' }}>
          <Button variant="primary" onClick={runComplianceCheck}>
            Run Full Compliance Check
          </Button>
          <Button variant="secondary">
            Export Report
          </Button>
          <Button variant="secondary">
            Schedule Automated Check
          </Button>
          <Button variant="ghost">
            View Documentation
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default ComplianceDashboard;

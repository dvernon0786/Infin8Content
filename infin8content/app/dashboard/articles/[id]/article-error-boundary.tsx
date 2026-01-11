'use client';

import { NavigationErrorBoundary } from '@/components/navigation/navigation-error-boundary';
import { ReactNode } from 'react';

interface ArticleErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

function ArticleErrorBoundary({ children, fallback }: ArticleErrorBoundaryProps) {
  return (
    <NavigationErrorBoundary
      onError={(error, errorInfo) => {
        console.error('Article page error:', error, errorInfo);
        // In production, send to error reporting service
      }}
      fallback={fallback}
    >
      {children}
    </NavigationErrorBoundary>
  );
}

export default ArticleErrorBoundary;

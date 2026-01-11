/**
 * Breadcrumb navigation component
 * Story 15.3: Navigation and Access to Completed Articles
 */

import React from 'react';
import { ChevronRight, Home } from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';

interface BreadcrumbItem {
  label: string;
  href?: string;
  isCurrent?: boolean;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
  showHome?: boolean;
  homeHref?: string;
}

export function Breadcrumb({
  items,
  className = 'text-xs sm:text-sm',
  showHome = true,
  homeHref = '/dashboard',
}: BreadcrumbProps) {
  const allItems = showHome
    ? [
        { label: 'Home', href: homeHref },
        ...items,
      ]
    : items;

  return (
    <nav 
      aria-label="Breadcrumb navigation"
      className={cn('flex items-center space-x-1 text-sm', className)}
    >
      <ol className="flex items-center space-x-1">
        {allItems.map((item, index) => {
          const isLast = index === allItems.length - 1;
          const isFirst = index === 0;

          return (
            <li key={index} className="flex items-center">
              {index > 0 && (
                <ChevronRight className="h-4 w-4 text-gray-400 mx-1 flex-shrink-0" />
              )}
              
              {item.href && !item.isCurrent ? (
                <Link
                  href={item.href}
                  className={cn(
                    'flex items-center hover:text-blue-600 transition-colors',
                    'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded',
                    // Mobile responsive
                    'text-xs sm:text-sm',
                    // Home icon styling
                    isFirst && 'flex items-center gap-1'
                  )}
                  aria-current={item.isCurrent ? 'page' : undefined}
                >
                  {isFirst && showHome && <Home className="h-4 w-4" />}
                  <span className="truncate max-w-24 sm:max-w-32 md:max-w-48">
                    {item.label}
                  </span>
                </Link>
              ) : (
                <span
                  className={cn(
                    'text-gray-600 font-medium',
                    'text-xs sm:text-sm',
                    'truncate max-w-24 sm:max-w-32 md:max-w-48',
                    isFirst && showHome && 'flex items-center gap-1'
                  )}
                >
                  <span 
                    aria-current="page"
                    className="truncate"
                  >
                    {isFirst && showHome && <Home className="h-4 w-4" />}
                    <span className="truncate">{item.label}</span>
                  </span>
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

// Helper function to generate article breadcrumbs
export function generateArticleBreadcrumbs(articleTitle: string, articleId: string): BreadcrumbItem[] {
  return [
    { label: 'Articles', href: '/dashboard/articles' },
    { 
      label: articleTitle || `Article ${articleId.slice(0, 8)}...`, 
      isCurrent: true 
    },
  ];
}

// Mobile-optimized breadcrumb component
export function MobileBreadcrumb({ items, className }: { items: BreadcrumbItem[]; className?: string }) {
  return (
    <Breadcrumb 
      items={items} 
      className={cn('text-xs', className)}
      showHome={false}
    />
  );
}

export default Breadcrumb;

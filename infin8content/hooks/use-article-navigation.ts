/**
 * Shared navigation hook for article navigation
 * Story 15.3: Navigation and Access to Completed Articles
 */

import { useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';

interface UseArticleNavigationOptions {
  onError?: (error: Error, context: string) => void;
  onSuccess?: (articleId: string) => void;
}

interface NavigationState {
  isNavigating: boolean;
  error: Error | null;
}

export function useArticleNavigation(options: UseArticleNavigationOptions = {}) {
  const router = useRouter();
  const [navigationState, setNavigationState] = useState<NavigationState>({
    isNavigating: false,
    error: null,
  });
  
  // Store element refs for focus restoration
  const elementRefs = useRef<Map<string, HTMLElement>>(new Map());

  const navigateToArticle = useCallback(async (articleId: string, element?: HTMLElement) => {
    if (navigationState.isNavigating) return;

    setNavigationState({ isNavigating: true, error: null });

    try {
      // Store the current element for potential focus restoration
      if (element) {
        elementRefs.current.set(articleId, element);
      }

      // Navigate to article
      await router.push(`/dashboard/articles/${articleId}`);
      
      // Call success callback
      options.onSuccess?.(articleId);
      
      // Focus restoration will be handled by the destination page
    } catch (error) {
      const err = error as Error;
      setNavigationState({ isNavigating: false, error: err });
      
      // Call error callback
      options.onError?.(err, 'navigateToArticle');
      
      // Restore focus if navigation fails
      const elementToFocus = element || elementRefs.current.get(articleId);
      if (elementToFocus) {
        elementToFocus.focus();
      }
      
      throw err;
    }
  }, [navigationState.isNavigating, router, options]);

  const resetNavigation = useCallback(() => {
    setNavigationState({ isNavigating: false, error: null });
  }, []);

  const registerElement = useCallback((articleId: string, element: HTMLElement) => {
    elementRefs.current.set(articleId, element);
  }, []);

  const unregisterElement = useCallback((articleId: string) => {
    elementRefs.current.delete(articleId);
  }, []);

  // Keyboard navigation handler
  const handleKeyDown = useCallback((articleId: string, event: React.KeyboardEvent, element?: HTMLElement) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      navigateToArticle(articleId, element);
    }
  }, [navigateToArticle]);

  // Touch navigation handler for mobile with performance optimization
  const handleTouchEnd = useCallback((articleId: string, event: React.TouchEvent, element?: HTMLElement) => {
    // Prevent default to avoid any browser default behavior
    event.preventDefault()
    
    // Debounce rapid touch events for better mobile performance
    const now = Date.now()
    if (elementRefs.current.has(`${articleId}-last-touch`)) {
      const lastTouch = elementRefs.current.get(`${articleId}-last-touch`) as any
      if (now - lastTouch < 300) {
        return // Ignore rapid touches
      }
    }
    
    // Store touch timestamp for debouncing
    const tempElement = document.createElement('div')
    tempElement.setAttribute('data-timestamp', now.toString())
    elementRefs.current.set(`${articleId}-last-touch`, tempElement as any)
    
    // Navigate with slight delay for better UX
    setTimeout(() => {
      navigateToArticle(articleId, element)
    }, 50)
  }, [navigateToArticle]);

  // Touch start handler for visual feedback
  const handleTouchStart = useCallback((articleId: string, event: React.TouchEvent, element?: HTMLElement) => {
    // Add visual feedback for touch
    if (element) {
      element.style.transform = 'scale(0.98)'
      element.style.transition = 'transform 0.1s ease'
    }
    
    // Store touch start time
    const tempElement = document.createElement('div')
    tempElement.setAttribute('data-touch-start', Date.now().toString())
    elementRefs.current.set(`${articleId}-touch-start`, tempElement as any)
  }, []);

  // Touch move handler for canceling touches
  const handleTouchMove = useCallback((articleId: string, event: React.TouchEvent, element?: HTMLElement) => {
    // Reset visual feedback if user moves finger
    if (element) {
      element.style.transform = 'scale(1)'
    }
    
    // Cancel the touch
    elementRefs.current.delete(`${articleId}-touch-start`)
  }, []);

  return {
    navigateToArticle,
    isNavigating: navigationState.isNavigating,
    navigationError: navigationState.error,
    resetNavigation,
    registerElement,
    unregisterElement,
    handleKeyDown,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
  };
}

/**
 * Hook-specific type for article navigation props
 */
export interface ArticleNavigationProps {
  articleId: string;
  isCompleted: boolean;
  className?: string;
  children?: React.ReactNode;
  onClick?: (articleId: string) => void;
}

/**
 * Enhanced navigation hook with accessibility features
 */
export function useAccessibleArticleNavigation(options: UseArticleNavigationOptions = {}) {
  const navigation = useArticleNavigation(options);

  const getAccessibilityProps = useCallback((articleId: string, title?: string) => {
    return {
      role: 'button' as const,
      tabIndex: 0,
      'aria-label': `completed article: ${title || articleId}, click to view`,
      'aria-busy': navigation.isNavigating,
      onKeyDown: (e: React.KeyboardEvent) => navigation.handleKeyDown(articleId, e),
    };
  }, [navigation]);

  const getNavigationProps = useCallback((articleId: string, title?: string) => {
    return {
      ...getAccessibilityProps(articleId, title),
      onClick: () => navigation.navigateToArticle(articleId),
      disabled: navigation.isNavigating,
      title: 'Click to view completed article',
    };
  }, [navigation, getAccessibilityProps]);

  return {
    ...navigation,
    getAccessibilityProps,
    getNavigationProps,
  };
}

export default useArticleNavigation;

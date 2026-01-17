/**
 * Swipe Navigation Wrapper Component
 * 
 * Client component wrapper for SwipeNavigation to avoid server/client boundary issues
 */

"use client"

import React from 'react'
import { SwipeNavigation } from './swipe-navigation'

interface SwipeNavigationWrapperProps {
  children: React.ReactNode
}

export const SwipeNavigationWrapper: React.FC<SwipeNavigationWrapperProps> = ({ children }) => {
  return (
    <SwipeNavigation
      onPullToRefresh={() => window.location.reload()}
      onSwipeLeft={() => console.log('Swipe left - navigate to next section')}
      onSwipeRight={() => console.log('Swipe right - navigate to previous section')}
      enablePullToRefresh={true}
      enableSwipeNavigation={true}
    >
      {children}
    </SwipeNavigation>
  )
}

export default SwipeNavigationWrapper

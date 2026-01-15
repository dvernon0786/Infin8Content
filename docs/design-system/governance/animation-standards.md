# Animation and Transition Standards

## Overview

This document defines the standards for animations and transitions in the Infin8Content design system. These standards ensure consistent, performant, and accessible motion throughout the application.

## Animation Principles

### 1. Purpose-Driven Animation
Animations should serve a clear purpose and enhance user experience without being distracting.

#### ✅ Good Animation Purposes
- **Feedback**: Provide visual feedback for user actions
- **Guidance**: Guide user attention to important elements
- **Continuity**: Create smooth transitions between states
- **Delight**: Add subtle personality without distraction
- **Loading**: Indicate system activity and progress

#### ❌ Animation Anti-Patterns
- Animations without purpose
- Excessive or distracting motion
- Animations that cause motion sickness
- Performance-heavy animations
- Inconsistent timing or easing

### 2. Accessibility First
All animations must respect user preferences and accessibility requirements.

#### ✅ Accessibility Requirements
- [ ] **Respect prefers-reduced-motion**: Disable animations for users who prefer reduced motion
- [ ] **Provide alternatives**: Ensure functionality works without animations
- [ ] **Avoid flashing**: No flashing content that could cause seizures
- [ ] **Maintain contrast**: Animated elements must maintain color contrast
- [ ] **Keyboard accessible**: Animations don't interfere with keyboard navigation

#### ✅ Reduced Motion Implementation
```css
/* Respect user preferences */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}

/* JavaScript implementation */
const shouldReduceMotion = () => {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
};

// Usage in components
const AnimatedComponent = () => {
  const [reducedMotion, setReducedMotion] = useState(false);
  
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mediaQuery.matches);
    
    const handleChange = (e) => setReducedMotion(e.matches);
    mediaQuery.addEventListener('change', handleChange);
    
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);
  
  return (
    <div 
      style={{
        transition: reducedMotion ? 'none' : 'all 0.2s ease'
      }}
    >
      Content
    </div>
  );
};
```

## Animation Tokens

### 1. Duration Tokens
```css
/* Animation durations */
--duration-instant: 0ms;        /* No animation */
--duration-fast: 150ms;         /* Quick transitions */
--duration-normal: 200ms;       /* Standard transitions */
--duration-slow: 300ms;         /* Slower transitions */
--duration-slower: 500ms;       /* Slow transitions */
--duration-slowest: 1000ms;      /* Very slow transitions */
```

### 2. Easing Tokens
```css
/* Easing functions */
--ease-linear: linear;                    /* Constant speed */
--ease-in: cubic-bezier(0.4, 0, 1, 1);    /* Start slow, end fast */
--ease-out: cubic-bezier(0, 0, 0.2, 1);   /* Start fast, end slow */
--ease-in-out: cubic-bezier(0.4, 0, 0.2, 1); /* Slow start and end */
--ease-bounce: cubic-bezier(0.68, -0.55, 0.265, 1.55); /* Bounce effect */
--ease-elastic: cubic-bezier(0.68, -0.6, 0.32, 1.6); /* Elastic effect */
```

### 3. Delay Tokens
```css
/* Animation delays */
--delay-none: 0ms;            /* No delay */
--delay-short: 100ms;         /* Short delay */
--delay-medium: 200ms;        /* Medium delay */
--delay-long: 300ms;           /* Long delay */
--delay-longer: 500ms;        /* Longer delay */
```

## Standard Animations

### 1. Hover Animations
#### ✅ Hover State Standards
```css
/* Standard hover animation */
.hover-animation {
  transition: all var(--duration-normal) var(--ease-out);
}

.hover-animation:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

/* Implementation */
const HoverCard = ({ children }) => {
  const [isHovered, setIsHovered] = useState(false);
  
  return (
    <div
      style={{
        transition: `all var(--duration-normal) var(--ease-out)`,
        transform: isHovered ? 'translateY(-2px)' : 'translateY(0)',
        boxShadow: isHovered ? 'var(--shadow-md)' : 'var(--shadow-sm)'
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {children}
    </div>
  );
};
```

### 2. Focus Animations
#### ✅ Focus State Standards
```css
/* Focus animation */
.focus-animation {
  transition: all var(--duration-fast) var(--ease-out);
}

.focus-animation:focus {
  outline: 2px solid var(--color-primary-blue);
  outline-offset: 2px;
  box-shadow: 0 0 0 4px rgba(33, 124, 235, 0.2);
}

/* Implementation */
const FocusableButton = ({ children, ...props }) => {
  const [isFocused, setIsFocused] = useState(false);
  
  return (
    <button
      style={{
        transition: `all var(--duration-fast) var(--ease-out)`,
        outline: isFocused ? '2px solid var(--color-primary-blue)' : 'none',
        outlineOffset: isFocused ? '2px' : '0',
        boxShadow: isFocused ? '0 0 0 4px rgba(33, 124, 235, 0.2)' : 'none'
      }}
      onFocus={() => setIsFocused(true)}
      onBlur={() => setIsFocused(false)}
      {...props}
    >
      {children}
    </button>
  );
};
```

### 3. Loading Animations
#### ✅ Loading State Standards
```css
/* Loading spinner animation */
@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.loading-spinner {
  animation: spin var(--duration-slow) var(--ease-linear) infinite;
}

/* Pulse animation */
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.loading-pulse {
  animation: pulse var(--duration-normal) var(--ease-in-out) infinite;
}

/* Implementation */
const LoadingSpinner = ({ size = 'md' }) => {
  const sizes = {
    sm: { width: '16px', height: '16px' },
    md: { width: '24px', height: '24px' },
    lg: { width: '32px', height: '32px' }
  };
  
  return (
    <div
      style={{
        ...sizes[size],
        border: '2px solid var(--color-border-light)',
        borderTop: '2px solid var(--color-primary-blue)',
        borderRadius: 'var(--radius-full)',
        animation: `spin var(--duration-slow) var(--ease-linear) infinite`
      }}
    />
  );
};

const LoadingPulse = ({ children }) => {
  return (
    <div
      style={{
        animation: `pulse var(--duration-normal) var(--ease-in-out) infinite`
      }}
    >
      {children}
    </div>
  );
};
```

### 4. Transition Animations
#### ✅ State Transition Standards
```css
/* Fade animation */
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes fadeOut {
  from { opacity: 1; }
  to { opacity: 0; }
}

.fade-in {
  animation: fadeIn var(--duration-normal) var(--ease-out);
}

.fade-out {
  animation: fadeOut var(--duration-normal) var(--ease-in);
}

/* Slide animation */
@keyframes slideInUp {
  from { 
    opacity: 0;
    transform: translateY(20px);
  }
  to { 
    opacity: 1;
    transform: translateY(0);
  }
}

.slide-in-up {
  animation: slideInUp var(--duration-normal) var(--ease-out);
}

/* Implementation */
const FadeIn = ({ children, duration = 'normal' }) => {
  const [isVisible, setIsVisible] = useState(false);
  
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 10);
    return () => clearTimeout(timer);
  }, []);
  
  return (
    <div
      style={{
        opacity: isVisible ? 1 : 0,
        transition: `opacity var(--duration-${duration}) var(--ease-out)`
      }}
    >
      {children}
    </div>
  );
};

const SlideInUp = ({ children }) => {
  const [isVisible, setIsVisible] = useState(false);
  
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 10);
    return () => clearTimeout(timer);
  }, []);
  
  return (
    <div
      style={{
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'translateY(0)' : 'translateY(20px)',
        transition: `all var(--duration-normal) var(--ease-out)`
      }}
    >
      {children}
    </div>
  );
};
```

## Component Animation Patterns

### 1. Modal Animations
#### ✅ Modal Animation Standards
```tsx
const Modal = ({ isOpen, children, onClose }) => {
  const [isAnimating, setIsAnimating] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);
  
  useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
      setTimeout(() => setIsAnimating(true), 10);
    } else {
      setIsAnimating(false);
      setTimeout(() => setShouldRender(false), 200);
    }
  }, [isOpen]);
  
  if (!shouldRender) return null;
  
  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        opacity: isAnimating ? 1 : 0,
        transition: `opacity var(--duration-normal) var(--ease-out)`
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: 'var(--color-background-primary)',
          borderRadius: 'var(--radius-lg)',
          padding: 'var(--spacing-lg)',
          transform: isAnimating ? 'scale(1)' : 'scale(0.9)',
          transition: `transform var(--duration-normal) var(--ease-out)`
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
};
```

### 2. Dropdown Animations
#### ✅ Dropdown Animation Standards
```tsx
const Dropdown = ({ trigger, children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  
  const handleToggle = () => {
    if (isOpen) {
      setIsAnimating(false);
      setTimeout(() => setIsOpen(false), 200);
    } else {
      setIsOpen(true);
      setTimeout(() => setIsAnimating(true), 10);
    }
  };
  
  return (
    <div style={{ position: 'relative' }}>
      <div onClick={handleToggle}>
        {trigger}
      </div>
      
      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            backgroundColor: 'var(--color-background-primary)',
            border: '1px solid var(--color-border-light)',
            borderRadius: 'var(--radius-md)',
            boxShadow: 'var(--shadow-lg)',
            overflow: 'hidden',
            opacity: isAnimating ? 1 : 0,
            transform: isAnimating ? 'translateY(0)' : 'translateY(-10px)',
            transition: `all var(--duration-normal) var(--ease-out)`
          }}
        >
          {children}
        </div>
      )}
    </div>
  );
};
```

### 3. Tab Animation
#### ✅ Tab Animation Standards
```tsx
const Tabs = ({ tabs, activeTab, onChange }) => {
  const [indicatorStyle, setIndicatorStyle] = useState({});
  const tabsRef = useRef([]);
  
  useEffect(() => {
    const activeTabElement = tabsRef.current[activeTab];
    if (activeTabElement) {
      setIndicatorStyle({
        left: activeTabElement.offsetLeft,
        width: activeTabElement.offsetWidth
      });
    }
  }, [activeTab]);
  
  return (
    <div style={{ position: 'relative' }}>
      <div style={{ display: 'flex', borderBottom: '1px solid var(--color-border-light)' }}>
        {tabs.map((tab, index) => (
          <button
            key={tab.id}
            ref={(el) => (tabsRef.current[index] = el)}
            onClick={() => onChange(index)}
            style={{
              padding: 'var(--spacing-sm) var(--spacing-md)',
              backgroundColor: 'transparent',
              border: 'none',
              color: index === activeTab ? 'var(--color-primary-blue)' : 'var(--color-text-secondary)',
              fontWeight: index === activeTab ? 'var(--font-weight-medium)' : 'var(--font-weight-normal)',
              transition: `all var(--duration-fast) var(--ease-out)`,
              cursor: 'pointer'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>
      
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          height: '2px',
          backgroundColor: 'var(--color-primary-blue)',
          transition: `all var(--duration-fast) var(--ease-out)`,
          ...indicatorStyle
        }}
      />
    </div>
  );
};
```

## Performance Guidelines

### 1. Animation Performance
#### ✅ Performance Best Practices
- [ ] **Use transform and opacity**: These properties are GPU-accelerated
- [ ] **Avoid layout thrashing**: Don't animate properties that trigger layout
- [ ] **Use will-change sparingly**: Only when necessary for performance
- [ ] **Keep animations short**: Prefer shorter durations for better performance
- [ ] **Test on low-end devices**: Ensure animations work on all devices

#### ✅ Performance Implementation
```css
/* Good: GPU-accelerated properties */
.performant-animation {
  transform: translateY(0);
  opacity: 1;
  transition: transform var(--duration-normal) var(--ease-out),
              opacity var(--duration-normal) var(--ease-out);
}

.performant-animation:hover {
  transform: translateY(-2px);
  opacity: 0.8;
}

/* Bad: Layout-triggering properties */
.non-performant-animation {
  width: 100px;
  height: 100px;
  margin: 10px;
  transition: width var(--duration-normal) var(--ease-out),
              height var(--duration-normal) var(--ease-out),
              margin var(--duration-normal) var(--ease-out);
}

/* Use will-change sparingly */
.will-change-animation {
  will-change: transform, opacity;
  transform: translateY(0);
  transition: transform var(--duration-normal) var(--ease-out);
}
```

### 2. Animation Testing
#### ✅ Performance Testing
```typescript
// Animation performance testing
const animationPerformanceTest = {
  measureFrameTime: (animation: () => void) => {
    const start = performance.now();
    animation();
    const end = performance.now();
    return end - start;
  },
  
  measureAnimationSmoothness: (element: HTMLElement) => {
    // Measure animation smoothness using requestAnimationFrame
    return new Promise((resolve) => {
      let frameCount = 0;
      let lastTime = performance.now();
      
      const measureFrame = (currentTime: number) => {
        frameCount++;
        if (currentTime - lastTime > 1000) {
          resolve(frameCount);
          return;
        }
        lastTime = currentTime;
        requestAnimationFrame(measureFrame);
      };
      
      requestAnimationFrame(measureFrame);
    });
  },
  
  testReducedMotion: (component: React.Component) => {
    // Test component respects prefers-reduced-motion
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    return mediaQuery.matches;
  }
};
```

## Animation Library Integration

### 1. Framer Motion Integration
#### ✅ Framer Motion Standards
```tsx
import { motion, AnimatePresence } from 'framer-motion';

const AnimatedButton = ({ children, ...props }) => {
  return (
    <motion.button
      whileHover={{ 
        scale: 1.02, 
        transition: { duration: 0.2 } 
      }}
      whileTap={{ 
        scale: 0.98, 
        transition: { duration: 0.1 } 
      }}
      style={{
        transition: 'all 0.2s ease'
      }}
      {...props}
    >
      {children}
    </motion.button>
  );
};

const AnimatedModal = ({ isOpen, children, onClose }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ duration: 0.2, delay: 0.1 }}
            style={{
              backgroundColor: 'var(--color-background-primary)',
              borderRadius: 'var(--radius-lg)',
              padding: 'var(--spacing-lg)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
```

### 2. CSS Animation Library
#### ✅ CSS Animation Standards
```css
/* Standard animation library */
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideInUp {
  from { 
    opacity: 0;
    transform: translateY(20px);
  }
  to { 
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes slideInDown {
  from { 
    opacity: 0;
    transform: translateY(-20px);
  }
  to { 
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes slideInLeft {
  from { 
    opacity: 0;
    transform: translateX(-20px);
  }
  to { 
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes slideInRight {
  from { 
    opacity: 0;
    transform: translateX(20px);
  }
  to { 
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes scaleIn {
  from { 
    opacity: 0;
    transform: scale(0.9);
  }
  to { 
    opacity: 1;
    transform: scale(1);
  }
}

@keyframes bounce {
  0%, 20%, 53%, 80%, 100% {
    transform: translateY(0);
  }
  40%, 43% {
    transform: translateY(-10px);
  }
}

/* Animation classes */
.animate-fade-in {
  animation: fadeIn var(--duration-normal) var(--ease-out);
}

.animate-slide-in-up {
  animation: slideInUp var(--duration-normal) var(--ease-out);
}

.animate-slide-in-down {
  animation: slideInDown var(--duration-normal) var(--ease-out);
}

.animate-slide-in-left {
  animation: slideInLeft var(--duration-normal) var(--ease-out);
}

.animate-slide-in-right {
  animation: slideInRight var(--duration-normal) var(--ease-out);
}

.animate-scale-in {
  animation: scaleIn var(--duration-normal) var(--ease-out);
}

.animate-bounce {
  animation: bounce var(--duration-slower) var(--ease-bounce);
}
```

## Testing and Validation

### 1. Animation Testing
#### ✅ Testing Requirements
```typescript
// Animation testing utilities
const animationTests = {
  testReducedMotion: (component: React.Component) => {
    // Test component respects prefers-reduced-motion
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const originalMatches = mediaQuery.matches;
    
    // Mock reduced motion
    Object.defineProperty(mediaQuery, 'matches', { value: true });
    
    // Test component behavior
    const result = testComponentBehavior(component);
    
    // Restore original value
    Object.defineProperty(mediaQuery, 'matches', { value: originalMatches });
    
    return result;
  },
  
  testAnimationPerformance: (component: React.Component) => {
    // Test animation performance
    const start = performance.now();
    
    // Trigger animation
    triggerAnimation(component);
    
    // Measure performance
    const end = performance.now();
    const duration = end - start;
    
    return {
      duration,
      isPerformant: duration < 16.67 // 60fps threshold
    };
  },
  
  testAccessibility: (component: React.Component) => {
    // Test accessibility compliance
    return {
      respectsReducedMotion: testReducedMotion(component),
      maintainsContrast: testContrastDuringAnimation(component),
      keyboardAccessible: testKeyboardNavigation(component)
    };
  }
};
```

### 2. Visual Regression Testing
#### ✅ Visual Testing Standards
```typescript
// Visual regression testing for animations
const visualRegressionTests = {
  captureAnimationStates: (component: React.Component) => {
    // Capture screenshots at different animation states
    const states = ['initial', 'hover', 'active', 'focus'];
    const screenshots = {};
    
    states.forEach(state => {
      screenshots[state] = captureScreenshot(component, state);
    });
    
    return screenshots;
  },
  
  compareAnimationStates: (before: Screenshots, after: Screenshots) => {
    // Compare animation states for regressions
    const differences = {};
    
    Object.keys(before).forEach(state => {
      differences[state] = compareImages(before[state], after[state]);
    });
    
    return differences;
  }
};
```

## Documentation and Examples

### 1. Animation Documentation
#### ✅ Documentation Requirements
- [ ] **Animation purpose**: Clear description of why animation exists
- [ ] **Usage examples**: Code examples for implementation
- [ ] **Accessibility notes**: How animation respects accessibility
- [ ] **Performance notes**: Performance considerations
- [ ] **Customization options**: How to customize animation

### 2. Component Examples
#### ✅ Example Components
```tsx
// Example: Animated Button
export const AnimatedButtonExample = () => {
  return (
    <div style={{ display: 'flex', gap: 'var(--spacing-md)' }}>
      <Button variant="primary" animated>
        Animated Button
      </Button>
      
      <Button variant="secondary" animated>
        Secondary Animated
      </Button>
      
      <Button variant="ghost" animated>
        Ghost Animated
      </Button>
    </div>
  );
};

// Example: Loading States
export const LoadingExample = () => {
  return (
    <div style={{ display: 'flex', gap: 'var(--spacing-lg)' }}>
      <LoadingSpinner size="sm" />
      <LoadingSpinner size="md" />
      <LoadingSpinner size="lg" />
      
      <LoadingPulse>
        <div style={{ 
          width: '100px', 
          height: '20px', 
          backgroundColor: 'var(--color-background-secondary)',
          borderRadius: 'var(--radius-sm)'
        }} />
      </LoadingPulse>
    </div>
  );
};
```

## Resources

### 📚 Documentation
- [Component Guidelines](./component-guidelines.md)
- [Accessibility Standards](./accessibility.md)
- [Performance Guidelines](../performance/)
- [Testing Standards](../testing/)

### 🛠 Tools
- [Animation Performance Monitor](../../tools/animation-monitor.js)
- [Reduced Motion Tester](../../tools/reduced-motion-tester.js)
- [Visual Regression Tester](../../tools/visual-regression.js)

### 📞 Support
- Design System Team: design-system@company.com
- Accessibility Issues: a11y@company.com
- Performance Issues: performance@company.com

---

**Last Updated**: January 15, 2026  
**Version**: 1.0.0  
**Next Review**: March 15, 2026

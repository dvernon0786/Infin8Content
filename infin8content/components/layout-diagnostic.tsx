'use client'

import { useState, useEffect, useRef } from 'react'

interface ElementMetrics {
  tagName: string
  classes: string[]
  width: number
  height: number
  offsetLeft: number
  offsetTop: number
  marginTop: number
  marginRight: number
  marginBottom: number
  marginLeft: number
  paddingTop: number
  paddingRight: number
  paddingBottom: number
  paddingLeft: number
  maxWidth: string
  minWidth: string
  position: string
  display: string
  flexGrow: string
  flexShrink: string
  flexBasis: string
  boundingRect: {
    x: number
    y: number
    width: number
    height: number
    top: number
    right: number
    bottom: number
    left: number
  }
}

interface ViewportMetrics {
  width: number
  height: number
  scrollX: number
  scrollY: number
}

interface DocumentMetrics {
  bodyWidth: number
  bodyHeight: number
  bodyScrollWidth: number
  bodyScrollHeight: number
  bodyClientWidth: number
  bodyClientHeight: number
  documentElementWidth: number
  documentElementHeight: number
  documentElementScrollWidth: number
  documentElementScrollHeight: number
}

interface LayoutData {
  viewport: ViewportMetrics
  document: DocumentMetrics
  elements: ElementMetrics[]
  timestamp: number
}

export function LayoutDiagnostic() {
  const [isMinimized, setIsMinimized] = useState(false)
  const [autoRefresh, setAutoRefresh] = useState(false)
  const [selectedElement, setSelectedElement] = useState<number | null>(null)
  const [layoutData, setLayoutData] = useState<LayoutData | null>(null)
  const [refreshInterval, setRefreshInterval] = useState<NodeJS.Timeout | null>(null)
  const panelRef = useRef<HTMLDivElement>(null)

  const getComputedStyles = (element: Element) => {
    const styles = window.getComputedStyle(element)
    return {
      marginTop: parseFloat(styles.marginTop) || 0,
      marginRight: parseFloat(styles.marginRight) || 0,
      marginBottom: parseFloat(styles.marginBottom) || 0,
      marginLeft: parseFloat(styles.marginLeft) || 0,
      paddingTop: parseFloat(styles.paddingTop) || 0,
      paddingRight: parseFloat(styles.paddingRight) || 0,
      paddingBottom: parseFloat(styles.paddingBottom) || 0,
      paddingLeft: parseFloat(styles.paddingLeft) || 0,
      maxWidth: styles.maxWidth,
      minWidth: styles.minWidth,
      position: styles.position,
      display: styles.display,
      flexGrow: styles.flexGrow,
      flexShrink: styles.flexShrink,
      flexBasis: styles.flexBasis,
    }
  }

  const getElementMetrics = (element: Element): ElementMetrics => {
    const htmlElement = element as HTMLElement
    const rect = htmlElement.getBoundingClientRect()
    const styles = getComputedStyles(element)

    return {
      tagName: element.tagName.toLowerCase(),
      classes: Array.from(element.classList),
      width: htmlElement.offsetWidth,
      height: htmlElement.offsetHeight,
      offsetLeft: htmlElement.offsetLeft,
      offsetTop: htmlElement.offsetTop,
      ...styles,
      boundingRect: {
        x: rect.x,
        y: rect.y,
        width: rect.width,
        height: rect.height,
        top: rect.top,
        right: rect.right,
        bottom: rect.bottom,
        left: rect.left,
      },
    }
  }

  const collectLayoutData = (): LayoutData => {
    const allElements = document.querySelectorAll('*')
    const elements: ElementMetrics[] = []

    allElements.forEach((element) => {
      try {
        elements.push(getElementMetrics(element))
      } catch (error) {
        // Skip elements that can't be measured
      }
    })

    return {
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight,
        scrollX: window.scrollX,
        scrollY: window.scrollY,
      },
      document: {
        bodyWidth: document.body.offsetWidth,
        bodyHeight: document.body.offsetHeight,
        bodyScrollWidth: document.body.scrollWidth,
        bodyScrollHeight: document.body.scrollHeight,
        bodyClientWidth: document.body.clientWidth,
        bodyClientHeight: document.body.clientHeight,
        documentElementWidth: document.documentElement.offsetWidth,
        documentElementHeight: document.documentElement.offsetHeight,
        documentElementScrollWidth: document.documentElement.scrollWidth,
        documentElementScrollHeight: document.documentElement.scrollHeight,
      },
      elements,
      timestamp: Date.now(),
    }
  }

  const refreshData = () => {
    const data = collectLayoutData()
    setLayoutData(data)
  }

  const copyElementMetrics = (element: ElementMetrics) => {
    const data = JSON.stringify(element, null, 2)
    navigator.clipboard.writeText(data).then(() => {
      console.log('Element metrics copied to clipboard')
    })
  }

  const copyAllMetrics = () => {
    if (layoutData) {
      const data = JSON.stringify(layoutData, null, 2)
      navigator.clipboard.writeText(data).then(() => {
        console.log('All layout metrics copied to clipboard')
      })
    }
  }

  const exportAsJSON = () => {
    if (layoutData) {
      const data = JSON.stringify(layoutData, null, 2)
      const blob = new Blob([data], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `layout-metrics-${new Date().toISOString()}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    }
  }

  useEffect(() => {
    refreshData()

    const handleResize = () => {
      if (autoRefresh) {
        refreshData()
      }
    }

    const handleScroll = () => {
      if (autoRefresh) {
        refreshData()
      }
    }

    window.addEventListener('resize', handleResize)
    window.addEventListener('scroll', handleScroll)

    return () => {
      window.removeEventListener('resize', handleResize)
      window.removeEventListener('scroll', handleScroll)
    }
  }, [autoRefresh])

  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(refreshData, 1000)
      setRefreshInterval(interval)
    } else {
      if (refreshInterval) {
        clearInterval(refreshInterval)
        setRefreshInterval(null)
      }
    }

    return () => {
      if (refreshInterval) {
        clearInterval(refreshInterval)
      }
    }
  }, [autoRefresh])

  if (!layoutData) {
    return null
  }

  const selectedElementData = selectedElement !== null 
    ? layoutData.elements[selectedElement] 
    : null

  return (
    <div 
      ref={panelRef}
      className="fixed bottom-4 right-4 bg-white border border-gray-300 rounded-lg shadow-lg z-50 font-mono text-xs"
      style={{
        width: isMinimized ? '200px' : '400px',
        maxHeight: isMinimized ? 'auto' : '600px',
      }}
    >
      {/* Header */}
      <div className="bg-gray-100 px-3 py-2 border-b border-gray-300 rounded-t-lg flex justify-between items-center">
        <span className="font-semibold text-xs">Layout Diagnostic</span>
        <div className="flex gap-1">
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`px-2 py-1 text-xs rounded ${autoRefresh ? 'bg-green-500 text-white' : 'bg-gray-200'}`}
            title={autoRefresh ? 'Auto-refresh ON' : 'Auto-refresh OFF'}
          >
            {autoRefresh ? '🔄' : '⏸'}
          </button>
          <button
            onClick={refreshData}
            className="px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
            title="Manual refresh"
          >
            🔄
          </button>
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="px-2 py-1 text-xs bg-gray-500 text-white rounded hover:bg-gray-600"
            title={isMinimized ? 'Maximize' : 'Minimize'}
          >
            {isMinimized ? '📊' : '📉'}
          </button>
        </div>
      </div>

      {isMinimized ? (
        /* Minimized view */
        <div className="p-3">
          <div className="text-xs space-y-1">
            <div>📱 {layoutData.viewport.width}×{layoutData.viewport.height}</div>
            <div>📄 {layoutData.elements.length} elements</div>
            <div>📍 {Math.round(layoutData.viewport.scrollX)}, {Math.round(layoutData.viewport.scrollY)}</div>
          </div>
        </div>
      ) : (
        /* Full view */
        <div className="overflow-hidden">
          {/* Viewport Info */}
          <div className="p-3 border-b border-gray-200">
            <div className="text-xs space-y-1">
              <div>📱 Viewport: {layoutData.viewport.width}×{layoutData.viewport.height}</div>
              <div>📍 Scroll: ({Math.round(layoutData.viewport.scrollX)}, {Math.round(layoutData.viewport.scrollY)})</div>
              <div>📄 Elements: {layoutData.elements.length}</div>
              <div className="flex gap-1 mt-2">
                <button
                  onClick={copyAllMetrics}
                  className="px-2 py-1 text-xs bg-purple-500 text-white rounded hover:bg-purple-600"
                >
                  📋 Copy All
                </button>
                <button
                  onClick={exportAsJSON}
                  className="px-2 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600"
                >
                  💾 Export JSON
                </button>
              </div>
            </div>
          </div>

          {/* Elements List */}
          <div className="overflow-y-auto" style={{ maxHeight: '200px' }}>
            {layoutData.elements.slice(0, 50).map((element, index) => (
              <div
                key={index}
                className={`px-3 py-2 border-b border-gray-100 cursor-pointer hover:bg-gray-50 ${
                  selectedElement === index ? 'bg-blue-50' : ''
                }`}
                onClick={() => setSelectedElement(index)}
              >
                <div className="flex justify-between items-center">
                  <span className="font-semibold">
                    {element.tagName}
                    {element.classes.length > 0 && (
                      <span className="text-gray-500 ml-1">
                        .{element.classes.slice(0, 2).join('.')}
                        {element.classes.length > 2 && '...'}
                      </span>
                    )}
                  </span>
                  <span className="text-gray-600">
                    {element.width}×{element.height}
                  </span>
                </div>
              </div>
            ))}
            {layoutData.elements.length > 50 && (
              <div className="px-3 py-2 text-center text-gray-500 text-xs">
                ... and {layoutData.elements.length - 50} more elements
              </div>
            )}
          </div>

          {/* Selected Element Details */}
          {selectedElementData && (
            <div className="border-t border-gray-200">
              <div className="p-3 bg-gray-50">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-semibold text-xs">
                    {selectedElementData.tagName}
                    {selectedElementData.classes.length > 0 && (
                      <span className="text-gray-500 ml-1">
                        .{selectedElementData.classes.join('.')}
                      </span>
                    )}
                  </span>
                  <button
                    onClick={() => copyElementMetrics(selectedElementData)}
                    className="px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
                  >
                    📋 Copy
                  </button>
                </div>
                
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <strong>Size:</strong> {selectedElementData.width}×{selectedElementData.height}
                  </div>
                  <div>
                    <strong>Position:</strong> ({selectedElementData.offsetLeft}, {selectedElementData.offsetTop})
                  </div>
                  <div>
                    <strong>Display:</strong> {selectedElementData.display}
                  </div>
                  <div>
                    <strong>Position:</strong> {selectedElementData.position}
                  </div>
                  <div>
                    <strong>Margin:</strong> {selectedElementData.marginTop}px {selectedElementData.marginRight}px {selectedElementData.marginBottom}px {selectedElementData.marginLeft}px
                  </div>
                  <div>
                    <strong>Padding:</strong> {selectedElementData.paddingTop}px {selectedElementData.paddingRight}px {selectedElementData.paddingBottom}px {selectedElementData.paddingLeft}px
                  </div>
                  <div>
                    <strong>Max-width:</strong> {selectedElementData.maxWidth}
                  </div>
                  <div>
                    <strong>Min-width:</strong> {selectedElementData.minWidth}
                  </div>
                  {selectedElementData.display.includes('flex') && (
                    <>
                      <div>
                        <strong>Flex-grow:</strong> {selectedElementData.flexGrow}
                      </div>
                      <div>
                        <strong>Flex-shrink:</strong> {selectedElementData.flexShrink}
                      </div>
                      <div>
                        <strong>Flex-basis:</strong> {selectedElementData.flexBasis}
                      </div>
                    </>
                  )}
                  <div className="col-span-2">
                    <strong>Bounding Rect:</strong> ({Math.round(selectedElementData.boundingRect.x)}, {Math.round(selectedElementData.boundingRect.y)}) {Math.round(selectedElementData.boundingRect.width)}×{Math.round(selectedElementData.boundingRect.height)}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

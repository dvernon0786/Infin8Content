/**
 * Simple Chart Component
 * No external dependencies - pure HTML/CSS implementation
 */

'use client'

import React from 'react'
import './chart-design-system.css'

interface SimpleLineChartProps {
  data: Array<{ timestamp: string; value: number }>
  width?: number
  height?: number
  color?: string
}

export function SimpleLineChart({ data, width = 400, height = 200, color = 'var(--color-primary)' }: SimpleLineChartProps) {
  // Determine CSS class based on dimensions
  const getContainerClass = (w: number, h: number) => {
    if (w === 400 && h === 200) return 'chart-container-400-200'
    if (w === 400 && h === 300) return 'chart-container-400-300'
    if (w === 200 && h === 200) return 'chart-container-200-200'
    if (w === 600 && h === 300) return 'chart-container-600-300'
    return 'chart-medium' // fallback
  }

  if (!data || data.length === 0) {
    return (
      <div className={`${getContainerClass(width, height)} flex items-center justify-center border border-gray-200 rounded-lg bg-gray-50`}>
        <span className="text-gray-500 text-sm">No data available</span>
      </div>
    )
  }

  const maxValue = Math.max(...data.map(d => d.value))
  const minValue = Math.min(...data.map(d => d.value))
  const range = maxValue - minValue || 1

  const points = data.map((point, index) => {
    const x = (index / (data.length - 1)) * width
    const y = height - ((point.value - minValue) / range) * height * 0.8 - height * 0.1
    return `${x},${y}`
  }).join(' ')

  return (
    <div className={`${getContainerClass(width, height)} relative border border-gray-200 rounded-lg bg-white`}>
      <svg width={width} height={height} className="overflow-visible">
        {/* Grid lines */}
        {[0, 1, 2, 3, 4].map(i => (
          <line
            key={i}
            x1={0}
            y1={(height / 4) * i}
            x2={width}
            y2={(height / 4) * i}
            stroke="var(--color-border)"
            strokeWidth="1"
          />
        ))}
        
        {/* Data line */}
        <polygraph
          points={points}
          fill="none"
          stroke={color}
          strokeWidth="2"
        />
        
        {/* Data points */}
        {data.map((point, index) => {
          const x = (index / (data.length - 1)) * width
          const y = height - ((point.value - minValue) / range) * height * 0.8 - height * 0.1
          return (
            <circle
              key={index}
              cx={x}
              cy={y}
              r="3"
              fill={color}
              className="hover:r-4 transition-all"
            />
          )
        })}
      </svg>
      
      {/* Labels */}
      <div className="absolute bottom-0 left-0 right-0 flex justify-between text-xs text-gray-500 px-2">
        <span>{data[0]?.timestamp?.split('T')[1]?.slice(0, 5) || ''}</span>
        <span>{data[data.length - 1]?.timestamp?.split('T')[1]?.slice(0, 5) || ''}</span>
      </div>
    </div>
  )
}

interface SimpleBarChartProps {
  data: Array<{ name: string; value: number }>
  width?: number
  height?: number
  color?: string
}

export function SimpleBarChart({ data, width = 400, height = 200, color = 'var(--color-primary)' }: SimpleBarChartProps) {
  // Determine CSS class based on dimensions
  const getContainerClass = (w: number, h: number) => {
    if (w === 400 && h === 200) return 'chart-container-400-200'
    if (w === 400 && h === 300) return 'chart-container-400-300'
    if (w === 200 && h === 200) return 'chart-container-200-200'
    if (w === 600 && h === 300) return 'chart-container-600-300'
    return 'chart-medium' // fallback
  }

  // Get bar width class based on calculated width
  const getBarWidthClass = (calculatedWidth: number) => {
    if (calculatedWidth <= 20) return 'bar-width-20'
    if (calculatedWidth <= 30) return 'bar-width-30'
    if (calculatedWidth <= 40) return 'bar-width-40'
    if (calculatedWidth <= 50) return 'bar-width-50'
    if (calculatedWidth <= 60) return 'bar-width-60'
    return 'bar-width-40' // fallback
  }

  // Get bar height class based on calculated height
  const getBarHeightClass = (calculatedHeight: number) => {
    const roundedHeight = Math.round(calculatedHeight / 10) * 10
    if (roundedHeight <= 10) return 'bar-height-10'
    if (roundedHeight <= 20) return 'bar-height-20'
    if (roundedHeight <= 30) return 'bar-height-30'
    if (roundedHeight <= 40) return 'bar-height-40'
    if (roundedHeight <= 50) return 'bar-height-50'
    if (roundedHeight <= 60) return 'bar-height-60'
    if (roundedHeight <= 70) return 'bar-height-70'
    if (roundedHeight <= 80) return 'bar-height-80'
    if (roundedHeight <= 90) return 'bar-height-90'
    if (roundedHeight <= 100) return 'bar-height-100'
    if (roundedHeight <= 110) return 'bar-height-110'
    if (roundedHeight <= 120) return 'bar-height-120'
    if (roundedHeight <= 130) return 'bar-height-130'
    if (roundedHeight <= 140) return 'bar-height-140'
    if (roundedHeight <= 150) return 'bar-height-150'
    return 'bar-height-40' // fallback
  }
  const getBarColorClass = (colorValue: string) => {
    if (colorValue === 'var(--color-primary)') return 'bar-color-primary'
    if (colorValue === 'var(--color-success)') return 'bar-color-success'
    if (colorValue === 'var(--color-warning)') return 'bar-color-warning'
    if (colorValue === 'var(--color-danger)') return 'bar-color-danger'
    if (colorValue === 'var(--color-info)') return 'bar-color-info'
    if (colorValue === 'var(--color-secondary)') return 'bar-color-secondary'
    return 'bar-color-primary' // fallback
  }

  if (!data || data.length === 0) {
    return (
      <div className={`${getContainerClass(width, height)} flex items-center justify-center border border-gray-200 rounded-lg bg-gray-50`}>
        <span className="text-gray-500 text-sm">No data available</span>
      </div>
    )
  }

  const maxValue = Math.max(...data.map(d => d.value))
  const barWidth = Math.max(20, Math.floor((width - 40) / data.length - 10))
  const barWidthClass = getBarWidthClass(barWidth)
  const barColorClass = getBarColorClass(color)

  return (
    <div className={`${getContainerClass(width, height)} relative border border-gray-200 rounded-lg bg-white p-4`}>
      <div className="relative h-full">
        {/* Bars */}
        <div className="absolute bottom-0 left-0 right-0 top-0 flex items-end justify-around">
          {data.map((item, index) => {
            const barHeight = (item.value / maxValue) * (height - 40)
            const barHeightClass = getBarHeightClass(barHeight)
            return (
              <div key={index} className="flex flex-col items-center">
                <div
                  className={`${barWidthClass} ${barColorClass} ${barHeightClass} bar-border-radius-top`}
                />
                <span className="text-xs text-gray-600 mt-2 text-center">
                  {item.name.slice(0, 8)}
                </span>
              </div>
            )
          })}
        </div>
        
        {/* Value labels */}
        <div className="absolute top-0 left-0 right-0 flex justify-around">
          {data.map((item, index) => (
            <span key={index} className="text-xs text-gray-700 font-medium">
              {item.value}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}

interface SimplePieChartProps {
  data: Array<{ name: string; value: number; color?: string }>
  width?: number
  height?: number
}

export function SimplePieChart({ data, width = 200, height = 200 }: SimplePieChartProps) {
  // Determine CSS class based on dimensions
  const getContainerClass = (w: number, h: number) => {
    if (w === 400 && h === 200) return 'chart-container-400-200'
    if (w === 400 && h === 300) return 'chart-container-400-300'
    if (w === 200 && h === 200) return 'chart-container-200-200'
    if (w === 600 && h === 300) return 'chart-container-600-300'
    return 'chart-medium' // fallback
  }

  if (!data || data.length === 0) {
    return (
      <div className={`${getContainerClass(width, height)} flex items-center justify-center border border-gray-200 rounded-lg bg-gray-50`}>
        <span className="text-gray-500 text-sm">No data available</span>
      </div>
    )
  }

  const total = data.reduce((sum, item) => sum + item.value, 0)
  const colors = [
    'var(--color-primary)', 
    'var(--color-success)', 
    'var(--color-warning)', 
    'var(--color-danger)', 
    'var(--color-info)', 
    'var(--color-secondary)'
  ]
  // Get legend color class based on index
  const getLegendColorClass = (index: number) => {
    const colorClasses = [
      'legend-color-primary',
      'legend-color-success', 
      'legend-color-warning',
      'legend-color-danger',
      'legend-color-info',
      'legend-color-secondary'
    ]
    return colorClasses[index % colorClasses.length]
  }
  
  let currentAngle = 0
  const centerX = width / 2
  const centerY = height / 2
  const radius = Math.min(width, height) / 2 - 20

  return (
    <div className={`${getContainerClass(width, height)} relative border border-gray-200 rounded-lg bg-white p-4`}>
      <svg width={width - 32} height={height - 32} className="mx-auto">
        {data.map((item, index) => {
          const percentage = item.value / total
          const angle = percentage * 360
          const endAngle = currentAngle + angle
          
          const startRad = (currentAngle * Math.PI) / 180
          const endRad = (endAngle * Math.PI) / 180
          
          const x1 = centerX + Math.cos(startRad) * radius
          const y1 = centerY + Math.sin(startRad) * radius
          const x2 = centerX + Math.cos(endRad) * radius
          const y2 = centerY + Math.sin(endRad) * radius
          
          const largeArcFlag = angle > 180 ? 1 : 0
          
          const pathData = [
            `M ${centerX} ${centerY}`,
            `L ${x1} ${y1}`,
            `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
            'Z'
          ].join(' ')
          
          currentAngle = endAngle
          
          return (
            <path
              key={index}
              d={pathData}
              fill={colors[index % colors.length]}
              className="hover:opacity-80 transition-opacity"
            />
          )
        })}
      </svg>
      
      {/* Legend */}
      <div className="mt-2 space-y-1">
        {data.map((item, index) => (
          <div key={index} className="flex items-center justify-between text-xs">
            <div className="flex items-center">
              <div className={`w-3 h-3 rounded-sm mr-2 ${getLegendColorClass(index)}`} />
              <span className="text-gray-600">{item.name}</span>
            </div>
            <span className="text-gray-700 font-medium">
              {Math.round((item.value / total) * 100)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

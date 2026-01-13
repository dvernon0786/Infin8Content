"use client";

import { cn } from "@/lib/utils";
import { ProductCapabilityCardProps } from "@/types/marketing";
import Link from "next/link";
import { 
  Zap, Users, Search, BarChart3, FileText, TrendingUp, Shield, Clock, Target, Sparkles, Globe, Award 
} from "lucide-react";
import { useMemo } from "react";

// Icon mapping object
const iconMap = {
  Zap,
  Users,
  Search,
  BarChart3,
  FileText,
  TrendingUp,
  Shield,
  Clock,
  Target,
  Sparkles,
  Globe,
  Award
} as const;

export function ProductCapabilityCard({
  iconName,
  title,
  description,
  learnMoreLink,
  className
}: ProductCapabilityCardProps) {
  const Icon = useMemo(() => {
    const icon = iconMap[iconName as keyof typeof iconMap];
    if (!icon) {
      console.warn(`Icon "${iconName}" not found in iconMap. Available icons: ${Object.keys(iconMap).join(', ')}`);
    }
    return icon;
  }, [iconName]);
  
  if (!Icon) {
    return (
      <article className={cn("bg-white rounded-xl p-6 text-center border border-gray-100 opacity-50", className)}>
        <div className="w-12 h-12 mx-auto mb-4 flex items-center justify-center rounded-lg bg-gray-200">
          <span className="text-gray-500 text-xs">?</span>
        </div>
        <h3 className="font-semibold text-gray-900">{title}</h3>
        <p className="text-gray-600 text-sm mt-2">{description}</p>
      </article>
    );
  }
  return (
    <article 
      className={cn(
        "bg-white rounded-xl p-6 text-center transition-all duration-300 hover:shadow-lg hover:scale-[1.02] border border-gray-100 group",
        className
      )}
      style={{
        backgroundColor: 'var(--color-bg-surface)',
        borderRadius: 'var(--radius-lg)',
        padding: 'var(--spacing-lg)',
        border: '1px solid var(--color-border)'
      }}
    >
      {/* Icon */}
      <div 
        className="w-12 h-12 mx-auto mb-4 flex items-center justify-center rounded-lg transition-all duration-300 group-hover:shadow-md"
        style={{
          width: '48px',
          height: '48px',
          marginBottom: 'var(--spacing-md)',
          borderRadius: 'var(--radius-md)',
          background: 'linear-gradient(135deg, var(--color-primary-blue), var(--color-primary-purple))'
        }}
      >
        <Icon 
          className="w-6 h-6 text-white"
        />
      </div>

      {/* Content */}
      <div className="space-y-3">
        <h3 
          className="font-semibold text-gray-900"
          style={{
            fontSize: 'var(--font-body)',
            color: 'var(--color-text-primary)',
            fontWeight: 600
          }}
        >
          {title}
        </h3>
        
        <p 
          className="text-gray-600 text-sm leading-relaxed"
          style={{
            fontSize: '14px',
            color: 'var(--color-text-muted)',
            lineHeight: 1.6
          }}
        >
          {description}
        </p>

        {/* Learn More Link */}
        {learnMoreLink && (
          <Link
            href={learnMoreLink}
            className="inline-flex items-center text-blue-600 hover:text-purple-600 font-medium text-sm transition-all duration-200 hover:underline group/link"
            style={{
              color: 'var(--color-primary-blue)',
              fontWeight: 500,
              fontSize: '14px',
              transition: 'color 0.2s ease-in-out'
            }}
            aria-label={`Learn more about ${title}`}
          >
            Learn more
            <svg 
              className="w-4 h-4 ml-1 transition-transform duration-200 group-hover/link:translate-x-1"
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        )}
      </div>
    </article>
  );
}

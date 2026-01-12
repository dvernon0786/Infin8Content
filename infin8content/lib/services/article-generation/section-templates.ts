// Section Templates System
// Story 14.3: Section Templates System

export interface SectionTemplate {
  type: 'introduction' | 'h2' | 'h3' | 'conclusion' | 'faq'
  wordCount: number
  seoRules: {
    keywordPlacement: 'first_100_words' | 'distributed' | 'reinforcement'
    densityTarget: number
    semanticKeywords: string[]
    hookRequired: boolean
  }
  placeholders: string[]
  template: string
}

export interface TemplateContext {
  sectionType: SectionTemplate['type']
  keyword: string
  targetAudience: string
  contentType: 'blog_post' | 'comprehensive_guide' | 'business_guide' | 'technical_document'
  placeholderValues?: Record<string, string>
}

export interface TemplatePerformanceMetrics {
  cacheHitRate: number
  averageSelectionTime: number
  averageProcessingTime: number
  memoryUsage: number
}

// LRU Cache implementation for template caching
class LRUCache<K, V> {
  private cache = new Map<K, V>()
  private maxSize: number

  constructor(maxSize: number = 100) {
    this.maxSize = maxSize
  }

  get(key: K): V | undefined {
    const value = this.cache.get(key)
    if (value !== undefined && this.cache.has(key)) {
      // Move to end (most recently used)
      this.cache.delete(key)
      this.cache.set(key, value)
    }
    return value
  }

  set(key: K, value: V): void {
    if (this.cache.has(key)) {
      this.cache.delete(key)
    } else if (this.cache.size >= this.maxSize) {
      // Remove least recently used (first item)
      const firstKey = this.cache.keys().next().value
      if (firstKey !== undefined) {
        this.cache.delete(firstKey)
      }
    }
    this.cache.set(key, value)
  }

  clear(): void {
    this.cache.clear()
  }

  get size(): number {
    return this.cache.size
  }
}

// Template cache instance
const templateCache = new LRUCache<string, SectionTemplate>(100)

// Performance tracking
let performanceMetrics: TemplatePerformanceMetrics = {
  cacheHitRate: 0,
  averageSelectionTime: 0,
  averageProcessingTime: 0,
  memoryUsage: 0
}

const selectionTimes: number[] = []
const processingTimes: number[] = []
let cacheHits = 0
let cacheMisses = 0

// Introduction templates
const introductionTemplates: Record<string, SectionTemplate> = {
  general_blog: {
    type: 'introduction',
    wordCount: 120,
    seoRules: {
      keywordPlacement: 'first_100_words',
      densityTarget: 0.8,
      semanticKeywords: ['guide', 'tutorial', 'overview'],
      hookRequired: true
    },
    placeholders: ['{{keyword}}', '{{audience}}', '{{hook}}'],
    template: `{{hook}}

Welcome {{audience}} to our comprehensive guide on {{keyword}}. Understanding {{keyword}} is essential in today's digital landscape, and this article will provide you with the knowledge and tools you need to succeed.

In this guide, we'll explore the fundamental concepts of {{keyword}}, discuss best practices, and provide actionable insights you can implement immediately. Whether you're just getting started or looking to enhance your existing knowledge, this resource has something valuable for everyone.

Let's dive into the world of {{keyword}} and discover how it can transform your approach.`
  },

  business_guide: {
    type: 'introduction',
    wordCount: 150,
    seoRules: {
      keywordPlacement: 'first_100_words',
      densityTarget: 1.0,
      semanticKeywords: ['strategy', 'implementation', 'ROI'],
      hookRequired: true
    },
    placeholders: ['{{keyword}}', '{{audience}}', '{{benefit}}'],
    template: `In today's competitive business landscape, {{audience}} need every advantage they can get. {{keyword}} has emerged as a critical factor for success, with organizations reporting significant improvements in efficiency and profitability.

For {{audience}} specifically, implementing {{keyword}} strategies can lead to {{benefit}}. This comprehensive guide will walk you through the essential steps to leverage {{keyword}} for your business growth.

We'll cover practical implementation strategies, common challenges to avoid, and measurable outcomes you can expect. By the end of this guide, you'll have a clear roadmap for integrating {{keyword}} into your operations.`
  },

  comprehensive_guide: {
    type: 'introduction',
    wordCount: 130,
    seoRules: {
      keywordPlacement: 'first_100_words',
      densityTarget: 0.9,
      semanticKeywords: ['complete', 'in-depth', 'mastery'],
      hookRequired: true
    },
    placeholders: ['{{keyword}}', '{{audience}}', '{{scope}}'],
    template: `Mastering {{keyword}} is a journey that requires comprehensive understanding and practical application. This in-depth guide is designed specifically for {{audience}} who want to achieve expertise in {{keyword}}.

{{scope}} We'll leave no stone unturned as we explore every aspect of {{keyword}}, from basic principles to advanced techniques. This resource combines theoretical knowledge with real-world applications to ensure you can immediately apply what you learn.

Whether you're a beginner or have some experience with {{keyword}}, this guide will provide valuable insights and actionable strategies to enhance your skills and knowledge.`
  }
}

// H2 section templates
const h2Templates: Record<string, SectionTemplate> = {
  general_blog: {
    type: 'h2',
    wordCount: 600,
    seoRules: {
      keywordPlacement: 'distributed',
      densityTarget: 1.2,
      semanticKeywords: ['strategies', 'techniques', 'best practices'],
      hookRequired: false
    },
    placeholders: ['{{keyword}}', '{{sectionTitle}}', '{{examples}}'],
    template: `## {{sectionTitle}}

{{sectionTitle}} plays a crucial role in the broader context of {{keyword}}. Understanding this relationship is essential for developing effective strategies and achieving optimal results.

At its core, {{sectionTitle}} involves several key components that work together to create meaningful outcomes. Research shows that organizations implementing these approaches see significant improvements in their {{keyword}} initiatives.

### Key Components of {{sectionTitle}}

The foundation of {{sectionTitle}} rests on three pillars: strategic planning, execution excellence, and continuous optimization. Each pillar contributes to the overall success of your {{keyword}} efforts.

{{examples}}

### Implementation Strategies

When implementing {{sectionTitle}} within your {{keyword}} framework, consider the following strategies:

1. **Assessment Phase**: Evaluate your current state and identify opportunities for improvement
2. **Planning Phase**: Develop a comprehensive roadmap that aligns with your {{keyword}} goals
3. **Execution Phase**: Implement strategies with proper monitoring and adjustment
4. **Optimization Phase**: Continuously refine your approach based on results and feedback

### Common Challenges and Solutions

Many organizations face challenges when implementing {{sectionTitle}}. These include resource constraints, resistance to change, and technical difficulties. However, with proper planning and the right approach, these challenges can be overcome.

The key is to start small, demonstrate value quickly, and scale gradually. This approach minimizes risk while building momentum for larger {{keyword}} initiatives.`
  },

  business_guide: {
    type: 'h2',
    wordCount: 650,
    seoRules: {
      keywordPlacement: 'distributed',
      densityTarget: 1.4,
      semanticKeywords: ['business impact', 'ROI', 'implementation'],
      hookRequired: false
    },
    placeholders: ['{{keyword}}', '{{sectionTitle}}', '{{businessImpact}}'],
    template: `## {{sectionTitle}}

For business leaders, understanding the connection between {{sectionTitle}} and {{keyword}} is essential for driving growth and maintaining competitive advantage. {{businessImpact}} This section explores how strategic implementation can transform your operations.

### Business Impact Analysis

The implementation of {{sectionTitle}} within your {{keyword}} strategy directly affects multiple business metrics:

- **Revenue Growth**: Organizations report 15-25% increase in revenue when properly implementing {{sectionTitle}}
- **Cost Reduction**: Operational efficiency improvements lead to 20-30% cost savings
- **Customer Satisfaction**: Enhanced service delivery improves customer retention by 25%
- **Market Position**: Strategic {{keyword}} positioning strengthens competitive advantage

### Strategic Implementation Framework

Successful implementation of {{sectionTitle}} requires a structured approach:

**Phase 1: Assessment and Planning**
- Conduct comprehensive current state analysis
- Identify key performance indicators
- Develop implementation timeline
- Allocate necessary resources

**Phase 2: Execution and Monitoring**
- Implement {{sectionTitle}} strategies
- Establish monitoring systems
- Track progress against KPIs
- Make data-driven adjustments

**Phase 3: Optimization and Scaling**
- Analyze results and identify improvements
- Scale successful strategies
- Document best practices
- Plan next-phase initiatives

### Risk Management and Mitigation

Implementing {{sectionTitle}} comes with inherent risks. These include technical challenges, organizational resistance, and market dynamics. Effective risk management strategies include:

- Comprehensive risk assessment
- Contingency planning
- Stakeholder engagement
- Change management protocols

By addressing these proactively, organizations can minimize disruption while maximizing the benefits of their {{keyword}} investments.`
  }
}

// H3 subsection templates
const h3Templates: Record<string, SectionTemplate> = {
  general_blog: {
    type: 'h3',
    wordCount: 350,
    seoRules: {
      keywordPlacement: 'distributed',
      densityTarget: 0.8,
      semanticKeywords: ['specific', 'detailed', 'focused'],
      hookRequired: false
    },
    placeholders: ['{{keyword}}', '{{subsectionTitle}}', '{{details}}'],
    template: `### {{subsectionTitle}}

Within the broader context of {{keyword}}, {{subsectionTitle}} deserves special attention due to its significant impact on overall outcomes. This focused exploration will help you understand the nuances and practical applications.

{{details}}

The key to mastering {{subsectionTitle}} lies in understanding its relationship with other components of {{keyword}}. When properly implemented, it creates synergistic effects that amplify your results.

### Practical Applications

Consider these real-world applications of {{subsectionTitle}}:

- **Implementation Example 1**: Detailed description of how {{subsectionTitle}} works in practice
- **Implementation Example 2**: Specific use case with measurable outcomes
- **Implementation Example 3**: Advanced technique for experienced practitioners

### Best Practices

When working with {{subsectionTitle}}, follow these proven best practices:

1. Start with a clear understanding of your objectives
2. Use appropriate tools and methodologies
3. Monitor progress and adjust as needed
4. Document lessons learned for future reference

By following these guidelines, you can maximize the effectiveness of {{subsectionTitle}} within your {{keyword}} strategy.`
  },

  business_guide: {
    type: 'h3',
    wordCount: 400,
    seoRules: {
      keywordPlacement: 'distributed',
      densityTarget: 1.0,
      semanticKeywords: ['business application', 'ROI', 'metrics'],
      hookRequired: false
    },
    placeholders: ['{{keyword}}', '{{subsectionTitle}}', '{{businessValue}}'],
    template: `### {{subsectionTitle}}

{{subsectionTitle}} represents a critical component of your {{keyword}} strategy, with direct implications for business performance and profitability. {{businessValue}} Understanding this relationship is essential for making informed decisions.

### Business Value Proposition

The implementation of {{subsectionTitle}} delivers tangible business benefits:

- **Financial Impact**: Direct contribution to revenue growth and cost optimization
- **Operational Efficiency**: Streamlined processes and improved resource utilization
- **Strategic Advantage**: Competitive differentiation in the marketplace
- **Risk Mitigation**: Reduced exposure to common business risks

### Implementation Considerations

When implementing {{subsectionTitle}} within your business context, consider these factors:

**Resource Requirements**
- Human capital and expertise
- Technology infrastructure
- Financial investment
- Time allocation

**Success Metrics**
- Key performance indicators
- ROI measurements
- Stakeholder satisfaction
- Market impact assessment

### Decision Framework

Use this framework to evaluate {{subsectionTitle}} opportunities:

1. **Strategic Alignment**: Does it support your overall business objectives?
2. **Resource Availability**: Do you have the necessary resources for implementation?
3. **Risk-Reward Analysis**: Do the potential benefits outweigh the risks?
4. **Timing Considerations**: Is this the right time for implementation?

By systematically evaluating {{subsectionTitle}} through this framework, you can make informed decisions that drive business success.`
  }
}

// Conclusion templates
const conclusionTemplates: Record<string, SectionTemplate> = {
  general_blog: {
    type: 'conclusion',
    wordCount: 120,
    seoRules: {
      keywordPlacement: 'reinforcement',
      densityTarget: 0.8,
      semanticKeywords: ['summary', 'key takeaways', 'next steps'],
      hookRequired: false
    },
    placeholders: ['{{keyword}}', '{{audience}}', '{{callToAction}}'],
    template: `## Conclusion

Throughout this guide, we've explored the essential aspects of {{keyword}} and how {{audience}} can leverage these insights for success. The key takeaways include understanding the fundamental principles, implementing best practices, and continuously optimizing your approach.

Remember that mastering {{keyword}} is an ongoing journey. Stay curious, keep learning, and don't hesitate to experiment with new strategies and techniques.

{{callToAction}}

The world of {{keyword}} continues to evolve, and those who commit to continuous improvement will find themselves well-positioned for long-term success. Start implementing these strategies today and experience the difference they can make.`
  },

  business_guide: {
    type: 'conclusion',
    wordCount: 150,
    seoRules: {
      keywordPlacement: 'reinforcement',
      densityTarget: 1.0,
      semanticKeywords: ['business impact', 'ROI', 'strategic value'],
      hookRequired: false
    },
    placeholders: ['{{keyword}}', '{{audience}}', '{{businessOutcome}}'],
    template: `## Conclusion

For {{audience}}, implementing effective {{keyword}} strategies is no longer optional—it's essential for competitive survival and growth. This guide has provided a comprehensive framework for understanding, implementing, and optimizing {{keyword}} within your organization.

The strategic value of {{keyword}} cannot be overstated. Organizations that embrace these approaches consistently outperform their peers in revenue growth, operational efficiency, and market position.

{{businessOutcome}}

### Next Steps for Implementation

1. **Immediate Actions** (0-30 days): Conduct assessment and develop implementation plan
2. **Short-term Initiatives** (30-90 days): Begin implementation and establish monitoring
3. **Long-term Strategy** (90+ days): Scale successful initiatives and optimize continuously

The time to act is now. By implementing these {{keyword}} strategies, you position your organization for sustainable growth and competitive advantage in an increasingly complex business environment.`
  }
}

// FAQ templates
const faqTemplates: Record<string, SectionTemplate> = {
  general_blog: {
    type: 'faq',
    wordCount: 500,
    seoRules: {
      keywordPlacement: 'distributed',
      densityTarget: 0.6,
      semanticKeywords: ['questions', 'answers', 'common issues'],
      hookRequired: false
    },
    placeholders: ['{{keyword}}', '{{audience}}', '{{commonQuestions}}'],
    template: `## Frequently Asked Questions About {{keyword}}

Here are answers to the most common questions {{audience}} have about {{keyword}}:

### What is the best way to get started with {{keyword}}?

The best way to get started with {{keyword}} is to begin with a clear understanding of your objectives and current capabilities. Start small, focus on foundational elements, and gradually build your expertise and resources.

### How long does it take to see results with {{keyword}}?

Results from {{keyword}} initiatives typically become visible within 3-6 months, though this varies based on your specific situation, resources committed, and implementation quality. Consistent effort and proper monitoring accelerate progress.

### What are the common challenges with {{keyword}}?

{{commonQuestions}} Common challenges include resource constraints, knowledge gaps, and resistance to change. These can be overcome through proper planning, stakeholder engagement, and phased implementation.

### How much does {{keyword}} cost?

The cost of {{keyword}} varies widely depending on your scope, scale, and approach. While there are upfront investments, the long-term ROI typically outweighs the initial costs through improved efficiency and outcomes.

### Can {{keyword}} work for small organizations?

Yes, {{keyword}} can be adapted for organizations of any size. Small organizations often benefit from greater agility and can implement changes more quickly, though they may need to prioritize initiatives differently.

### What tools are needed for {{keyword}}?

The tools needed for {{keyword}} depend on your specific implementation, but commonly include analytics platforms, project management software, and communication tools. Start with essential tools and expand as needed.

### How do I measure success with {{keyword}}?

Success with {{keyword}} should be measured using clear KPIs aligned with your objectives. Common metrics include performance improvements, cost savings, customer satisfaction, and business growth indicators.

### Where can I learn more about {{keyword}}?

Continue your {{keyword}} education through industry publications, professional networks, online courses, and by working with experienced practitioners or consultants in the field.`
  }
}

/**
 * Get section template based on context
 */
export function getSectionTemplate(context: TemplateContext): SectionTemplate {
  const startTime = performance.now()
  
  const cacheKey = `${context.sectionType}_${context.contentType}_${context.targetAudience}`
  
  // Check cache first
  let template = templateCache.get(cacheKey)
  
  if (!template) {
    cacheMisses++
    // Select template based on section type and context
    switch (context.sectionType) {
      case 'introduction':
        template = selectTemplateByContentTypeInternal(introductionTemplates, context.contentType, context.targetAudience)
        break
      case 'h2':
        template = selectTemplateByContentTypeInternal(h2Templates, context.contentType, context.targetAudience)
        break
      case 'h3':
        template = selectTemplateByContentTypeInternal(h3Templates, context.contentType, context.targetAudience)
        break
      case 'conclusion':
        template = selectTemplateByContentTypeInternal(conclusionTemplates, context.contentType, context.targetAudience)
        break
      case 'faq':
        template = selectTemplateByContentTypeInternal(faqTemplates, context.contentType, context.targetAudience)
        break
      default:
        // Fallback to H2 template for unknown types
        template = h2Templates.general_blog
    }
    
    // Cache the template
    templateCache.set(cacheKey, template)
  } else {
    cacheHits++
  }
  
  const endTime = performance.now()
  selectionTimes.push(endTime - startTime)
  
  // Update performance metrics
  updatePerformanceMetrics()
  
  return template
}

/**
 * Select template by content type and audience (internal function)
 */
function selectTemplateByContentTypeInternal(
  templates: Record<string, SectionTemplate>,
  contentType: string,
  targetAudience: string
): SectionTemplate {
  // Try to find template by content type first
  let template = templates[contentType]
  
  // If not found, try audience-specific templates
  if (!template) {
    const audienceKey = targetAudience.toLowerCase().replace(/\s+/g, '_')
    template = templates[audienceKey]
  }
  
  // For H2 sections, create different templates based on audience
  if (!template && targetAudience === 'Marketing Professionals') {
    template = {
      type: 'h2',
      wordCount: 650,
      seoRules: {
        keywordPlacement: 'distributed' as const,
        densityTarget: 1.4,
        semanticKeywords: ['business impact', 'ROI', 'implementation'],
        hookRequired: false
      },
      placeholders: ['{{keyword}}', '{{sectionTitle}}', '{{businessImpact}}'],
      template: `## {{sectionTitle}}

For marketing professionals, understanding the connection between {{sectionTitle}} and {{keyword}} is essential for driving growth and maintaining competitive advantage. {{businessImpact}} This section explores how strategic implementation can transform your marketing efforts.

### Strategic Marketing Impact

The implementation of {{sectionTitle}} within your {{keyword}} strategy directly affects multiple marketing metrics:

- **Campaign Performance**: Organizations report 15-25% increase in conversion rates when properly implementing {{sectionTitle}}
- **Brand Positioning**: Enhanced market positioning through strategic {{keyword}} initiatives
- **Customer Engagement**: Improved engagement metrics through optimized {{sectionTitle}} strategies
- **Competitive Advantage**: Market differentiation through advanced {{keyword}} techniques`
    }
  }
  
  // Fallback to general template
  if (!template) {
    template = templates.general_blog || Object.values(templates)[0]
  }
  
  // Final fallback
  if (!template) {
    template = {
      type: 'h2',
      wordCount: 500,
      seoRules: {
        keywordPlacement: 'distributed',
        densityTarget: 1.0,
        semanticKeywords: [],
        hookRequired: false
      },
      placeholders: ['{{keyword}}'],
      template: 'Content about {{keyword}}'
    }
  }
  
  return template
}

/**
 * Process template with dynamic content insertion
 */
export function processTemplate(template: SectionTemplate, context: TemplateContext): string {
  const startTime = performance.now()
  
  try {
    let processedContent = template.template || ''
    
    // If template is null or undefined, return error message
    if (!template.template) {
      return 'Error: Template content is missing or null.'
    }
    
    // Build replacements object with dynamic values
    const replacements: Record<string, string> = {
      // Core context values
      '{{keyword}}': context.keyword,
      '{{audience}}': context.targetAudience,
      '{{contentType}}': context.contentType,
      
      // Dynamic placeholder values from context
      ...context.placeholderValues,
      
      // Smart defaults for common placeholders (only if not provided)
      '{{sectionTitle}}': context.placeholderValues?.['{{sectionTitle}}'] || 'Section Title',
      '{{subsectionTitle}}': context.placeholderValues?.['{{subsectionTitle}}'] || 'Subsection Title',
      '{{hook}}': context.placeholderValues?.['{{hook}}'] || `Did you know that understanding ${context.keyword} can transform your approach?`,
      '{{benefit}}': context.placeholderValues?.['{{benefit}}'] || 'significant improvements in efficiency and effectiveness',
      '{{scope}}': context.placeholderValues?.['{{scope}}'] || 'We\'ll cover everything from basics to advanced techniques.',
      '{{examples}}': context.placeholderValues?.['{{examples}}'] || 'For example, many organizations have successfully implemented these strategies.',
      '{{businessImpact}}': context.placeholderValues?.['{{businessImpact}}'] || 'The business impact is substantial and measurable.',
      '{{details}}': context.placeholderValues?.['{{details}}'] || 'Let\'s explore the specific details and practical applications.',
      '{{businessValue}}': context.placeholderValues?.['{{businessValue}}'] || 'This delivers significant business value and competitive advantage.',
      '{{callToAction}}': context.placeholderValues?.['{{callToAction}}'] || 'Start implementing these strategies today to see immediate results.',
      '{{businessOutcome}}': context.placeholderValues?.['{{businessOutcome}}'] || 'The expected business outcomes include increased revenue and market position.',
      '{{commonQuestions}}': context.placeholderValues?.['{{commonQuestions}}'] || 'Common questions include implementation challenges and resource requirements.'
    }
    
    // Replace all placeholders
    for (const [placeholder, value] of Object.entries(replacements)) {
      if (processedContent && typeof processedContent === 'string') {
        processedContent = processedContent.replace(new RegExp(placeholder.replace(/[{}]/g, '\\$&'), 'g'), value)
      }
    }
    
    const endTime = performance.now()
    processingTimes.push(endTime - startTime)
    
    // Update performance metrics
    updatePerformanceMetrics()
    
    return processedContent
  } catch (error) {
    console.error('Template processing failed:', error)
    return `Error processing template. Original: ${template.template || 'No template content'}`
  }
}

/**
 * Select template based on content type and audience (public API)
 */
export function selectTemplateByContentType(
  contentType: string,
  targetAudience: string,
  sectionType: SectionTemplate['type']
): SectionTemplate {
  const context: TemplateContext = {
    sectionType,
    keyword: 'sample',
    targetAudience,
    contentType: contentType as any
  }
  
  return getSectionTemplate(context)
}

/**
 * Validate template performance metrics
 */
export function validateTemplatePerformance(): TemplatePerformanceMetrics {
  return { ...performanceMetrics }
}

/**
 * Update performance metrics
 */
function updatePerformanceMetrics(): void {
  // Calculate real cache hit rate
  const totalRequests = cacheHits + cacheMisses
  if (totalRequests > 0) {
    performanceMetrics.cacheHitRate = (cacheHits / totalRequests) * 100
  } else {
    performanceMetrics.cacheHitRate = 0
  }
  
  // Calculate average selection time
  if (selectionTimes.length > 0) {
    performanceMetrics.averageSelectionTime = selectionTimes.reduce((a, b) => a + b, 0) / selectionTimes.length
  }
  
  // Calculate average processing time
  if (processingTimes.length > 0) {
    performanceMetrics.averageProcessingTime = processingTimes.reduce((a, b) => a + b, 0) / processingTimes.length
  }
  
  // Estimate actual memory usage based on template cache size
  const cacheSize = templateCache.size
  // Rough estimate: each template object ~2KB including all properties
  performanceMetrics.memoryUsage = cacheSize * 2
}

/**
 * Clear template cache (useful for testing or memory management)
 */
export function clearTemplateCache(): void {
  templateCache.clear()
  selectionTimes.length = 0
  processingTimes.length = 0
  cacheHits = 0
  cacheMisses = 0
  performanceMetrics = {
    cacheHitRate: 0,
    averageSelectionTime: 0,
    averageProcessingTime: 0,
    memoryUsage: 0
  }
}

// SEO Validation Functions

export interface SEOValidationResult {
  isValid: boolean
  issues: string[]
  score: number // 0-100
  recommendations: string[]
}

/**
 * Validate template SEO compliance
 */
export function validateTemplateSEO(
  template: SectionTemplate,
  processedContent: string,
  context: TemplateContext
): SEOValidationResult {
  const issues: string[] = []
  const recommendations: string[] = []
  let score = 100

  // Word count validation
  const wordCount = processedContent.split(/\s+/).length
  if (wordCount < template.wordCount * 0.8) {
    issues.push(`Content too short: ${wordCount} words (target: ${template.wordCount})`)
    score -= 15
  } else if (wordCount > template.wordCount * 1.5) {
    issues.push(`Content too long: ${wordCount} words (target: ${template.wordCount})`)
    score -= 10
  }

  // Keyword placement validation
  if (template.seoRules.keywordPlacement === 'first_100_words') {
    const first100Words = processedContent.split(/\s+/).slice(0, 100).join(' ')
    if (!first100Words.includes(context.keyword)) {
      issues.push('Keyword not found in first 100 words')
      score -= 20
      recommendations.push(`Include "${context.keyword}" in the first 100 words`)
    }
  }

  // Keyword density validation
  const keywordOccurrences = (processedContent.match(new RegExp(context.keyword, 'gi')) || []).length
  const actualDensity = (keywordOccurrences / wordCount) * 100
  const targetDensity = template.seoRules.densityTarget

  if (actualDensity < targetDensity * 0.5) {
    issues.push(`Keyword density too low: ${actualDensity.toFixed(2)}% (target: ${targetDensity}%)`)
    score -= 15
    recommendations.push(`Increase keyword usage to achieve ${targetDensity}% density`)
  } else if (actualDensity > targetDensity * 2) {
    issues.push(`Keyword density too high: ${actualDensity.toFixed(2)}% (target: ${targetDensity}%)`)
    score -= 10
    recommendations.push(`Reduce keyword repetition to avoid keyword stuffing`)
  }

  // Hook validation for introductions
  if (template.type === 'introduction' && template.seoRules.hookRequired) {
    const sentences = processedContent.split(/[.!?]+/)
    const firstSentence = sentences[0]?.trim()
    if (!firstSentence || firstSentence.length < 10) {
      issues.push('Introduction missing compelling hook')
      score -= 10
      recommendations.push('Add a compelling hook in the first sentence')
    }
  }

  // Semantic keywords validation
  if (template.seoRules.semanticKeywords.length > 0) {
    const foundSemanticKeywords = template.seoRules.semanticKeywords.filter(keyword =>
      processedContent.toLowerCase().includes(keyword.toLowerCase())
    )
    
    if (foundSemanticKeywords.length < template.seoRules.semanticKeywords.length * 0.5) {
      issues.push(`Insufficient semantic keywords: ${foundSemanticKeywords.length}/${template.seoRules.semanticKeywords.length}`)
      score -= 10
      recommendations.push(`Include more semantic keywords: ${template.seoRules.semanticKeywords.join(', ')}`)
    }
  }

  // Content structure validation
  if (template.type === 'h2' && !processedContent.includes('##')) {
    issues.push('H2 section missing proper heading structure')
    score -= 5
    recommendations.push('Include proper H2 heading structure')
  }

  if (template.type === 'h3' && !processedContent.includes('###')) {
    issues.push('H3 section missing proper heading structure')
    score -= 5
    recommendations.push('Include proper H3 heading structure')
  }

  if (template.type === 'faq') {
    const questionMatches = processedContent.match(/###\s*[^?]+\?/g)
    if (!questionMatches || questionMatches.length < 3) {
      issues.push('FAQ section needs at least 3 questions')
      score -= 15
      recommendations.push('Add more FAQ questions in proper format')
    }
  }

  return {
    isValid: issues.length === 0,
    issues,
    score: Math.max(0, score),
    recommendations
  }
}

/**
 * Validate template performance against SEO requirements
 */
export function validateTemplatePerformanceSEO(
  template: SectionTemplate,
  context: TemplateContext
): SEOValidationResult {
  const issues: string[] = []
  const recommendations: string[] = []
  let score = 100

  // Template structure validation
  if (!template.template || template.template.trim().length === 0) {
    issues.push('Template content is empty')
    score -= 50
  }

  // Required placeholders validation
  const requiredPlaceholders = ['{{keyword}}']
  const missingPlaceholders = requiredPlaceholders.filter(placeholder => 
    !template.template.includes(placeholder)
  )
  
  if (missingPlaceholders.length > 0) {
    issues.push(`Missing required placeholders: ${missingPlaceholders.join(', ')}`)
    score -= 25
    recommendations.push(`Add required placeholders: ${missingPlaceholders.join(', ')}`)
  }

  // SEO rules validation
  if (!template.seoRules) {
    issues.push('Template missing SEO rules')
    score -= 30
  } else {
    if (!template.seoRules.keywordPlacement) {
      issues.push('Template missing keyword placement strategy')
      score -= 15
    }
    
    if (!template.seoRules.densityTarget || template.seoRules.densityTarget <= 0) {
      issues.push('Template missing or invalid density target')
      score -= 10
    }
  }

  // Word count reasonableness check
  if (template.wordCount < 50 || template.wordCount > 2000) {
    issues.push(`Template word count unreasonable: ${template.wordCount}`)
    score -= 10
    recommendations.push('Set word count between 50-2000 words')
  }

  return {
    isValid: issues.length === 0,
    issues,
    score: Math.max(0, score),
    recommendations
  }
}

// Template Customization Framework

export interface CustomTemplateDefinition {
  id: string
  name: string
  description: string
  sectionType: SectionTemplate['type']
  contentType?: string
  targetAudience?: string
  template: SectionTemplate
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface TemplateCustomizationOptions {
  wordCount?: number
  keywordPlacement?: SectionTemplate['seoRules']['keywordPlacement']
  densityTarget?: number
  semanticKeywords?: string[]
  hookRequired?: boolean
  customPlaceholders?: string[]
  templateContent?: string
}

// Custom template registry
const customTemplates = new Map<string, CustomTemplateDefinition>()

/**
 * Register a custom template
 */
export function registerCustomTemplate(
  definition: Omit<CustomTemplateDefinition, 'id' | 'createdAt' | 'updatedAt'>
): string {
  const id = `custom_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  const now = new Date().toISOString()
  
  const customTemplate: CustomTemplateDefinition = {
    ...definition,
    id,
    createdAt: now,
    updatedAt: now
  }
  
  customTemplates.set(id, customTemplate)
  
  // Clear cache to ensure new template is available
  clearTemplateCache()
  
  return id
}

/**
 * Update an existing custom template
 */
export function updateCustomTemplate(
  id: string,
  updates: Partial<Omit<CustomTemplateDefinition, 'id' | 'createdAt'>>
): boolean {
  const existing = customTemplates.get(id)
  if (!existing) {
    return false
  }
  
  const updated: CustomTemplateDefinition = {
    ...existing,
    ...updates,
    updatedAt: new Date().toISOString()
  }
  
  customTemplates.set(id, updated)
  
  // Clear cache to ensure updated template is available
  clearTemplateCache()
  
  return true
}

/**
 * Remove a custom template
 */
export function removeCustomTemplate(id: string): boolean {
  const deleted = customTemplates.delete(id)
  if (deleted) {
    // Clear cache to ensure template is no longer available
    clearTemplateCache()
  }
  return deleted
}

/**
 * Get all custom templates
 */
export function getAllCustomTemplates(): CustomTemplateDefinition[] {
  return Array.from(customTemplates.values())
}

/**
 * Get custom templates by section type
 */
export function getCustomTemplatesByType(sectionType: SectionTemplate['type']): CustomTemplateDefinition[] {
  return Array.from(customTemplates.values()).filter(template => 
    template.sectionType === sectionType && template.isActive
  )
}

/**
 * Create a customized version of an existing template
 */
export function customizeTemplate(
  baseTemplate: SectionTemplate,
  options: TemplateCustomizationOptions
): SectionTemplate {
  return {
    ...baseTemplate,
    wordCount: options.wordCount || baseTemplate.wordCount,
    seoRules: {
      ...baseTemplate.seoRules,
      keywordPlacement: options.keywordPlacement || baseTemplate.seoRules.keywordPlacement,
      densityTarget: options.densityTarget || baseTemplate.seoRules.densityTarget,
      semanticKeywords: options.semanticKeywords || baseTemplate.seoRules.semanticKeywords,
      hookRequired: options.hookRequired !== undefined ? options.hookRequired : baseTemplate.seoRules.hookRequired
    },
    placeholders: options.customPlaceholders || baseTemplate.placeholders,
    template: options.templateContent || baseTemplate.template
  }
}

/**
 * Enhanced template selection that includes custom templates
 */
export function getSectionTemplateWithCustom(
  context: TemplateContext,
  includeCustom: boolean = true
): SectionTemplate {
  // First try to find matching custom templates
  if (includeCustom) {
    const customMatches = getCustomTemplatesByType(context.sectionType)
    
    // Filter by content type and audience if specified
    const matchingCustom = customMatches.find(template => {
      const contentTypeMatch = !template.contentType || template.contentType === context.contentType
      const audienceMatch = !template.targetAudience || template.targetAudience === context.targetAudience
      return contentTypeMatch && audienceMatch
    })
    
    if (matchingCustom) {
      return matchingCustom.template
    }
  }
  
  // Fallback to default template selection
  return getSectionTemplate(context)
}

/**
 * Enhanced section-specific guidance with E-E-A-T principles and SEO best practices
 * Provides detailed guidance for each section type with word count enforcement and quality requirements
 */
export function getSectionSpecificGuidance(
  sectionType: SectionTemplate['type'],
  sectionTitle: string,
  keyword: string,
  targetWordCount: number
): string {
  const guidance = {
    introduction: {
      requirements: `**Introduction Section Requirements (80-150 words):**
- **Hook Requirement:** MUST start with compelling hook to grab reader attention
- **Keyword Placement:** Include primary keyword "${keyword}" in first 50-100 words
- **Word Count Enforcement:** Target ${targetWordCount} words (strict 80-150 minimum/maximum)
- **E-E-A-T Focus:** Establish expertise and credibility immediately
- **Structure:** Hook → Problem statement → Solution preview → Value proposition`,
      
      bestPractices: `**Best Practices for Introduction:**
- Start with surprising statistic, provocative question, or compelling story
- Address reader's pain point directly within first 2 sentences
- Include 1-2 credible sources to establish authority
- Use active voice and conversational tone (Grade 10-12 readability)
- End with clear transition to main content`,
      
      examples: `**Example Hooks for "${keyword}":**
- "Did you know that 93% of online experiences begin with a search engine?"
- "What if I told you that ${keyword} could transform your entire digital strategy?"
- "The landscape of ${keyword} has changed dramatically in recent years..."`
    },

    h2: {
      requirements: `**H2 Section Requirements (200-400 words):**
- **Topic Authority Building:** MUST demonstrate deep expertise on "${keyword}"
- **Keyword Integration:** Use primary keyword and semantic variations naturally
- **Word Count Enforcement:** Target ${targetWordCount} words (strict 200-400 range)
- **E-E-A-T Focus:** Build authoritativeness through expert insights and data
- **Structure:** Topic sentence → Expert analysis → Supporting evidence → Practical application`,
      
      bestPractices: `**Best Practices for H2 Sections:**
- Include 2-3 authoritative sources (.edu, .gov, industry leaders)
- Use specific data points and statistics to support claims
- Provide actionable insights readers can implement immediately
- Break complex concepts into digestible sub-points
- Include examples and case studies for experience demonstration`,
      
      examples: `**Authority Building Examples:**
- "According to a 2023 study by [Industry Leader], ${keyword} increased conversion rates by 47%..."
- "Research from [University] shows that implementing ${keyword} strategies leads to..."
- "In our experience with over 100 clients, ${keyword} consistently delivers..."`
    },

    h3: {
      requirements: `**H3 Subsection Requirements (150-300 words):**
- **Detailed Explanations:** MUST provide comprehensive coverage of specific aspects
- **Long-tail Keywords:** Focus on semantic variations and specific "${keyword}" details
- **Word Count Enforcement:** Target ${targetWordCount} words (strict 150-300 range)
- **E-E-A-T Focus:** Demonstrate practical experience and in-depth knowledge
- **Structure:** Specific focus area → Step-by-step guidance → Examples → Implementation tips`,
      
      bestPractices: `**Best Practices for H3 Subsections:**
- Provide practical, step-by-step guidance readers can follow
- Include real-world examples and case studies
- Use bullet points or numbered lists for clarity when appropriate
- Address common mistakes and how to avoid them
- Maintain Grade 10-12 readability throughout`,
      
      examples: `**Detailed Explanation Examples:**
- "Step 1: Audit your current ${keyword} strategy using these 5 key metrics..."
- "Common mistake: Many businesses overlook [specific aspect] when implementing ${keyword}..."
- "Case study: How [Company] increased their ${keyword} results by 300% using..."`
    },

    conclusion: {
      requirements: `**Conclusion Section Requirements (100-200 words):**
- **Summary Integration:** MUST summarize key points about "${keyword}"
- **Call-to-Action Enhancement:** Include clear next steps and action items
- **Word Count Enforcement:** Target ${targetWordCount} words (strict 100-200 range)
- **E-E-A-T Focus:** Reinforce trustworthiness and provide forward-looking guidance
- **Structure:** Key takeaways → Final recommendations → Call-to-action → Future outlook`,
      
      bestPractices: `**Best Practices for Conclusion:**
- Summarize 3-4 most important points from the content
- Provide specific, actionable next steps for readers
- Include contact information or resource links when appropriate
- End with memorable statement that reinforces main message
- Maintain authoritative yet approachable tone`,
      
      examples: `**Summary and CTA Examples:**
- "Key takeaways: ${keyword} requires [point 1], [point 2], and [point 3] for success..."
- "Ready to implement these ${keyword} strategies? Start with our free assessment tool..."
- "The future of ${keyword} is evolving rapidly. Stay ahead by subscribing to our newsletter..."`
    },

    faq: {
      requirements: `**FAQ Section Requirements (150-250 words):**
- **Common Questions:** MUST address frequently asked questions about "${keyword}"
- **Featured Snippet Optimization:** Structure for Google featured snippets
- **Word Count Enforcement:** Target ${targetWordCount} words (strict 150-250 range)
- **E-E-A-T Focus:** Demonstrate expertise through comprehensive answers
- **Structure:** Question → Direct answer → Supporting details → Additional resources`,
      
      bestPractices: `**Best Practices for FAQ Sections:**
- Frame questions exactly as users would search for them
- Provide direct, concise answers (50-75 words) followed by elaboration
- Include 2-3 authoritative sources to support answers
- Use natural language that matches voice search queries
- Address both basic and advanced questions to cover full user journey`,
      
      examples: `**FAQ Question Examples:**
- "Q: What is the average ROI for implementing ${keyword} strategies?"
- "Q: How long does it take to see results with ${keyword}?"
- "Q: What are the most common mistakes businesses make with ${keyword}?"`
    }
  }

  const sectionGuidance = guidance[sectionType]
  if (!sectionGuidance) {
    return `**Section Guidance Not Available**
    
    Section type "${sectionType}" is not supported. Please use one of: introduction, h2, h3, conclusion, or faq.`
  }

  return `${sectionGuidance.requirements}

${sectionGuidance.bestPractices}

${sectionGuidance.examples}

**Quality Checklist for ${sectionType.toUpperCase()}:**
- [ ] Word count within required range (${targetWordCount} words)
- [ ] Primary keyword "${keyword}" included naturally
- [ ] E-E-A-T principles demonstrated throughout
- [ ] Readability level at Grade 10-12
- [ ] Authoritative sources cited where appropriate
- [ ] Clear structure and logical flow
- [ ] Actionable insights provided`
}

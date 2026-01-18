// Content Planner
// Story 4A-2: Section-by-Section Architecture and Outline Generation
// Tier-1 Producer story for article generation infrastructure

export interface ContentStrategy {
  approach: 'informative' | 'persuasive' | 'narrative' | 'technical';
  tone: 'professional' | 'conversational' | 'casual' | 'formal';
  perspective: 'first-person' | 'second-person' | 'third-person';
  complexity: 'beginner' | 'intermediate' | 'advanced';
  includeCitations: boolean;
  includeExamples: boolean;
  includeData: boolean;
}

export interface ContentPlan {
  keyword: string;
  writingStyle: string;
  targetAudience: string;
  strategy: ContentStrategy;
  sectionStrategies: Map<string, SectionStrategy>;
  contentFlow: ContentFlow;
  researchRequirements: ResearchRequirements;
}

export interface SectionStrategy {
  sectionId: string;
  strategy: ContentStrategy;
  wordCountTarget: number;
  keyPoints: string[];
  callToAction?: string;
  transitionToNext?: string;
}

export interface ContentFlow {
  introduction: FlowElement[];
  body: FlowElement[];
  conclusion: FlowElement[];
  transitions: Transition[];
}

export interface FlowElement {
  type: 'hook' | 'context' | 'main_point' | 'support' | 'example' | 'data' | 'conclusion' | 'summary' | 'call_to_action';
  order: number;
  description: string;
  estimatedWords: number;
}

export interface Transition {
  fromSection: string;
  toSection: string;
  type: 'smooth' | 'contrast' | 'question' | 'summary';
  text: string;
}

export interface ResearchRequirements {
  primaryTopics: string[];
  secondaryTopics: string[];
  dataPoints: string[];
  examples: string[];
  citations: string[];
}

export interface PlanningRequest {
  writingStyle: string;
  targetAudience: string;
  sectionArchitecture: any;
  customInstructions?: string;
}

export class ContentPlanner {
  async planContentStrategy(
    writingStyle: string,
    targetAudience: string,
    sectionArchitecture: any
  ): Promise<ContentStrategy> {
    try {
      // Determine approach based on writing style
      const approach = this.determineApproach(writingStyle);
      
      // Determine tone based on writing style and audience
      const tone = this.determineTone(writingStyle, targetAudience);
      
      // Determine perspective based on audience
      const perspective = this.determinePerspective(targetAudience);
      
      // Determine complexity based on audience and architecture
      const complexity = this.determineComplexity(targetAudience, sectionArchitecture);
      
      // Determine content requirements
      const { includeCitations, includeExamples, includeData } = this.determineContentRequirements(
        writingStyle,
        targetAudience,
        sectionArchitecture
      );
      
      return {
        approach,
        tone,
        perspective,
        complexity,
        includeCitations,
        includeExamples,
        includeData
      };
      
    } catch (error) {
      console.error('Failed to plan content strategy:', error);
      throw new Error(`Failed to plan content strategy: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async createContentPlan(
    keyword: string,
    writingStyle: string,
    targetAudience: string,
    sectionArchitecture: any,
    customInstructions?: string
  ): Promise<ContentPlan> {
    try {
      // Create base content strategy
      const strategy = await this.planContentStrategy(writingStyle, targetAudience, sectionArchitecture);
      
      // Create section-specific strategies
      const sectionStrategies = await this.createSectionStrategies(
        sectionArchitecture,
        strategy
      );
      
      // Plan content flow
      const contentFlow = await this.planContentFlow(sectionArchitecture, strategy);
      
      // Determine research requirements
      const researchRequirements = await this.determineResearchRequirements(
        keyword,
        sectionArchitecture,
        strategy
      );
      
      return {
        keyword,
        writingStyle,
        targetAudience,
        strategy,
        sectionStrategies,
        contentFlow,
        researchRequirements
      };
      
    } catch (error) {
      console.error('Failed to create content plan:', error);
      throw new Error(`Failed to create content plan: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private determineApproach(writingStyle: string): 'informative' | 'persuasive' | 'narrative' | 'technical' {
    const styleLower = writingStyle.toLowerCase();
    
    if (styleLower.includes('professional') || styleLower.includes('formal')) {
      return 'informative';
    }
    
    if (styleLower.includes('conversational') || styleLower.includes('casual')) {
      return 'narrative';
    }
    
    if (styleLower.includes('technical')) {
      return 'technical';
    }
    
    return 'informative';
  }

  private determineTone(writingStyle: string, targetAudience: string): 'professional' | 'conversational' | 'casual' | 'formal' {
    const styleLower = writingStyle.toLowerCase();
    const audienceLower = targetAudience.toLowerCase();
    
    if (styleLower.includes('professional') || styleLower.includes('formal')) {
      return 'professional';
    }
    
    if (styleLower.includes('conversational')) {
      return 'conversational';
    }
    
    if (styleLower.includes('casual')) {
      return 'casual';
    }
    
    if (audienceLower.includes('academic') || audienceLower.includes('expert')) {
      return 'formal';
    }
    
    return 'professional';
  }

  private determinePerspective(targetAudience: string): 'first-person' | 'second-person' | 'third-person' {
    const audienceLower = targetAudience.toLowerCase();
    
    if (audienceLower.includes('beginner') || audienceLower.includes('general')) {
      return 'second-person';
    }
    
    if (audienceLower.includes('expert') || audienceLower.includes('academic')) {
      return 'third-person';
    }
    
    return 'second-person';
  }

  private determineComplexity(
    targetAudience: string,
    sectionArchitecture: any
  ): 'beginner' | 'intermediate' | 'advanced' {
    const audienceLower = targetAudience.toLowerCase();
    
    if (audienceLower.includes('beginner') || audienceLower.includes('general')) {
      return 'beginner';
    }
    
    if (audienceLower.includes('expert') || audienceLower.includes('academic')) {
      return 'advanced';
    }
    
    if (audienceLower.includes('intermediate') || audienceLower.includes('b2b')) {
      return 'intermediate';
    }
    
    return 'intermediate';
  }

  private determineContentRequirements(
    writingStyle: string,
    targetAudience: string,
    sectionArchitecture: any
  ): { includeCitations: boolean; includeExamples: boolean; includeData: boolean } {
    const styleLower = writingStyle.toLowerCase();
    const audienceLower = targetAudience.toLowerCase();
    
    // Citions for professional/academic content
    const includeCitations = styleLower.includes('professional') || 
                           styleLower.includes('formal') || 
                           audienceLower.includes('academic') ||
                           audienceLower.includes('expert');
    
    // Examples for beginner/general audience
    const includeExamples = audienceLower.includes('beginner') || 
                           audienceLower.includes('general') ||
                           styleLower.includes('conversational');
    
    // Data for professional/technical content
    const includeData = styleLower.includes('technical') || 
                      styleLower.includes('professional') ||
                      audienceLower.includes('b2b');
    
    return {
      includeCitations,
      includeExamples,
      includeData
    };
  }

  private async createSectionStrategies(
    sectionArchitecture: any,
    baseStrategy: ContentStrategy
  ): Promise<Map<string, SectionStrategy>> {
    const sectionStrategies = new Map<string, SectionStrategy>();
    
    const sections = sectionArchitecture.sections || [];
    
    for (const section of sections) {
      const sectionStrategy: SectionStrategy = {
        sectionId: section.id,
        strategy: this.adaptStrategyForSection(section, baseStrategy),
        wordCountTarget: section.estimatedWordCount,
        keyPoints: this.generateKeyPoints(section),
        callToAction: this.generateCallToAction(section),
        transitionToNext: this.generateTransition(section)
      };
      
      sectionStrategies.set(section.id, sectionStrategy);
    }
    
    return sectionStrategies;
  }

  private adaptStrategyForSection(section: any, baseStrategy: ContentStrategy): ContentStrategy {
    // Adapt strategy based on section type and content angle
    const adaptedStrategy = { ...baseStrategy };
    
    switch (section.type) {
      case 'introduction':
        adaptedStrategy.approach = 'narrative';
        adaptedStrategy.includeCitations = false;
        break;
      case 'conclusion':
        adaptedStrategy.approach = 'persuasive';
        adaptedStrategy.includeExamples = false;
        break;
      case 'faq':
        adaptedStrategy.approach = 'informative';
        adaptedStrategy.perspective = 'second-person';
        break;
    }
    
    return adaptedStrategy;
  }

  private generateKeyPoints(section: any): string[] {
    const keyPoints: string[] = [];
    
    // Generate key points based on section title and research focus
    const title = section.title || '';
    const researchFocus = section.researchFocus || [];
    
    // Add main topic
    keyPoints.push(`Main point about ${title}`);
    
    // Add research focus points
    researchFocus.forEach((focus: string) => {
      keyPoints.push(`Key insight on ${focus}`);
    });
    
    // Add section-specific points
    switch (section.type) {
      case 'introduction':
        keyPoints.push('Hook the reader');
        keyPoints.push('Establish relevance');
        keyPoints.push('Preview content');
        break;
      case 'conclusion':
        keyPoints.push('Summarize key points');
        keyPoints.push('Reinforce main message');
        keyPoints.push('Call to action');
        break;
      case 'h2':
        keyPoints.push('Develop main argument');
        keyPoints.push('Provide supporting evidence');
        keyPoints.push('Connect to overall theme');
        break;
      case 'h3':
        keyPoints.push('Explore specific aspect');
        keyPoints.push('Provide detailed examples');
        keyPoints.push('Link to parent section');
        break;
    }
    
    return keyPoints;
  }

  private generateCallToAction(section: any): string | undefined {
    switch (section.type) {
      case 'introduction':
        return 'Continue reading to discover...';
      case 'conclusion':
        return 'Take action on what you\'ve learned';
      case 'h2':
        return 'Apply these insights in your context';
      default:
        return undefined;
    }
  }

  private generateTransition(section: any): string | undefined {
    switch (section.type) {
      case 'introduction':
        return 'Now let\'s dive deeper into...';
      case 'h2':
        return 'Building on this foundation...';
      case 'h3':
        return 'Let\'s explore this further...';
      default:
        return undefined;
    }
  }

  private async planContentFlow(
    sectionArchitecture: any,
    strategy: ContentStrategy
  ): Promise<ContentFlow> {
    const sections = sectionArchitecture.sections || [];
    
    // Plan introduction flow
    const introduction = this.planIntroductionFlow(strategy);
    
    // Plan body flow
    const body = this.planBodyFlow(sections, strategy);
    
    // Plan conclusion flow
    const conclusion = this.planConclusionFlow(strategy);
    
    // Plan transitions
    const transitions = this.planTransitions(sections);
    
    return {
      introduction,
      body,
      conclusion,
      transitions
    };
  }

  private planIntroductionFlow(strategy: ContentStrategy): FlowElement[] {
    return [
      {
        type: 'hook',
        order: 1,
        description: 'Engaging opening that captures reader attention',
        estimatedWords: 50
      },
      {
        type: 'context',
        order: 2,
        description: 'Background information and context',
        estimatedWords: 100
      },
      {
        type: 'main_point',
        order: 3,
        description: 'Thesis statement or main argument',
        estimatedWords: 50
      },
      {
        type: 'support',
        order: 4,
        description: 'Brief overview of what will be covered',
        estimatedWords: 100
      }
    ];
  }

  private planBodyFlow(sections: any[], strategy: ContentStrategy): FlowElement[] {
    const bodyFlow: FlowElement[] = [];
    
    sections.forEach((section, index) => {
      const sectionFlow: FlowElement[] = [
        {
          type: 'main_point',
          order: index * 4 + 1,
          description: `Main point for ${section.title}`,
          estimatedWords: 100
        },
        {
          type: 'support',
          order: index * 4 + 2,
          description: `Supporting evidence for ${section.title}`,
          estimatedWords: 150
        }
      ];
      
      if (strategy.includeExamples) {
        sectionFlow.push({
          type: 'example',
          order: index * 4 + 3,
          description: `Example for ${section.title}`,
          estimatedWords: 100
        });
      }
      
      if (strategy.includeData) {
        sectionFlow.push({
          type: 'data',
          order: index * 4 + 4,
          description: `Data point for ${section.title}`,
          estimatedWords: 50
        });
      }
      
      bodyFlow.push(...sectionFlow);
    });
    
    return bodyFlow;
  }

  private planConclusionFlow(strategy: ContentStrategy): FlowElement[] {
    return [
      {
        type: 'summary',
        order: 1,
        description: 'Summary of main points',
        estimatedWords: 100
      },
      {
        type: 'conclusion',
        order: 2,
        description: 'Final thoughts and implications',
        estimatedWords: 100
      },
      {
        type: 'call_to_action',
        order: 3,
        description: 'Call to action or next steps',
        estimatedWords: 50
      }
    ];
  }

  private planTransitions(sections: any[]): Transition[] {
    const transitions: Transition[] = [];
    
    for (let i = 0; i < sections.length - 1; i++) {
      const currentSection = sections[i];
      const nextSection = sections[i + 1];
      
      transitions.push({
        fromSection: currentSection.id,
        toSection: nextSection.id,
        type: 'smooth',
        text: `Building on ${currentSection.title}, let's explore ${nextSection.title}`
      });
    }
    
    return transitions;
  }

  private async determineResearchRequirements(
    keyword: string,
    sectionArchitecture: any,
    strategy: ContentStrategy
  ): Promise<ResearchRequirements> {
    const sections = sectionArchitecture.sections || [];
    
    const primaryTopics: string[] = [keyword];
    const secondaryTopics: string[] = [];
    const dataPoints: string[] = [];
    const examples: string[] = [];
    const citations: string[] = [];
    
    sections.forEach((section: any) => {
      // Add section keywords to topics
      if (section.keywords) {
        secondaryTopics.push(...section.keywords);
      }
      
      // Add research focus
      if (section.researchFocus) {
        secondaryTopics.push(...section.researchFocus);
      }
      
      // Add data points if needed
      if (strategy.includeData) {
        dataPoints.push(`Statistics for ${section.title}`);
        dataPoints.push(`Metrics related to ${section.title}`);
      }
      
      // Add examples if needed
      if (strategy.includeExamples) {
        examples.push(`Example of ${section.title}`);
        examples.push(`Case study for ${section.title}`);
      }
      
      // Add citations if needed
      if (strategy.includeCitations) {
        citations.push(`Academic sources for ${section.title}`);
        citations.push(`Industry reports on ${section.title}`);
      }
    });
    
    return {
      primaryTopics: [...new Set(primaryTopics)],
      secondaryTopics: [...new Set(secondaryTopics)],
      dataPoints: [...new Set(dataPoints)],
      examples: [...new Set(examples)],
      citations: [...new Set(citations)]
    };
  }
}

// Singleton instance
export const contentPlanner = new ContentPlanner();
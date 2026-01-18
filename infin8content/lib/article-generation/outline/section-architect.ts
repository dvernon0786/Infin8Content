// Section Architect
// Story 4A-2: Section-by-Section Architecture and Outline Generation
// Tier-1 Producer story for article generation infrastructure

export interface SectionArchitecture {
  keyword: string;
  targetWordCount: number;
  sections: H2Section[];
  estimatedWordCount: number;
  complexity: 'simple' | 'moderate' | 'complex';
  structure: 'linear' | 'hierarchical' | 'thematic';
}

export interface H2Section {
  id: string;
  title: string;
  type: 'h2';
  order: number;
  estimatedWordCount: number;
  keywords: string[];
  subsections: H3Subsection[];
  researchFocus: string[];
  contentAngle: 'informative' | 'persuasive' | 'practical' | 'analytical';
}

export interface H3Subsection {
  id: string;
  title: string;
  type: 'h3';
  order: number;
  estimatedWordCount: number;
  keywords: string[];
  researchFocus: string[];
  parentSection: string;
  contentAngle: 'detailed' | 'example' | 'comparison' | 'implementation';
}

export interface ArchitectureRequest {
  keyword: string;
  targetWordCount: number;
  researchData: any;
  serpData: any;
  contentGaps: string[];
  writingStyle: string;
  targetAudience: string;
}

export class SectionArchitect {
  async createSectionArchitecture(
    keyword: string,
    targetWordCount: number,
    researchData: any,
    serpData: any,
    contentGaps: string[]
  ): Promise<SectionArchitecture> {
    try {
      // Determine architecture complexity based on word count and research data
      const complexity = this.determineComplexity(targetWordCount, researchData, serpData);
      
      // Determine structure type
      const structure = this.determineStructure(keyword, researchData, serpData);
      
      // Generate H2 sections
      const sections = await this.generateH2Sections(
        keyword,
        targetWordCount,
        complexity,
        structure,
        researchData,
        serpData,
        contentGaps
      );
      
      // Calculate estimated word count
      const estimatedWordCount = this.calculateEstimatedWordCount(sections);
      
      return {
        keyword,
        targetWordCount,
        sections,
        estimatedWordCount,
        complexity,
        structure
      };
      
    } catch (error) {
      console.error('Failed to create section architecture:', error);
      throw new Error(`Failed to create section architecture: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private determineComplexity(
    targetWordCount: number,
    researchData: any,
    serpData: any
  ): 'simple' | 'moderate' | 'complex' {
    // Base complexity on word count
    if (targetWordCount < 1500) return 'simple';
    if (targetWordCount < 3000) return 'moderate';
    
    // For longer articles, consider research data
    if (researchData && researchData.sources && researchData.sources.length > 10) return 'complex';
    if (serpData && serpData.topResults && serpData.topResults.length > 5) return 'complex';
    
    return 'moderate';
  }

  private determineStructure(
    keyword: string,
    researchData: any,
    serpData: any
  ): 'linear' | 'hierarchical' | 'thematic' {
    // Analyze keyword type and research data to determine structure
    const keywordLower = keyword.toLowerCase();
    
    // How-to or tutorial keywords favor linear structure
    if (keywordLower.includes('how to') || keywordLower.includes('guide') || keywordLower.includes('tutorial')) {
      return 'linear';
    }
    
    // Comparison or review keywords favor thematic structure
    if (keywordLower.includes('vs') || keywordLower.includes('review') || keywordLower.includes('comparison')) {
      return 'thematic';
    }
    
    // Complex topics with multiple subtopics favor hierarchical structure
    if (researchData && researchData.sources && researchData.sources.length > 8) {
      return 'hierarchical';
    }
    
    // Default to hierarchical for comprehensive coverage
    return 'hierarchical';
  }

  private async generateH2Sections(
    keyword: string,
    targetWordCount: number,
    complexity: 'simple' | 'moderate' | 'complex',
    structure: 'linear' | 'hierarchical' | 'thematic',
    researchData: any,
    serpData: any,
    contentGaps: string[]
  ): Promise<H2Section[]> {
    const sections: H2Section[] = [];
    
    // Determine number of H2 sections based on complexity and word count
    const sectionCount = this.determineSectionCount(targetWordCount, complexity);
    
    // Generate section topics based on structure type
    const sectionTopics = await this.generateSectionTopics(
      keyword,
      sectionCount,
      structure,
      researchData,
      serpData,
      contentGaps
    );
    
    // Create H2 sections
    for (let i = 0; i < sectionTopics.length; i++) {
      const topic = sectionTopics[i];
      const h2Section: H2Section = {
        id: `h2-${i + 1}`,
        title: topic.title,
        type: 'h2',
        order: i + 1,
        estimatedWordCount: Math.floor(targetWordCount / sectionCount),
        keywords: topic.keywords,
        subsections: await this.generateH3Subsections(topic, i + 1, complexity),
        researchFocus: topic.researchFocus,
        contentAngle: topic.contentAngle
      };
      
      sections.push(h2Section);
    }
    
    return sections;
  }

  private determineSectionCount(targetWordCount: number, complexity: 'simple' | 'moderate' | 'complex'): number {
    switch (complexity) {
      case 'simple':
        return Math.max(3, Math.min(5, Math.floor(targetWordCount / 400)));
      case 'moderate':
        return Math.max(5, Math.min(8, Math.floor(targetWordCount / 350)));
      case 'complex':
        return Math.max(7, Math.min(10, Math.floor(targetWordCount / 300)));
      default:
        return 5;
    }
  }

  private async generateSectionTopics(
    keyword: string,
    sectionCount: number,
    structure: 'linear' | 'hierarchical' | 'thematic',
    researchData: any,
    serpData: any,
    contentGaps: string[]
  ): Promise<SectionTopic[]> {
    const topics: SectionTopic[] = [];
    
    switch (structure) {
      case 'linear':
        topics.push(...this.generateLinearTopics(keyword, sectionCount));
        break;
      case 'hierarchical':
        topics.push(...this.generateHierarchicalTopics(keyword, sectionCount, researchData, serpData));
        break;
      case 'thematic':
        topics.push(...this.generateThematicTopics(keyword, sectionCount, researchData, contentGaps));
        break;
    }
    
    return topics.slice(0, sectionCount);
  }

  private generateLinearTopics(keyword: string, sectionCount: number): SectionTopic[] {
    const topics: SectionTopic[] = [];
    
    // Standard linear progression
    const baseTopics = [
      { title: `What is ${keyword}?`, keywords: [keyword, 'definition', 'overview'], researchFocus: ['definition', 'basics'], contentAngle: 'informative' as const },
      { title: `Why ${keyword} Matters`, keywords: [keyword, 'importance', 'benefits'], researchFocus: ['benefits', 'importance'], contentAngle: 'persuasive' as const },
      { title: `How to Implement ${keyword}`, keywords: [keyword, 'implementation', 'guide'], researchFocus: ['implementation', 'steps'], contentAngle: 'practical' as const },
      { title: `Best Practices for ${keyword}`, keywords: [keyword, 'best practices', 'tips'], researchFocus: ['best practices', 'tips'], contentAngle: 'practical' as const },
      { title: `Common Challenges with ${keyword}`, keywords: [keyword, 'challenges', 'problems'], researchFocus: ['challenges', 'solutions'], contentAngle: 'analytical' as const },
      { title: `${keyword} Examples and Case Studies`, keywords: [keyword, 'examples', 'case studies'], researchFocus: ['examples', 'case studies'], contentAngle: 'informative' as const },
      { title: `Future of ${keyword}`, keywords: [keyword, 'future', 'trends'], researchFocus: ['future', 'trends'], contentAngle: 'analytical' as const },
      { title: `${keyword} Tools and Resources`, keywords: [keyword, 'tools', 'resources'], researchFocus: ['tools', 'resources'], contentAngle: 'practical' as const }
    ];
    
    return baseTopics.slice(0, sectionCount);
  }

  private generateHierarchicalTopics(keyword: string, sectionCount: number, researchData: any, serpData: any): SectionTopic[] {
    const topics: SectionTopic[] = [];
    
    // Extract main themes from research data
    const mainThemes = this.extractMainThemes(researchData, serpData);
    
    // Generate topics based on themes
    for (let i = 0; i < sectionCount && i < mainThemes.length; i++) {
      const theme = mainThemes[i];
      topics.push({
        title: `${theme} in ${keyword}`,
        keywords: [keyword, theme],
        researchFocus: [theme],
        contentAngle: 'informative' as const
      });
    }
    
    // Fill with default topics if needed
    while (topics.length < sectionCount) {
      const defaultTopic = this.getDefaultTopic(keyword, topics.length + 1);
      topics.push(defaultTopic);
    }
    
    return topics;
  }

  private generateThematicTopics(keyword: string, sectionCount: number, researchData: any, contentGaps: string[]): SectionTopic[] {
    const topics: SectionTopic[] = [];
    
    // Focus on content gaps and thematic areas
    const themes = [...contentGaps];
    
    // Add themes from research data
    if (researchData && researchData.sources) {
      researchData.sources.forEach((source: any) => {
        if (source.topics) {
          themes.push(...source.topics);
        }
      });
    }
    
    // Deduplicate and select top themes
    const uniqueThemes = [...new Set(themes)].slice(0, sectionCount);
    
    for (let i = 0; i < uniqueThemes.length; i++) {
      const theme = uniqueThemes[i];
      topics.push({
        title: `${keyword} and ${theme}`,
        keywords: [keyword, theme],
        researchFocus: [theme],
        contentAngle: 'analytical' as const
      });
    }
    
    // Fill with default topics if needed
    while (topics.length < sectionCount) {
      const defaultTopic = this.getDefaultTopic(keyword, topics.length + 1);
      topics.push(defaultTopic);
    }
    
    return topics;
  }

  private extractMainThemes(researchData: any, serpData: any): string[] {
    const themes: string[] = [];
    
    // Extract from research data
    if (researchData && researchData.sources) {
      researchData.sources.forEach((source: any) => {
        if (source.topics) {
          themes.push(...source.topics);
        }
      });
    }
    
    // Extract from SERP data
    if (serpData && serpData.commonTopics) {
      themes.push(...serpData.commonTopics);
    }
    
    // Return unique themes
    return [...new Set(themes)];
  }

  private getDefaultTopic(keyword: string, index: number): SectionTopic {
    const defaultTopics = [
      { title: `Understanding ${keyword}`, keywords: [keyword, 'understanding'], researchFocus: ['basics'], contentAngle: 'informative' as const },
      { title: `Benefits of ${keyword}`, keywords: [keyword, 'benefits'], researchFocus: ['benefits'], contentAngle: 'persuasive' as const },
      { title: `Implementing ${keyword}`, keywords: [keyword, 'implementation'], researchFocus: ['implementation'], contentAngle: 'practical' as const },
      { title: `${keyword} Best Practices`, keywords: [keyword, 'best practices'], researchFocus: ['best practices'], contentAngle: 'practical' as const },
      { title: `${keyword} Challenges`, keywords: [keyword, 'challenges'], researchFocus: ['challenges'], contentAngle: 'analytical' as const }
    ];
    
    return defaultTopics[Math.min(index - 1, defaultTopics.length - 1)];
  }

  private async generateH3Subsections(
    parentTopic: SectionTopic,
    parentOrder: number,
    complexity: 'simple' | 'moderate' | 'complex'
  ): Promise<H3Subsection[]> {
    const subsections: H3Subsection[] = [];
    
    // Determine number of H3 subsections based on complexity
    const subsectionCount = this.determineSubsectionCount(complexity);
    
    // Generate subsection topics
    const subsectionTopics = this.generateSubsectionTopics(parentTopic, subsectionCount);
    
    // Create H3 subsections
    for (let i = 0; i < subsectionTopics.length; i++) {
      const topic = subsectionTopics[i];
      const subsection: H3Subsection = {
        id: `h3-${parentOrder}-${i + 1}`,
        title: topic.title,
        type: 'h3',
        order: i + 1,
        estimatedWordCount: Math.floor((parentTopic.estimatedWordCount || 500) / subsectionCount),
        keywords: topic.keywords,
        researchFocus: topic.researchFocus,
        parentSection: `h2-${parentOrder}`,
        contentAngle: topic.contentAngle
      };
      
      subsections.push(subsection);
    }
    
    return subsections;
  }

  private determineSubsectionCount(complexity: 'simple' | 'moderate' | 'complex'): number {
    switch (complexity) {
      case 'simple':
        return 2;
      case 'moderate':
        return 3;
      case 'complex':
        return 4;
      default:
        return 3;
    }
  }

  private generateSubsectionTopics(parentTopic: SectionTopic, count: number): SubsectionTopic[] {
    const topics: SubsectionTopic[] = [];
    
    // Generate subsection topics based on parent topic
    const baseSubtopics = [
      { title: `Key Aspects of ${parentTopic.title}`, keywords: parentTopic.keywords, researchFocus: parentTopic.researchFocus, contentAngle: 'detailed' as const },
      { title: `${parentTopic.title} Examples`, keywords: [...parentTopic.keywords, 'examples'], researchFocus: ['examples'], contentAngle: 'example' as const },
      { title: `Comparing ${parentTopic.title} Options`, keywords: [...parentTopic.keywords, 'comparison'], researchFocus: ['comparison'], contentAngle: 'comparison' as const },
      { title: `Implementing ${parentTopic.title}`, keywords: [...parentTopic.keywords, 'implementation'], researchFocus: ['implementation'], contentAngle: 'implementation' as const }
    ];
    
    return baseSubtopics.slice(0, count);
  }

  private calculateEstimatedWordCount(sections: H2Section[]): number {
    return sections.reduce((total, section) => {
      const sectionTotal = section.estimatedWordCount + 
        section.subsections.reduce((subTotal, subsection) => subTotal + subsection.estimatedWordCount, 0);
      return total + sectionTotal;
    }, 0);
  }
}

interface SectionTopic {
  title: string;
  keywords: string[];
  researchFocus: string[];
  contentAngle: 'informative' | 'persuasive' | 'practical' | 'analytical';
  estimatedWordCount?: number;
}

interface SubsectionTopic {
  title: string;
  keywords: string[];
  researchFocus: string[];
  contentAngle: 'detailed' | 'example' | 'comparison' | 'implementation';
}
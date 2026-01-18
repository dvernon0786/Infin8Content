// Inngest Worker
// Story 4A-1: Article Generation Initiation and Queue Setup
// Story 4A-2: Section-by-Section Architecture and Outline Generation
// Story 4A-3: Real-Time Research Per Section (Tavily Integration)
// Tier-1 Producer story for article generation infrastructure

import { Inngest } from 'inngest';
import { articleService } from './article-service';
import { queueService } from './queue-service';
import { outlineGenerator } from './outline/outline-generator';
import { sectionResearcher } from './research/section-researcher';

// Initialize Inngest
const inngestClient = new Inngest({ id: 'article-generation' });

// Article Generation Worker
export const generateArticleWorker = inngestClient.createFunction(
  {
    id: 'generate-article',
    name: 'Generate Article',
    retries: 3,
  },
  { event: 'generate-article' },
  async ({ event, step }: any) => {
    const { articleId, organizationId, userId } = event.data;

    try {
      // Update article status to generating
      await step.run('update-status-generating', async () => {
        return await articleService.updateArticleStatus(articleId, 'generating');
      });

      // Generate article outline using OutlineGenerator
      const outline = await step.run('generate-outline', async () => {
        const article = await articleService.getArticle(articleId);
        if (!article) {
          throw new Error('Article not found');
        }
        
        return await outlineGenerator.generateOutline({
          articleId,
          keyword: article.keyword,
          targetWordCount: article.target_word_count,
          writingStyle: article.writing_style,
          targetAudience: article.target_audience,
          customInstructions: article.custom_instructions
        });
      });

      // Research article sections using SectionResearcher
      const researchResults = await step.run('research-sections', async () => {
        const article = await articleService.getArticle(articleId);
        if (!article || !article.outline) {
          throw new Error('Article outline not found');
        }
        
        return await sectionResearcher.researchArticleSections(
          articleId,
          article.outline.sections || [],
          {
            maxConcurrent: 3,
            citationStyle: 'apa',
            maxSourcesPerSection: 20,
            includeCitations: true
          }
        );
      });

      // Update article status to completed
      await step.run('update-status-completed', async () => {
        const startTime = Date.now();
        const endTime = Date.now();
        const generationTime = endTime - startTime;
        
        // Track usage
        await articleService.trackUsage(
          organizationId,
          userId,
          articleId,
          1, // credits used
          generationTime,
          0.05 // estimated API costs
        );

        return await articleService.updateArticleStatus(articleId, 'completed');
      });

      return {
        success: true,
        articleId,
        sections: researchResults.length,
        outline: outline.sections?.length || 0
      };

    } catch (error) {
      console.error('Article generation failed:', error);
      
      // Update article status to failed
      await step.run('update-status-failed', async () => {
        return await articleService.updateArticleStatus(
          articleId,
          'failed',
          error instanceof Error ? error.message : 'Unknown error'
        );
      });

      throw error;
    }
  }
);

// Queue Processing Worker
export const processQueueWorker = inngestClient.createFunction(
  {
    id: 'process-queue',
    name: 'Process Article Generation Queue',
    retries: 3,
  },
  { cron: '*/30 * * * *' },
  async ({ step }: any) => {
    try {
      // Get next queued article
      const queueEntry = await step.run('get-next-queued', async () => {
        return await queueService.getNextQueuedArticle('queue-worker');
      });

      if (!queueEntry) {
        return { message: 'No queued articles to process' };
      }

      // Trigger article generation
      await step.run('trigger-generation', async () => {
        return await inngestClient.send({
          name: 'generate-article',
          data: {
            articleId: queueEntry.article_id,
            organizationId: 'org-id', // Would get from article
            userId: 'user-id' // Would get from article
          }
        });
      });

      return {
        processed: queueEntry.article_id,
        queuePosition: queueEntry.queue_position
      };

    } catch (error) {
      console.error('Queue processing failed:', error);
      throw error;
    }
  }
);

// Queue Cleanup Worker
export const cleanupQueueWorker = inngestClient.createFunction(
  {
    id: 'cleanup-queue',
    name: 'Cleanup Article Generation Queue',
    retries: 3,
  },
  { cron: '0 */2 * * *' }, // Every 2 hours
  async ({ step }: any) => {
    try {
      await step.run('optimize-queue', async () => {
        return await queueService.optimizeQueue();
      });

      return { message: 'Queue cleanup completed' };

    } catch (error) {
      console.error('Queue cleanup failed:', error);
      throw error;
    }
  }
);

// Helper functions
async function generateArticleOutline(articleId: string) {
  const article = await articleService.getArticle(articleId);
  if (!article) {
    throw new Error('Article not found');
  }

  // Generate outline based on keyword research
  const outline = {
    sections: [
      {
        type: 'introduction',
        title: `Introduction to ${article.keyword}`,
        order: 1
      },
      {
        type: 'h2',
        title: `What is ${article.keyword}?`,
        order: 2
      },
      {
        type: 'h2',
        title: `Benefits of ${article.keyword}`,
        order: 3
      },
      {
        type: 'h2',
        title: `How to Implement ${article.keyword}`,
        order: 4
      },
      {
        type: 'h2',
        title: `Best Practices for ${article.keyword}`,
        order: 5
      },
      {
        type: 'conclusion',
        title: `Conclusion: ${article.keyword} Summary`,
        order: 6
      }
    ],
    estimatedWordCount: article.target_word_count
  };

  // Update article with outline
  await articleService.updateArticle(articleId, {
    outline: outline
  });

  return outline;
}

async function generateArticleSections(articleId: string, outline: any) {
  const sections = outline.sections || [];
  const createdSections = [];

  // Create article sections
  for (const sectionData of sections) {
    const section = await articleService.createArticleSection(
      articleId,
      sectionData.type,
      sectionData.title,
      sectionData.order
    );
    createdSections.push(section);

    // Generate section content
    await generateSectionContent(section.id, sectionData);
  }

  return createdSections;
}

async function generateSectionContent(sectionId: string, sectionData: any) {
  const startTime = Date.now();

  try {
    // Simulate content generation (would integrate with LLM APIs)
    const content = generateContentForSection(sectionData);
    
    // Update section with content
    await articleService.updateArticleSection(sectionId, {
      content: content,
      word_count: content.split(' ').length,
      status: 'completed',
      processing_time_ms: Date.now() - startTime,
      research_data: {
        sources: [],
        keywords: [sectionData.title.toLowerCase()]
      },
      citations: []
    });

  } catch (error) {
    // Mark section as failed
    await articleService.updateArticleSection(sectionId, {
      status: 'failed',
      error_message: error instanceof Error ? error.message : 'Unknown error',
      processing_time_ms: Date.now() - startTime
    });
    
    throw error;
  }
}

function generateContentForSection(sectionData: any): string {
  // Simple content generation (would integrate with LLM APIs)
  const { type, title } = sectionData;
  
  switch (type) {
    case 'introduction':
      return `# ${title}

This comprehensive guide explores the key aspects of ${title.toLowerCase()}. In this article, we'll dive deep into the fundamentals, benefits, and practical applications that will help you understand and implement these concepts effectively.

${title.toLowerCase()} has become increasingly important in today's digital landscape. Whether you're a beginner or an experienced practitioner, this guide will provide valuable insights and actionable information to enhance your understanding and skills.

Let's explore the essential elements that make ${title.toLowerCase()} so impactful and relevant in modern contexts.`;

    case 'h2':
      return `## ${title}

When it comes to ${title.toLowerCase()}, there are several key factors to consider. This section will explore the core concepts and practical applications that will help you master this important topic.

The fundamental principles behind ${title.toLowerCase()} are rooted in established best practices and proven methodologies. By understanding these core concepts, you'll be better equipped to implement effective strategies and achieve optimal results.

Throughout this section, we'll examine various aspects of ${title.toLowerCase()} and provide practical examples that demonstrate their real-world applications. This comprehensive approach ensures that you gain both theoretical knowledge and practical skills.`;

    case 'h3':
      return `### ${title}

Building on the foundation established earlier, ${title.toLowerCase()} requires careful consideration of several important elements. This subsection will delve deeper into specific aspects that are crucial for successful implementation.

The nuances of ${title.toLowerCase()} can vary depending on the specific context and requirements. However, there are certain universal principles that apply across different scenarios and use cases.

By focusing on these key aspects of ${title.toLowerCase()}, you'll develop a more robust understanding that can be applied to various situations and challenges you may encounter.`;

    case 'conclusion':
      return `## ${title}

In conclusion, ${title.toLowerCase()} represents a critical component of modern strategies and approaches. Throughout this article, we've explored the fundamental concepts, practical applications, and best practices that contribute to successful implementation.

The key takeaways from our discussion of ${title.toLowerCase()} include the importance of proper planning, consistent execution, and continuous improvement. These elements work together to create a comprehensive framework that can adapt to changing requirements and circumstances.

As you move forward with implementing ${title.toLowerCase()}, remember that success often comes from a combination of theoretical knowledge, practical experience, and ongoing learning. Stay curious, keep experimenting, and don't hesitate to seek guidance from experts and peers in the field.

The journey of mastering ${title.toLowerCase()} is ongoing, and each step forward brings new insights and opportunities for growth. Embrace the process, celebrate your progress, and continue building on the foundation you've established through this comprehensive guide.`;

    case 'faq':
      return `## ${title}

### Frequently Asked Questions

**Q: What is the most important aspect of ${title.toLowerCase()}?**
A: The most critical aspect is understanding the fundamental principles and how they apply to your specific context. This foundation will guide all subsequent decisions and actions.

**Q: How long does it take to master ${title.toLowerCase()}?**
A: Mastery varies by individual, but consistent practice and continuous learning typically lead to significant improvement within 3-6 months of dedicated effort.

**Q: What are common mistakes to avoid with ${title.toLowerCase()}?**
A: Common pitfalls include rushing implementation without proper planning, neglecting best practices, and failing to adapt to changing requirements or feedback.

**Q: Where can I learn more about ${title.toLowerCase()}?**
A: Additional resources include industry publications, professional communities, and specialized training programs that focus on advanced techniques and emerging trends.`;

    default:
      return `## ${title}

This section explores important aspects of ${title.toLowerCase()} in detail. The content is designed to provide comprehensive coverage of the topic while maintaining clarity and practical relevance.

The information presented here builds upon the foundations established earlier in this article, creating a cohesive and logical flow of ideas that enhances understanding and retention.

By examining ${title.toLowerCase()} from multiple perspectives, we gain a more nuanced appreciation for its significance and applications in various contexts.`;
  }
}

// Export the Inngest instance for use in other modules
export { inngestClient as inngest };
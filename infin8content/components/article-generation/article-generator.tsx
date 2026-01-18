// Article Generator
// Story 4A-1: Article Generation Initiation and Queue Setup
// Tier-1 Producer story for article generation infrastructure
// UI Component for initiation only (no domain logic)

'use client';

import { useState, useEffect } from 'react';
import { GenerationForm, ArticleGenerationRequest } from './generation-form';
import { articleService } from '@/lib/article-generation/article-service';

export interface ArticleGeneratorProps {
  organizationId: string;
  userId: string;
  availableCredits?: number;
}

export function ArticleGenerator({ organizationId, userId, availableCredits = 0 }: ArticleGeneratorProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedArticle, setGeneratedArticle] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (request: ArticleGenerationRequest) => {
    try {
      setIsGenerating(true);
      setError(null);
      
      // Create article (this will add to queue)
      const article = await articleService.createArticle(
        organizationId,
        userId,
        request
      );
      
      setGeneratedArticle(article);
      
      // Redirect to article editor or show progress
      console.log('Article created:', article);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create article');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCancel = async () => {
    if (generatedArticle) {
      try {
        await articleService.cancelArticle(generatedArticle.id);
        setGeneratedArticle(null);
      } catch (err) {
        console.error('Failed to cancel article:', err);
      }
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">
          Generate Article
        </h1>
        
        <p className="text-gray-600 mb-6">
          Enter your target keyword and preferences to generate a comprehensive, SEO-optimized article.
        </p>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-6">
            <strong>Error:</strong> {error}
          </div>
        )}

        <GenerationForm
          onSubmit={handleSubmit}
          disabled={isGenerating}
          availableCredits={availableCredits}
        />

        {generatedArticle && (
          <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-md">
            <h3 className="text-green-800 font-semibold mb-2">Article Queued Successfully!</h3>
            <p className="text-green-700 mb-4">
              Your article "{generatedArticle.keyword}" has been added to the generation queue.
              You'll be notified when it's ready.
            </p>
            <div className="flex space-x-4">
              <button
                onClick={handleCancel}
                className="px-4 py-2 bg-red-100 text-red-700 rounded-md hover:bg-red-200"
              >
                Cancel
              </button>
              <button
                onClick={() => window.location.href = `/articles/${generatedArticle.id}`}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                View Progress
              </button>
            </div>
          </div>
        )}

        {isGenerating && (
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
            <div className="flex items-center space-x-3">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              <span className="text-blue-700">Creating article and adding to queue...</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ArticleGenerator;
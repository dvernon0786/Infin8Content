// Article Generation Form
// Story 4A-1: Article Generation Initiation and Queue Setup
// Tier-1 Producer story for article generation infrastructure
// UI Component for initiation only (no domain logic)

'use client';

import { useState } from 'react';

export interface ArticleGenerationRequest {
  keyword: string;
  target_word_count: number;
  writing_style: string;
  target_audience: string;
  custom_instructions?: string;
}

export interface GenerationFormProps {
  onSubmit: (request: ArticleGenerationRequest) => void;
  disabled?: boolean;
  availableCredits?: number;
}

export function GenerationForm({ onSubmit, disabled = false, availableCredits = 0 }: GenerationFormProps) {
  const [request, setRequest] = useState<ArticleGenerationRequest>({
    keyword: '',
    target_word_count: 2000,
    writing_style: 'professional',
    target_audience: 'general',
    custom_instructions: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    if (!request.keyword.trim()) {
      alert('Please enter a keyword');
      return;
    }

    if (availableCredits <= 0) {
      alert('You have reached your article limit for this month');
      return;
    }

    onSubmit(request);
  };

  const handleInputChange = (field: keyof ArticleGenerationRequest, value: string | number) => {
    setRequest(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Keyword Input */}
      <div>
        <label htmlFor="keyword" className="block text-sm font-medium text-gray-700 mb-2">
          Target Keyword
        </label>
        <input
          type="text"
          id="keyword"
          value={request.keyword}
          onChange={(e) => handleInputChange('keyword', e.target.value)}
          placeholder="e.g., best running shoes for marathons"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          disabled={disabled}
          required
        />
      </div>

      {/* Word Count Selection */}
      <div>
        <label htmlFor="target_word_count" className="block text-sm font-medium text-gray-700 mb-2">
          Article Length
        </label>
        <select
          id="target_word_count"
          value={request.target_word_count}
          onChange={(e) => handleInputChange('target_word_count', parseInt(e.target.value))}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          disabled={disabled}
        >
          <option value={1500}>1,500 words</option>
          <option value={2000}>2,000 words</option>
          <option value={3000}>3,000 words</option>
          <option value={5000}>5,000 words</option>
          <option value={0}>Custom</option>
        </select>
      </div>

      {/* Writing Style */}
      <div>
        <label htmlFor="writing_style" className="block text-sm font-medium text-gray-700 mb-2">
          Writing Style
        </label>
        <select
          id="writing_style"
          value={request.writing_style}
          onChange={(e) => handleInputChange('writing_style', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          disabled={disabled}
        >
          <option value="professional">Professional</option>
          <option value="conversational">Conversational</option>
          <option value="technical">Technical</option>
          <option value="casual">Casual</option>
          <option value="formal">Formal</option>
        </select>
      </div>

      {/* Target Audience */}
      <div>
        <label htmlFor="target_audience" className="block text-sm font-medium text-gray-700 mb-2">
          Target Audience
        </label>
        <select
          id="target_audience"
          value={request.target_audience}
          onChange={(e) => handleInputChange('target_audience', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          disabled={disabled}
        >
          <option value="general">General</option>
          <option value="b2b">B2B</option>
          <option value="b2c">B2C</option>
          <option value="academic">Academic</option>
          <option value="beginner">Beginner</option>
          <option value="expert">Expert</option>
        </select>
      </div>

      {/* Custom Instructions */}
      <div>
        <label htmlFor="custom_instructions" className="block text-sm font-medium text-gray-700 mb-2">
          Custom Instructions (Optional)
        </label>
        <textarea
          id="custom_instructions"
          value={request.custom_instructions}
          onChange={(e) => handleInputChange('custom_instructions', e.target.value)}
          placeholder="Any specific requirements or preferences for this article..."
          rows={4}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          disabled={disabled}
        />
      </div>

      {/* Credits Display */}
      <div className="bg-gray-50 p-4 rounded-md">
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium text-gray-700">Available Credits:</span>
          <span className={`text-sm font-bold ${availableCredits > 0 ? 'text-green-600' : 'text-red-600'}`}>
            {availableCredits}
          </span>
        </div>
        {availableCredits <= 0 && (
          <div className="mt-2 text-sm text-red-600">
            You've reached your article limit for this month. Upgrade your plan to continue generating articles.
          </div>
        )}
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={disabled || !request.keyword.trim() || availableCredits <= 0}
        className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-gray-400 disabled:cursor-not-allowed"
      >
        {disabled ? 'Generating...' : 'Generate Article'}
      </button>
    </form>
  );
}

export default GenerationForm;
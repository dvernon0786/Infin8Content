// Publish to WordPress Button Component
// Story 5-1: Publish Article to WordPress (Minimal One-Click Export)

'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ExternalLink, Loader2, CheckCircle, AlertCircle } from 'lucide-react';

interface PublishButtonProps {
  articleId: string;
  articleStatus: string;
  className?: string;
}

export function PublishToWordPressButton({ articleId, articleStatus, className }: PublishButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    url?: string;
    error?: string;
    alreadyPublished?: boolean;
  } | null>(null);

  const handlePublish = async () => {
    setIsLoading(true);
    setResult(null);

    try {
      const response = await fetch('/api/articles/publish', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          articleId,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setResult({
          success: true,
          url: data.url,
          alreadyPublished: data.alreadyPublished,
        });
      } else {
        setResult({
          success: false,
          error: data.error || 'Failed to publish to WordPress',
        });
      }
    } catch (error) {
      setResult({
        success: false,
        error: 'Network error occurred while publishing',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Show success state with clickable URL
  if (result?.success && result.url) {
    return (
      <Card className="border-green-200 bg-green-50">
        <CardContent className="pt-6">
          <div className="flex items-center gap-3">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <div className="flex-1">
              <p className="font-lato text-green-800 font-medium">
                {result.alreadyPublished ? 'Already published to WordPress' : 'Successfully published to WordPress'}
              </p>
              <a 
                href={result.url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 font-lato text-green-600 hover:text-green-800 text-sm mt-1"
              >
                View published article
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show error state
  if (result?.success === false && result.error) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="pt-6">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <div className="flex-1">
              <p className="font-lato text-red-800 font-medium">
                Publishing failed
              </p>
              <p className="font-lato text-red-600 text-sm mt-1">
                {result.error}
              </p>
              <Button 
                onClick={handlePublish}
                disabled={isLoading}
                variant="outline"
                size="sm"
                className="mt-3 border-red-300 text-red-700 hover:bg-red-100"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Retrying...
                  </>
                ) : (
                  'Retry'
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show initial publish button
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex flex-col items-center text-center space-y-4">
          <div>
            <h3 className="font-poppins text-neutral-900 text-h4-desktop mb-2">
              Publish to WordPress
            </h3>
            <p className="font-lato text-neutral-600 text-body">
              Export this completed article to WordPress with a single click
            </p>
          </div>
          <Button 
            onClick={handlePublish}
            disabled={isLoading}
            className="bg-[--color-primary-blue] hover:bg-[--color-primary-blue-dark] text-white"
            size="lg"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Publishing...
              </>
            ) : (
              'Publish to WordPress'
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

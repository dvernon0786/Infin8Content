"use client";

import React from 'react';

interface ComingSoonPageProps {
  title?: string;
  description?: string;
  showCTA?: boolean;
}

const ComingSoonPage = ({ 
  title = "Coming Soon", 
  description = "This page is under construction and will be available soon.",
  showCTA = false 
}: ComingSoonPageProps) => {
  return (
    <div className="min-h-screen flex items-center justify-center p-8 bg-gray-50">
      <div className="text-center max-w-md p-12 bg-white rounded-xl shadow-lg">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          {title}
        </h1>
        <p className="text-lg text-gray-600 mb-8 leading-relaxed">
          {description}
        </p>
        {showCTA && (
          <div>
            <button className="bg-blue-500 text-white px-8 py-3 rounded-md text-base font-medium hover:bg-blue-600 transition-colors duration-200">
              Get Notified
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ComingSoonPage;

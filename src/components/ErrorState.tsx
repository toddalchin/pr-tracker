'use client';

interface ErrorStateProps {
  message?: string;
  error?: string;
  onRetry?: () => void;
}

export default function ErrorState({ message, error, onRetry }: ErrorStateProps) {
  const displayMessage = message || error || 'An unknown error occurred';
  
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="text-red-500 text-6xl mb-4">⚠️</div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Something went wrong</h1>
        <p className="text-gray-600 mb-4">{displayMessage}</p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        )}
      </div>
    </div>
  );
} 
import React from 'react';
import { useSelector } from 'react-redux';

// Consistent loader size configuration
const LOADER_SIZE = {
  SPINNER: 'w-20 h-20', // 80px x 80px
  CARD_PADDING: 'p-12',
  ICON_SIZE: 'h-5 w-5'
};

const GlobalLoader = () => {
  const { isLoading, message } = useSelector((state) => state.loader);

  if (!isLoading) return null;

  return (
    <div className="fixed inset-0 bg-gradient-to-b from-black/70 via-black/60 to-black/70 backdrop-blur-lg flex items-center justify-center z-50 p-4">
      <style>
        {`
          @keyframes shimmer {
            0%, 100% { opacity: 0.5; }
            50% { opacity: 1; }
          }
          @keyframes float {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-8px); }
          }
          @keyframes pulse-ring {
            0% { 
              box-shadow: 0 0 0 0 rgba(243, 110, 33, 0.7);
            }
            50% {
              box-shadow: 0 0 0 10px rgba(243, 110, 33, 0);
            }
            100% {
              box-shadow: 0 0 0 0 rgba(243, 110, 33, 0);
            }
          }
          @keyframes gradient-shift {
            0%, 100% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
          }
          .loader-spinner {
            animation: pulse-ring 2s infinite;
          }
          .loading-text {
            animation: float 2.5s ease-in-out infinite;
          }
        `}
      </style>

      <div className="flex flex-col items-center justify-center">
        {/* Professional Circle Loader */}
        <svg
          width="48"
          height="48"
          viewBox="0 0 48 48"
          fill="none"
          style={{
            animation: 'spin 1.2s linear infinite',
          }}
        >
          <circle
            cx="24"
            cy="24"
            r="20"
            stroke="rgba(255, 255, 255, 0.15)"
            strokeWidth="2"
          />
          <circle
            cx="24"
            cy="24"
            r="20"
            stroke="url(#spinGradient)"
            strokeWidth="2"
            strokeDasharray="31.4 125.6"
            strokeLinecap="round"
            style={{
              animation: 'spin 1.2s linear infinite',
            }}
          />
          <defs>
            <linearGradient id="spinGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#F36E21" />
              <stop offset="100%" stopColor="#FFC547" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      <style>
        {`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}
      </style>
    </div>
  );
};

export default GlobalLoader;

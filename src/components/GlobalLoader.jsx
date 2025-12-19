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
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <style>
        {`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}
      </style>

      <div className="flex flex-col items-center justify-center gap-3">
        {/* Optimized lightweight spinner */}
        <svg
          width="40"
          height="40"
          viewBox="0 0 40 40"
          fill="none"
          style={{
            animation: 'spin 1s linear infinite',
          }}
        >
          <circle
            cx="20"
            cy="20"
            r="18"
            stroke="rgba(255, 255, 255, 0.2)"
            strokeWidth="2"
          />
          <circle
            cx="20"
            cy="20"
            r="18"
            stroke="#F36E21"
            strokeWidth="2"
            strokeDasharray="28 112"
            strokeLinecap="round"
          />
        </svg>
        {message && <p className="text-white text-sm font-medium">{message}</p>}
      </div>
    </div>
  );
};

export default GlobalLoader;

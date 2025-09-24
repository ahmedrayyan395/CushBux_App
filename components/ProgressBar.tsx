// components/ProgressBar.tsx
import React from 'react';

interface ProgressBarProps {
  current: number;
  total: number;
  className?: string;
  maxDots?: number; // Maximum number of dots to display
}

const ProgressBar: React.FC<ProgressBarProps> = ({ 
  current, 
  total, 
  className = '',
  maxDots = 10 // Default maximum dots to prevent excessive length
}) => {
  const percentage = Math.min((current / total) * 100, 100);
  
  // Calculate the number of dots to display (capped at maxDots)
  const displayDots = Math.min(total, maxDots);
  
  // Calculate which steps should be shown as dots
  const getDotPosition = (index: number) => {
    if (displayDots === 1) return 0; // Single dot in the middle
    return (index / (displayDots - 1)) * 100; // Evenly spaced dots
  };
  
  // Determine if a dot should be filled based on current progress
  const isDotFilled = (dotIndex: number) => {
    const stepValue = total / displayDots;
    return current >= (dotIndex + 1) * stepValue;
  };

  return (
    <div className={`w-full bg-slate-700/50 rounded-full h-3 overflow-hidden relative ${className}`}>
      {/* Progress bar */}
      <div
        className="bg-gradient-to-r from-green-400 to-emerald-500 h-3 rounded-full transition-all duration-500 ease-out shadow-lg"
        style={{ width: `${percentage}%` }}
      >
        <div className="w-full h-full bg-gradient-to-r from-transparent to-white/10 animate-pulse"></div>
      </div>
      
      {/* Progress indicator dots - fixed number regardless of total */}
      <div className="absolute -top-1 left-0 right-0 flex justify-between px-1">
        {[...Array(displayDots)].map((_, i) => (
          <div
            key={i}
            className={`w-2 h-2 rounded-full border-2 relative z-10 ${
              isDotFilled(i)
                ? 'bg-green-400 border-green-300 shadow-lg shadow-green-400/50'
                : 'bg-slate-600 border-slate-500'
            }`}
            style={{ 
              marginLeft: i === 0 ? '0' : 'auto',
              marginRight: i === displayDots - 1 ? '0' : 'auto'
            }}
          />
        ))}
      </div>
    </div>
  );
};

export default ProgressBar;
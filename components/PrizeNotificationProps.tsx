// components/ProgressBar.tsx
import React from 'react';

interface ProgressBarProps {
  current: number;
  total: number;
  className?: string;
}

const ProgressBar: React.FC<ProgressBarProps> = ({ current, total, className = '' }) => {
  const percentage = Math.min((current / total) * 100, 100);

  return (
    <div className={`w-full bg-slate-700/30 rounded-full h-2.5 overflow-hidden ${className}`}>
      <div
        className="bg-gradient-to-r from-green-400 to-emerald-500 h-2.5 rounded-full transition-all duration-500 ease-out shadow-lg relative"
        style={{ width: `${percentage}%` }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-transparent to-white/20 animate-pulse"></div>
      </div>
      
      {/* Progress indicator dots */}
      <div className="relative -top-3.5 flex justify-between px-1">
        {[...Array(total)].map((_, i) => (
          <div
            key={i}
            className={`w-2.5 h-2.5 rounded-full border-2 transition-all duration-300 ${
              i < current
                ? 'bg-green-400 border-green-300 shadow-lg shadow-green-400/50 scale-110'
                : 'bg-slate-600 border-slate-500'
            }`}
            style={{ marginLeft: i === 0 ? '0%' : `${(i / (total - 1)) * 100}%` }}
          />
        ))}
      </div>
    </div>
  );
};

export default ProgressBar;


import React from 'react';
import { ICONS } from '../constants';

// This mirrors the structure in constants.tsx
interface Prize {
    type: string;
    value: number;
    weight: number;
    label: string;
}

interface SpinWheelProps {
  rotation: number;
  isSpinning: boolean;
  prizes: Prize[];
}

const SpinWheel: React.FC<SpinWheelProps> = ({ rotation, isSpinning, prizes }) => {
  const numPrizes = prizes.length;
  const segmentAngle = 360 / numPrizes;

  const getSegmentColors = () => {
    // A vibrant, consistent color palette
    const colors = ['#db2777', '#16a34a', '#4f46e5', '#f59e0b', '#be185d', '#059669', '#3730a3', '#d97706'];
    return prizes.map((_, index) => colors[index % colors.length]);
  };

  const segmentColors = getSegmentColors();
  const conicGradient = segmentColors.map((color, index) => 
      `${color} ${index * segmentAngle}deg ${(index + 1) * segmentAngle}deg`
  ).join(', ');

  return (
    <div className="flex flex-col items-center">
      {/* Spacer to keep layout consistent after removing prize text */}
      <div className="h-16 mb-2 flex flex-col justify-center items-center text-center">
         {/* The text display was removed as per user request to avoid confusion. The wheel itself is the only indicator. */}
      </div>

      {/* Wheel */}
      <div className="relative w-64 h-64">
        {/* Ticker */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-3 z-20"
             style={{ filter: 'drop-shadow(0 5px 5px rgba(0,0,0,0.5))' }}>
             <svg width="24" height="36" viewBox="0 0 28 42" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-6 h-9">
                <path d="M14 42C14 42 28 30 28 18C28 6 21.7175 0 14 0C6.2825 0 0 6 0 18C0 30 14 42Z" fill="#ff4757" stroke="#ffffff" strokeWidth="2"/>
             </svg>
        </div>
        
        {/* Wheel container */}
        <div
          className="relative w-full h-full rounded-full transition-transform duration-[4000ms] ease-out border-4 border-slate-700/50 shadow-2xl"
          style={{ 
            transform: `rotate(${rotation}deg) translateZ(0)`, // translateZ(0) can help with rendering performance
            background: `conic-gradient(${conicGradient})`,
            transitionTimingFunction: 'cubic-bezier(0.22, 1, 0.36, 1)', // Smoother ease-out
          }}
        >
          {/* Segment Lines */}
          {prizes.map((_, index) => (
             <div
                key={`line-${index}`}
                className="absolute w-full h-full"
                style={{ transform: `rotate(${index * segmentAngle}deg)` }}
             >
                <div className="w-1/2 h-px bg-slate-500/50 absolute top-1/2 -translate-y-1/2 right-0"></div>
             </div>
          ))}

          {/* Prize Labels */}
          {prizes.map((prize, index) => {
            const angle = segmentAngle * index + segmentAngle / 2;
            // Since all prizes are coins, we can remove the conditional logic.
            const icon = ICONS.coin;
            return (
              <div
                key={index}
                className="absolute w-full h-full"
                style={{ transform: `rotate(${angle}deg)` }}
              >
                 <div className="absolute w-1/2 h-full top-0 left-0 origin-right flex items-center justify-start pl-2">
                    <div 
                      className="flex items-center space-x-1 text-white" 
                      style={{ 
                        transform: 'rotate(-90deg)',
                        textShadow: '0px 1px 3px rgba(0,0,0,0.7)'
                      }}
                    >
                      <span className="font-bold text-xs tracking-tighter">{prize.label}</span>
                      {React.cloneElement(icon, { className: 'w-3.5 h-3.5' })}
                    </div>
                 </div>
              </div>
            );
          })}
        </div>

        {/* Center circle */}
         <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 bg-slate-800 rounded-full border-4 border-slate-600 shadow-inner flex items-center justify-center">
            <div className="w-12 h-12 bg-slate-700 rounded-full flex items-center justify-center shadow-md">
                 <span className="text-white font-bold text-lg tracking-widest">{isSpinning ? '...' : 'GO'}</span>
            </div>
        </div>
      </div>
    </div>
  );
};

export default SpinWheel;

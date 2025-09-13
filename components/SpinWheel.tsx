// components/SpinWheel.tsx
import React, { useEffect, useRef } from 'react';

interface Prize {
  label: string;
  value: number;
  type: string;
  color: string;
  textColor?: string;
}

interface SpinWheelProps {
  rotation: number;
  isSpinning: boolean;
  prizes: Prize[];
}

const SpinWheel: React.FC<SpinWheelProps> = ({ rotation, isSpinning, prizes }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wheelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const drawWheel = () => {
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      const radius = Math.min(centerX, centerY) - 10;
      
      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Draw outer glow
      const gradient = ctx.createRadialGradient(centerX, centerY, radius - 5, centerX, centerY, radius + 15);
      gradient.addColorStop(0, 'rgba(255, 215, 0, 0.3)');
      gradient.addColorStop(1, 'rgba(255, 215, 0, 0)');
      
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius + 10, 0, Math.PI * 2);
      ctx.fillStyle = gradient;
      ctx.fill();
      
      // Draw wheel segments
      const segmentAngle = (Math.PI * 2) / prizes.length;
      
      prizes.forEach((prize, index) => {
        const startAngle = index * segmentAngle;
        const endAngle = (index + 1) * segmentAngle;
        
        // Draw segment
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.arc(centerX, centerY, radius, startAngle, endAngle);
        ctx.closePath();
        
        ctx.fillStyle = prize.color;
        ctx.fill();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Draw text
        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate(startAngle + segmentAngle / 2);
        
        ctx.fillStyle = prize.textColor || '#ffffff';
        ctx.font = 'bold 12px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        // Split long text into multiple lines
        const maxWidth = radius * 0.6;
        const words = prize.label.split(' ');
        const lines = [];
        let currentLine = words[0];
        
        for (let i = 1; i < words.length; i++) {
          const testLine = currentLine + ' ' + words[i];
          if (ctx.measureText(testLine).width < maxWidth) {
            currentLine = testLine;
          } else {
            lines.push(currentLine);
            currentLine = words[i];
          }
        }
        lines.push(currentLine);
        
        const lineHeight = 14;
        const totalHeight = lines.length * lineHeight;
        
        lines.forEach((line, lineIndex) => {
          ctx.fillText(
            line,
            radius * 0.65,
            -totalHeight / 2 + lineIndex * lineHeight + lineHeight / 2
          );
        });
        
        ctx.restore();
      });
      
      // Draw center circle
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius * 0.12, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255, 215, 0, 0.9)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.lineWidth = 3;
      ctx.stroke();
      
      // Draw center text
      ctx.fillStyle = '#000';
      ctx.font = 'bold 14px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('SPIN', centerX, centerY);
    };

    drawWheel();
  }, [prizes]);

  useEffect(() => {
    const wheel = wheelRef.current;
    if (!wheel) return;

    wheel.style.transition = isSpinning ? 'transform 4s cubic-bezier(0.17, 0.67, 0.83, 0.67)' : 'none';
    wheel.style.transform = `rotate(${rotation}deg)`;

    if (isSpinning) {
      // Add sparkle effect during spin
      wheel.style.boxShadow = '0 0 50px rgba(255, 215, 0, 0.7)';
      
      return () => {
        wheel.style.boxShadow = '0 0 20px rgba(255, 215, 0, 0.3)';
      };
    }
  }, [rotation, isSpinning]);

  return (
    <div className="relative flex items-center justify-center mb-4">
      {/* Pointer - More elegant design */}
      <div className="absolute top-0 z-20 transform -translate-y-1/2">
        <div className="relative">
          <div className="w-6 h-8 bg-gradient-to-b from-red-500 to-red-700 rounded-t-lg"></div>
          <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2 w-3 h-3 bg-red-700 rotate-45"></div>
          <div className="absolute top-1 left-1/2 transform -translate-x-1/2 w-1.5 h-1.5 bg-white rounded-full opacity-60"></div>
        </div>
      </div>
      
      {/* Wheel Container - Cleaner design without unnecessary elements */}
      <div className="relative w-72 h-72">
        {/* Outer glow */}
        <div className="absolute inset-0 bg-gradient-to-br from-yellow-400/20 to-orange-600/10 rounded-full blur-xl animate-pulse"></div>
        
        {/* Wheel */}
        <div
          ref={wheelRef}
          className="relative w-full h-full rounded-full shadow-xl transition-transform duration-4000 ease-out border-4 border-yellow-500/20"
          style={{ boxShadow: '0 0 20px rgba(255, 215, 0, 0.3)' }}
        >
          <canvas
            ref={canvasRef}
            width={288}
            height={288}
            className="w-full h-full rounded-full"
          />
        </div>
        
        {/* Decorative rings - Simplified */}
        <div className="absolute inset-3 border border-yellow-400/20 rounded-full pointer-events-none"></div>
        
        {/* Spinning glow effect */}
        {isSpinning && (
          <div className="absolute inset-0 bg-gradient-to-r from-yellow-400/10 via-orange-500/5 to-yellow-400/10 rounded-full animate-spin-slow pointer-events-none"></div>
        )}
      </div>
    </div>
  );
};

export default SpinWheel;
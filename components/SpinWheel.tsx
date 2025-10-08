import React, { useEffect, useRef, forwardRef, useImperativeHandle } from 'react';

interface Prize {
  label: string;
  value: number;
  type: string;
  color: string;
  textColor?: string;
  icon: string;
}

interface SpinWheelProps {
  rotation: number;
  isSpinning: boolean;
  prizes: Prize[];
  transitionEnabled?: boolean; // <-- added
}

const SpinWheel = forwardRef<HTMLDivElement, SpinWheelProps>(
  ({ rotation, isSpinning, prizes, transitionEnabled }, ref) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wheelRef = useRef<HTMLDivElement>(null);

  useImperativeHandle(ref, () => wheelRef.current!);

  // Improved canvas drawing with DPI scaling and icons beside text
useEffect(() => {
  const wheel = wheelRef.current;
  if (!wheel) return;

  const applyTransform = () => {
    // ✅ If transition is disabled, apply transform instantly
    if (transitionEnabled === false) {
      wheel.style.transition = 'none';
      wheel.style.transform = `rotate(${rotation}deg)`;
      return;
    }

    // ✅ Normal spin transition
    if (isSpinning) {
wheel.style.transition = 'transform 18s cubic-bezier(0.08, 0.35, 0.15, 0.95)'; // ⏳ premium extended smooth spin      wheel.style.transform = `rotate(${rotation}deg)`;
      wheel.style.boxShadow = '0 0 40px rgba(255, 215, 0, 0.7)';
    } else {
      wheel.style.transition = 'transform 0.1s ease-out';
      wheel.style.transform = `rotate(${rotation % 360}deg)`;
      wheel.style.boxShadow = '0 0 20px rgba(255, 215, 0, 0.3)';
    }
  };

  requestAnimationFrame(applyTransform);
}, [rotation, isSpinning, transitionEnabled]);

  // Resize observer with improved drawing
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const observer = new ResizeObserver(() => {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        const dpr = window.devicePixelRatio || 1;
        const rect = canvas.getBoundingClientRect();
        
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        canvas.style.width = `${rect.width}px`;
        canvas.style.height = `${rect.height}px`;
        ctx.scale(dpr, dpr);
        
        // Trigger redraw (same reduced dimensions as above)
        const drawWheel = () => {
          const centerX = rect.width / 2;
          const centerY = rect.height / 2;
          const radius = Math.min(centerX, centerY) - 10;
          
          ctx.clearRect(0, 0, rect.width, rect.height);
          
          const gradient = ctx.createRadialGradient(centerX, centerY, radius - 8, centerX, centerY, radius + 15);
          gradient.addColorStop(0, 'rgba(255, 215, 0, 0.4)');
          gradient.addColorStop(0.7, 'rgba(255, 215, 0, 0.1)');
          gradient.addColorStop(1, 'rgba(255, 215, 0, 0)');
          
          ctx.beginPath();
          ctx.arc(centerX, centerY, radius + 12, 0, Math.PI * 2);
          ctx.fillStyle = gradient;
          ctx.fill();
          
          const segmentAngle = (Math.PI * 2) / prizes.length;
          
          prizes.forEach((prize, index) => {
            const startAngle = index * segmentAngle;
            const endAngle = (index + 1) * segmentAngle;
            
            const segmentGradient = ctx.createLinearGradient(
              centerX + Math.cos(startAngle) * radius * 0.3,
              centerY + Math.sin(startAngle) * radius * 0.3,
              centerX + Math.cos(endAngle) * radius * 0.8,
              centerY + Math.sin(endAngle) * radius * 0.8
            );
            
            if (prize.color.includes('gradient')) {
              const colors = prize.color.match(/#[0-9A-Fa-f]{6}/g) || ['#FFD700', '#FFA500'];
              segmentGradient.addColorStop(0, colors[0]);
              segmentGradient.addColorStop(1, colors[1] || colors[0]);
            } else {
              segmentGradient.addColorStop(0, prize.color);
              segmentGradient.addColorStop(1, prize.color);
            }
            
            ctx.beginPath();
            ctx.moveTo(centerX, centerY);
            ctx.arc(centerX, centerY, radius, startAngle, endAngle);
            ctx.closePath();
            
            ctx.fillStyle = segmentGradient;
            ctx.fill();
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
            ctx.lineWidth = 1.5;
            ctx.stroke();
            
            ctx.save();
            ctx.translate(centerX, centerY);
            ctx.rotate(startAngle + segmentAngle / 2);
            
            const textRadius = radius * 0.65;
            const iconSize = radius * 0.09;
            
            // Draw label and icon side by side
            ctx.font = 'bold 10px Inter, sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = prize.textColor || '#ffffff';
            
            const maxWidth = radius * 0.5;
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
            
            const lineHeight = 11;
            const totalHeight = lines.length * lineHeight;
            
            // Draw text lines
            lines.forEach((line, lineIndex) => {
              ctx.fillText(
                line, 
                textRadius, 
                -totalHeight / 2 + lineIndex * lineHeight + lineHeight / 2
              );
            });
            
            // Draw icon to the right of the text
            ctx.font = `bold ${iconSize}px Arial`;
            const textWidth = ctx.measureText(prize.label).width;
            const iconX = textRadius + textWidth / 2 + iconSize / 2;
            const iconY = -totalHeight / 2 + totalHeight / 2;
            
            ctx.fillText(prize.icon, iconX, iconY);
            
            ctx.restore();
          });
          
          ctx.beginPath();
          ctx.arc(centerX, centerY, radius * 0.8, 0, Math.PI * 2);
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
          ctx.lineWidth = 1;
          ctx.stroke();
          
          const centerGradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius * 0.12);
          centerGradient.addColorStop(0, 'rgba(255, 255, 255, 0.9)');
          centerGradient.addColorStop(1, 'rgba(255, 215, 0, 0.9)');
          
          ctx.beginPath();
          ctx.arc(centerX, centerY, radius * 0.12, 0, Math.PI * 2);
          ctx.fillStyle = centerGradient;
          ctx.fill();
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
          ctx.lineWidth = 2.5;
          ctx.stroke();
          
          ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
          ctx.shadowBlur = 3;
          ctx.shadowOffsetX = 1;
          ctx.shadowOffsetY = 1;
          
          ctx.fillStyle = '#000';
          ctx.font = 'bold 14px Inter, sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('SPIN', centerX, centerY);
          
          ctx.shadowColor = 'transparent';
          ctx.shadowBlur = 0;
          ctx.shadowOffsetX = 0;
          ctx.shadowOffsetY = 0;
        };
        
        drawWheel();
      }
    });

    observer.observe(canvas);

    return () => {
      observer.disconnect();
    };
  }, [prizes]);

  // Animation effect
  useEffect(() => {
    const wheel = wheelRef.current;
    if (!wheel) return;

    const applyTransform = () => {
      if (isSpinning) {
        wheel.style.transition = 'transform 4s cubic-bezier(0.17, 0.67, 0.83, 0.67)';
        wheel.style.transform = `rotate(${rotation}deg)`;
        wheel.style.boxShadow = '0 0 40px rgba(255, 215, 0, 0.7)'; // Reduced glow
      } else {
        wheel.style.transition = 'transform 0.1s ease-out';
        wheel.style.transform = `rotate(${rotation % 360}deg)`;
        wheel.style.boxShadow = '0 0 20px rgba(255, 215, 0, 0.3)'; // Reduced glow
      }
    };

    requestAnimationFrame(applyTransform);
  }, [rotation, isSpinning]);

  const handleTouchStart = (e: React.TouchEvent) => {
    e.preventDefault();
  };

  return (
    <div className="relative flex items-center justify-center mb-6 spin-wheel-container" onTouchStart={handleTouchStart}>
      {/* Enhanced Pointer indicator */}
      <div className="absolute top-0 z-20 transform -translate-y-1/2">
        <div className="relative">
          <div className="w-6 h-8 bg-gradient-to-b from-red-600 to-red-800 rounded-t-lg shadow-lg border border-red-400"></div>
          <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2 w-3 h-3 bg-red-800 rotate-45 border-t border-l border-red-600"></div>
          <div className="absolute top-1 left-1/2 transform -translate-x-1/2 w-1.5 h-1.5 bg-white rounded-full opacity-70 shadow-inner"></div>
          <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-1.5 bg-red-900 rounded-b-lg"></div>
        </div>
      </div>
      
      {/* Main wheel container - SMALLER size */}
      <div className="relative w-80 h-80 mx-auto"> {/* Reduced from w-96 h-96 */}
        {/* Enhanced Background glow */}
        <div className="absolute inset-0 bg-gradient-to-br from-yellow-400/20 via-orange-500/15 to-red-600/5 rounded-full blur-xl animate-pulse-slow"></div>
        
        {/* Outer decorative rings */}
        <div className="absolute inset-0 border-6 border-yellow-500/10 rounded-full animate-pulse"></div> {/* Reduced from border-8 */}
        <div className="absolute inset-3 border-3 border-yellow-400/20 rounded-full"></div> {/* Reduced from inset-4 and border-4 */}
        
        {/* Wheel with enhanced styling */}
        <div
          ref={wheelRef}
          className="relative w-full h-full rounded-full shadow-xl border-6 border-yellow-500/30 overflow-hidden bg-gradient-to-br from-yellow-200/10 to-orange-600/10" /* Reduced border */
          style={{ 
            willChange: 'transform',
            aspectRatio: '1 / 1',
            backdropFilter: 'blur(8px)' // Reduced blur
          }}
        >
          <canvas
            ref={canvasRef}
            className="w-full h-full rounded-full"
          />
        </div>
        
        {/* Enhanced decorative border */}
        <div className="absolute inset-4 border-2 border-yellow-400/30 rounded-full pointer-events-none shadow-inner"></div> {/* Reduced from inset-6 */}
        
        {/* Spinning overlay effect */}
        {isSpinning && (
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-yellow-400/10 to-transparent rounded-full animate-spin-slow pointer-events-none"></div> /* Reduced opacity */
        )}
        
        {/* Outer glow ring */}
        <div className="absolute -inset-3 bg-gradient-to-r from-yellow-400/15 via-orange-500/8 to-yellow-400/15 rounded-full blur-sm pointer-events-none"></div> {/* Reduced glow */}
      </div>
    </div>
  );
});

export default SpinWheel;
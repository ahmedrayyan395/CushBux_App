import React, { useEffect, useRef, forwardRef, useImperativeHandle } from 'react';

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

const SpinWheel = forwardRef<HTMLDivElement, SpinWheelProps>(({ rotation, isSpinning, prizes }, ref) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wheelRef = useRef<HTMLDivElement>(null);

  useImperativeHandle(ref, () => wheelRef.current!);

  // Improved canvas drawing with DPI scaling
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Handle high DPI displays
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    
    // Set actual canvas size considering device pixel ratio
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    
    // Set display size (CSS pixels)
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;
    
    // Scale context to account for DPI
    ctx.scale(dpr, dpr);

    const drawWheel = () => {
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      const radius = Math.min(centerX, centerY) - 10;
      
      // Clear with proper dimensions
      ctx.clearRect(0, 0, rect.width, rect.height);
      
      // Draw glow effect
      const gradient = ctx.createRadialGradient(centerX, centerY, radius - 5, centerX, centerY, radius + 15);
      gradient.addColorStop(0, 'rgba(255, 215, 0, 0.3)');
      gradient.addColorStop(1, 'rgba(255, 215, 0, 0)');
      
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius + 10, 0, Math.PI * 2);
      ctx.fillStyle = gradient;
      ctx.fill();
      
      const segmentAngle = (Math.PI * 2) / prizes.length;
      
      // Draw segments
      prizes.forEach((prize, index) => {
        const startAngle = index * segmentAngle;
        const endAngle = (index + 1) * segmentAngle;
        
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
          ctx.fillText(line, radius * 0.65, -totalHeight / 2 + lineIndex * lineHeight + lineHeight / 2);
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

  // Resize observer to handle screen rotation and resizing
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const observer = new ResizeObserver(() => {
      // Force redraw on resize
      const ctx = canvas.getContext('2d');
      if (ctx) {
        const dpr = window.devicePixelRatio || 1;
        const rect = canvas.getBoundingClientRect();
        
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        canvas.style.width = `${rect.width}px`;
        canvas.style.height = `${rect.height}px`;
        ctx.scale(dpr, dpr);
        
        // Trigger redraw
        const drawWheel = () => {
          const centerX = rect.width / 2;
          const centerY = rect.height / 2;
          const radius = Math.min(centerX, centerY) - 10;
          
          ctx.clearRect(0, 0, rect.width, rect.height);
          
          const gradient = ctx.createRadialGradient(centerX, centerY, radius - 5, centerX, centerY, radius + 15);
          gradient.addColorStop(0, 'rgba(255, 215, 0, 0.3)');
          gradient.addColorStop(1, 'rgba(255, 215, 0, 0)');
          
          ctx.beginPath();
          ctx.arc(centerX, centerY, radius + 10, 0, Math.PI * 2);
          ctx.fillStyle = gradient;
          ctx.fill();
          
          const segmentAngle = (Math.PI * 2) / prizes.length;
          
          prizes.forEach((prize, index) => {
            const startAngle = index * segmentAngle;
            const endAngle = (index + 1) * segmentAngle;
            
            ctx.beginPath();
            ctx.moveTo(centerX, centerY);
            ctx.arc(centerX, centerY, radius, startAngle, endAngle);
            ctx.closePath();
            
            ctx.fillStyle = prize.color;
            ctx.fill();
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
            ctx.lineWidth = 2;
            ctx.stroke();
            
            ctx.save();
            ctx.translate(centerX, centerY);
            ctx.rotate(startAngle + segmentAngle / 2);
            
            ctx.fillStyle = prize.textColor || '#ffffff';
            ctx.font = 'bold 12px Inter, sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            
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
              ctx.fillText(line, radius * 0.65, -totalHeight / 2 + lineIndex * lineHeight + lineHeight / 2);
            });
            
            ctx.restore();
          });
          
          ctx.beginPath();
          ctx.arc(centerX, centerY, radius * 0.12, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(255, 215, 0, 0.9)';
          ctx.fill();
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
          ctx.lineWidth = 3;
          ctx.stroke();
          
          ctx.fillStyle = '#000';
          ctx.font = 'bold 14px Inter, sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('SPIN', centerX, centerY);
        };
        
        drawWheel();
      }
    });

    observer.observe(canvas);

    return () => {
      observer.disconnect();
    };
  }, [prizes]);

  // Improved animation with better performance
  useEffect(() => {
    const wheel = wheelRef.current;
    if (!wheel) return;

    const applyTransform = () => {
      if (isSpinning) {
        wheel.style.transition = 'transform 4s cubic-bezier(0.17, 0.67, 0.83, 0.67)';
        wheel.style.transform = `rotate(${rotation}deg)`;
        wheel.style.boxShadow = '0 0 50px rgba(255, 215, 0, 0.7)';
      } else {
        // Use GPU acceleration and ensure smooth stop
        wheel.style.transition = 'transform 0.1s ease-out';
        wheel.style.transform = `rotate(${rotation % 360}deg)`;
        wheel.style.boxShadow = '0 0 20px rgba(255, 215, 0, 0.3)';
      }
    };

    requestAnimationFrame(applyTransform);
  }, [rotation, isSpinning]);

  const handleTouchStart = (e: React.TouchEvent) => {
    e.preventDefault();
  };

  return (
    <div className="relative flex items-center justify-center mb-4 spin-wheel-container" onTouchStart={handleTouchStart}>
      {/* Pointer indicator */}
      <div className="absolute top-0 z-20 transform -translate-y-1/2">
        <div className="relative">
          <div className="w-6 h-8 bg-gradient-to-b from-red-500 to-red-700 rounded-t-lg"></div>
          <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2 w-3 h-3 bg-red-700 rotate-45"></div>
          <div className="absolute top-1 left-1/2 transform -translate-x-1/2 w-1.5 h-1.5 bg-white rounded-full opacity-60"></div>
        </div>
      </div>
      
      {/* Main wheel container */}
      <div className="relative w-72 h-72 mx-auto">
        {/* Background glow */}
        <div className="absolute inset-0 bg-gradient-to-br from-yellow-400/20 to-orange-600/10 rounded-full blur-xl animate-pulse"></div>
        
        {/* Wheel with fixed aspect ratio */}
        <div
          ref={wheelRef}
          className="relative w-full h-full rounded-full shadow-xl border-4 border-yellow-500/20 overflow-hidden"
          style={{ 
            willChange: 'transform',
            aspectRatio: '1 / 1'
          }}
        >
          <canvas
            ref={canvasRef}
            className="w-full h-full rounded-full"
          />
        </div>
        
        {/* Decorative border */}
        <div className="absolute inset-3 border border-yellow-400/20 rounded-full pointer-events-none"></div>
        
        {/* Spinning overlay effect */}
        {isSpinning && (
          <div className="absolute inset-0 bg-gradient-to-r from-yellow-400/10 via-orange-500/5 to-yellow-400/10 rounded-full animate-spin-slow pointer-events-none"></div>
        )}
      </div>
    </div>
  );
});

export default SpinWheel;
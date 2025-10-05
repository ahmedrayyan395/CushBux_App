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
}

const SpinWheel = forwardRef<HTMLDivElement, SpinWheelProps>(({ rotation, isSpinning, prizes }, ref) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wheelRef = useRef<HTMLDivElement>(null);

  useImperativeHandle(ref, () => wheelRef.current!);

  // Improved canvas drawing with DPI scaling and icons beside text
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
      const radius = Math.min(centerX, centerY) - 15;
      
      // Clear with proper dimensions
      ctx.clearRect(0, 0, rect.width, rect.height);
      
      // Draw outer glow effect
      const gradient = ctx.createRadialGradient(centerX, centerY, radius - 10, centerX, centerY, radius + 20);
      gradient.addColorStop(0, 'rgba(255, 215, 0, 0.4)');
      gradient.addColorStop(0.7, 'rgba(255, 215, 0, 0.1)');
      gradient.addColorStop(1, 'rgba(255, 215, 0, 0)');
      
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius + 15, 0, Math.PI * 2);
      ctx.fillStyle = gradient;
      ctx.fill();
      
      const segmentAngle = (Math.PI * 2) / prizes.length;
      
      // Draw segments with improved styling
      prizes.forEach((prize, index) => {
        const startAngle = index * segmentAngle;
        const endAngle = (index + 1) * segmentAngle;
        
        // Create segment gradient
        const segmentGradient = ctx.createLinearGradient(
          centerX + Math.cos(startAngle) * radius * 0.3,
          centerY + Math.sin(startAngle) * radius * 0.3,
          centerX + Math.cos(endAngle) * radius * 0.8,
          centerY + Math.sin(endAngle) * radius * 0.8
        );
        
        if (prize.color.includes('gradient')) {
          // Extract colors from gradient string for fallback
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
        
        // Draw segment border
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Draw text and icon beside each other
        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate(startAngle + segmentAngle / 2);
        
        const textRadius = radius * 0.7;
        const iconSize = radius * 0.1;
        
        // Draw label and icon side by side
        ctx.font = 'bold 11px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = prize.textColor || '#ffffff';
        
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
        
        const lineHeight = 12;
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
      
      // Draw inner decorative ring
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius * 0.85, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.lineWidth = 1;
      ctx.stroke();
      
      // Draw center circle with gradient
      const centerGradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius * 0.15);
      centerGradient.addColorStop(0, 'rgba(255, 255, 255, 0.9)');
      centerGradient.addColorStop(1, 'rgba(255, 215, 0, 0.9)');
      
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius * 0.15, 0, Math.PI * 2);
      ctx.fillStyle = centerGradient;
      ctx.fill();
      
      // Draw center border
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
      ctx.lineWidth = 3;
      ctx.stroke();
      
      // Draw center text with shadow
      ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
      ctx.shadowBlur = 4;
      ctx.shadowOffsetX = 2;
      ctx.shadowOffsetY = 2;
      
      ctx.fillStyle = '#000';
      ctx.font = 'bold 16px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('SPIN', centerX, centerY);
      
      // Reset shadow
      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;
    };

    drawWheel();
  }, [prizes]);

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
        
        // Trigger redraw
        const drawWheel = () => {
          const centerX = rect.width / 2;
          const centerY = rect.height / 2;
          const radius = Math.min(centerX, centerY) - 15;
          
          ctx.clearRect(0, 0, rect.width, rect.height);
          
          const gradient = ctx.createRadialGradient(centerX, centerY, radius - 10, centerX, centerY, radius + 20);
          gradient.addColorStop(0, 'rgba(255, 215, 0, 0.4)');
          gradient.addColorStop(0.7, 'rgba(255, 215, 0, 0.1)');
          gradient.addColorStop(1, 'rgba(255, 215, 0, 0)');
          
          ctx.beginPath();
          ctx.arc(centerX, centerY, radius + 15, 0, Math.PI * 2);
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
            ctx.lineWidth = 2;
            ctx.stroke();
            
            ctx.save();
            ctx.translate(centerX, centerY);
            ctx.rotate(startAngle + segmentAngle / 2);
            
            const textRadius = radius * 0.7;
            const iconSize = radius * 0.1;
            
            // Draw label and icon side by side
            ctx.font = 'bold 11px Inter, sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = prize.textColor || '#ffffff';
            
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
            
            const lineHeight = 12;
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
          ctx.arc(centerX, centerY, radius * 0.85, 0, Math.PI * 2);
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
          ctx.lineWidth = 1;
          ctx.stroke();
          
          const centerGradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius * 0.15);
          centerGradient.addColorStop(0, 'rgba(255, 255, 255, 0.9)');
          centerGradient.addColorStop(1, 'rgba(255, 215, 0, 0.9)');
          
          ctx.beginPath();
          ctx.arc(centerX, centerY, radius * 0.15, 0, Math.PI * 2);
          ctx.fillStyle = centerGradient;
          ctx.fill();
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
          ctx.lineWidth = 3;
          ctx.stroke();
          
          ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
          ctx.shadowBlur = 4;
          ctx.shadowOffsetX = 2;
          ctx.shadowOffsetY = 2;
          
          ctx.fillStyle = '#000';
          ctx.font = 'bold 16px Inter, sans-serif';
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
        wheel.style.boxShadow = '0 0 60px rgba(255, 215, 0, 0.8)';
      } else {
        wheel.style.transition = 'transform 0.1s ease-out';
        wheel.style.transform = `rotate(${rotation % 360}deg)`;
        wheel.style.boxShadow = '0 0 30px rgba(255, 215, 0, 0.4)';
      }
    };

    requestAnimationFrame(applyTransform);
  }, [rotation, isSpinning]);

  const handleTouchStart = (e: React.TouchEvent) => {
    e.preventDefault();
  };

  return (
    <div className="relative flex items-center justify-center mb-8 spin-wheel-container" onTouchStart={handleTouchStart}>
      {/* Enhanced Pointer indicator */}
      <div className="absolute top-0 z-20 transform -translate-y-1/2">
        <div className="relative">
          <div className="w-8 h-10 bg-gradient-to-b from-red-600 to-red-800 rounded-t-lg shadow-lg border border-red-400"></div>
          <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2 w-4 h-4 bg-red-800 rotate-45 border-t border-l border-red-600"></div>
          <div className="absolute top-1.5 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-white rounded-full opacity-70 shadow-inner"></div>
          <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-2 bg-red-900 rounded-b-lg"></div>
        </div>
      </div>
      
      {/* Main wheel container - Larger size */}
      <div className="relative w-96 h-96 mx-auto">
        {/* Enhanced Background glow */}
        <div className="absolute inset-0 bg-gradient-to-br from-yellow-400/30 via-orange-500/20 to-red-600/10 rounded-full blur-2xl animate-pulse-slow"></div>
        
        {/* Outer decorative rings */}
        <div className="absolute inset-0 border-8 border-yellow-500/10 rounded-full animate-pulse"></div>
        <div className="absolute inset-4 border-4 border-yellow-400/20 rounded-full"></div>
        
        {/* Wheel with enhanced styling */}
        <div
          ref={wheelRef}
          className="relative w-full h-full rounded-full shadow-2xl border-8 border-yellow-500/30 overflow-hidden bg-gradient-to-br from-yellow-200/10 to-orange-600/10"
          style={{ 
            willChange: 'transform',
            aspectRatio: '1 / 1',
            backdropFilter: 'blur(10px)'
          }}
        >
          <canvas
            ref={canvasRef}
            className="w-full h-full rounded-full"
          />
        </div>
        
        {/* Enhanced decorative border */}
        <div className="absolute inset-6 border-2 border-yellow-400/30 rounded-full pointer-events-none shadow-inner"></div>
        
        {/* Spinning overlay effect */}
        {isSpinning && (
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-yellow-400/15 to-transparent rounded-full animate-spin-slow pointer-events-none"></div>
        )}
        
        {/* Outer glow ring */}
        <div className="absolute -inset-4 bg-gradient-to-r from-yellow-400/20 via-orange-500/10 to-yellow-400/20 rounded-full blur-md pointer-events-none"></div>
      </div>
    </div>
  );
});

export default SpinWheel;
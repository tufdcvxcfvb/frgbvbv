import React, { useEffect, useRef } from 'react';

export const WaveBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = 0;
    let height = 0;

    // Use ResizeObserver for responsive canvas sizing as instructed in the guidelines
    const resizeObserver = new ResizeObserver((entries) => {
      for (let entry of entries) {
        const { width: boxWidth, height: boxHeight } = entry.contentRect;
        width = boxWidth;
        height = boxHeight;
        
        // Match canvas physical pixels with device display pixels for crisp graphics
        const dpr = window.devicePixelRatio || 1;
        canvas.width = boxWidth * dpr;
        canvas.height = boxHeight * dpr;
        ctx.scale(dpr, dpr);
      }
    });

    resizeObserver.observe(container);

    // Wave parameters
    let waves = [
      {
        y: 0.8,
        length: 0.003,
        amplitude: 35,
        speed: 0.008,
        color: 'rgba(99, 102, 241, 0.08)', // Indigo
        offset: 0
      },
      {
        y: 0.85,
        length: 0.005,
        amplitude: 25,
        speed: -0.005,
        color: 'rgba(139, 92, 246, 0.06)', // Purple
        offset: 100
      },
      {
        y: 0.78,
        length: 0.002,
        amplitude: 45,
        speed: 0.003,
        color: 'rgba(168, 85, 247, 0.04)', // Violet
        offset: 200
      }
    ];

    let t = 0;

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Render flowing waves
      waves.forEach((wave) => {
        ctx.beginPath();
        ctx.moveTo(0, height);

        for (let x = 0; x <= width; x++) {
          const sinValue = Math.sin(x * wave.length + wave.offset + t * wave.speed);
          const y = height * wave.y + sinValue * wave.amplitude;
          ctx.lineTo(x, y);
        }

        ctx.lineTo(width, height);
        ctx.closePath();
        ctx.fillStyle = wave.color;
        ctx.fill();
      });

      // Ambient moving background radial glow
      const gradient = ctx.createRadialGradient(
        width * (0.5 + Math.sin(t * 0.002) * 0.2), 
        height * (0.3 + Math.cos(t * 0.001) * 0.1), 
        10, 
        width * 0.5, 
        height * 0.5, 
        Math.max(width, height) * 0.8
      );
      gradient.addColorStop(0, 'rgba(30, 27, 75, 0.15)'); // Indigo dark tint
      gradient.addColorStop(0.5, 'rgba(15, 23, 42, 0)'); // Slate clear tint
      gradient.addColorStop(1, 'rgba(2, 6, 23, 0.4)'); // Deep Slate background
      
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      t += 1;
      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      resizeObserver.disconnect();
    };
  }, []);

  return (
    <div ref={containerRef} className="absolute inset-0 w-full h-full pointer-events-none -z-10 overflow-hidden bg-[#05060b]">
      {/* Background Mesh Gradients (Simulated Liquid Waves) */}
      <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-indigo-600/20 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-5%] right-[-5%] w-[50%] h-[50%] bg-purple-600/20 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute top-[20%] right-[10%] w-[30%] h-[40%] bg-cyan-500/10 rounded-full blur-[80px] pointer-events-none"></div>

      <canvas ref={canvasRef} className="w-full h-full block opacity-70" />
    </div>
  );
};

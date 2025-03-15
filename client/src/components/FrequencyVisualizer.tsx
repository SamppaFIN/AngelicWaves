import React, { useRef, useEffect } from 'react';
import { angelicFrequencies } from "@/lib/frequencyAnalysis";

interface FrequencyVisualizerProps {
  isActive: boolean;
  currentFrequency: number;
  detectionStatus: string;
  hasAngelicFrequency: boolean;
  minFrequency: number;
  maxFrequency: number;
}

export function FrequencyVisualizer({
  isActive,
  currentFrequency,
  detectionStatus,
  hasAngelicFrequency,
  minFrequency,
  maxFrequency
}: FrequencyVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!isActive || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let phase = 0;

    const draw = () => {
      const { width, height } = canvas.getBoundingClientRect();
      canvas.width = width;
      canvas.height = height;
      ctx.clearRect(0, 0, width, height);

      if (currentFrequency > 0) {
        // Draw Tesla-style frequency circles for each angelic frequency
        angelicFrequencies.forEach((freq, index) => {
          const isActive = Math.abs(currentFrequency - freq.frequency) < 5;
          const color = isActive ? 
            `hsl(${index * 60}, 100%, 50%)` : 
            'rgba(74, 222, 128, 0.2)';

          drawTeslaPattern(ctx, width/2, height/2, 100 + index * 20, phase, color, 6 + index);
        });
      } else {
        // Draw pentagram when no frequency detected
        drawPentagram(ctx, width/2, height/2, Math.min(width, height) * 0.4, phase);
      }

      // Update phase for animation
      phase += 0.02;
      animationFrameId = requestAnimationFrame(draw);
    };

    draw();

    return () => cancelAnimationFrame(animationFrameId);
  }, [isActive, currentFrequency]);

  function drawTeslaPattern(
    ctx: CanvasRenderingContext2D, 
    x: number, 
    y: number, 
    radius: number, 
    phase: number,
    color: string,
    points: number
  ) {
    ctx.beginPath();
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;

    for (let i = 0; i < 360; i += 1) {
      const angle = (i * Math.PI) / 180;
      const r = radius * (1 + 0.2 * Math.sin(points * angle + phase));
      const px = x + r * Math.cos(angle);
      const py = y + r * Math.sin(angle);

      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }

    ctx.closePath();
    ctx.stroke();
  }

  function drawPentagram(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    radius: number,
    phase: number
  ) {
    const points = 5;
    const angleOffset = phase;

    ctx.beginPath();
    ctx.strokeStyle = 'rgba(74, 222, 128, 0.5)';
    ctx.lineWidth = 2;

    for (let i = 0; i <= points * 2; i++) {
      const angle = (i * 4 * Math.PI) / points - Math.PI / 2 + angleOffset;
      const r = i % 2 === 0 ? radius : radius * 0.4;
      const px = x + r * Math.cos(angle);
      const py = y + r * Math.sin(angle);

      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }

    ctx.closePath();
    ctx.stroke();
  }

  return (
    <div className="relative w-full aspect-square max-w-2xl mx-auto mb-8">
      <canvas
        ref={canvasRef}
        className="w-full h-full"
      />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
        <div className="text-green-400 text-3xl font-bold">
          {Math.round(currentFrequency)} Hz
        </div>
        <div className="text-gray-400">
          {detectionStatus}
        </div>
      </div>
    </div>
  );
}
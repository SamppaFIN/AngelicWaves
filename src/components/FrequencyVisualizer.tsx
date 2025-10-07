import React, { useRef, useEffect, useState } from 'react';
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
  const [discoLights, setDiscoLights] = useState<{x: number, y: number, size: number, delay: number}[]>([]);
  const [audioDetected, setAudioDetected] = useState(false);
  // Track displayed frequency for UI
  const [displayedFrequency, setDisplayedFrequency] = useState(currentFrequency);
  
  // Show detailed info about what's being rendered
  console.log(`🎯 DISPLAY: Frequency=${currentFrequency}Hz, Showing=${displayedFrequency}Hz, Status="${detectionStatus}"`);
  
  // Debug rounds if showing recording loop status
  if (detectionStatus.includes("Recording Loop")) {
    const roundMatch = detectionStatus.match(/Round (\d+)\/(\d+)/);
    if (roundMatch) {
      const currentRound = parseInt(roundMatch[1]);
      const totalRounds = parseInt(roundMatch[2]);
      console.log(`⭐⭐⭐ VISUALIZER SHOWING ROUND ${currentRound}/${totalRounds} ⭐⭐⭐`);
    }
  }
  
  // Set audio detected state when we have a frequency and update displayed frequency
  useEffect(() => {
    // Important: Log every frequency change to track issues
    console.log(`🎯 FrequencyVisualizer RECEIVED NEW FREQUENCY: ${currentFrequency}Hz (prev displayed: ${displayedFrequency}Hz)`);
    
    // Use requestAnimationFrame to ensure UI updates reliably
    requestAnimationFrame(() => {
      // Always update the displayed frequency immediately
      setDisplayedFrequency(prevFreq => {
        if (prevFreq !== currentFrequency) {
          console.log(`🎯 UPDATING DISPLAY from ${prevFreq}Hz to ${currentFrequency}Hz`);
        }
        return currentFrequency;
      });
    });
    
    if (currentFrequency > 0) {
      setAudioDetected(true);
      // Reset the audio detected indicator after a short delay
      const timer = setTimeout(() => {
        setAudioDetected(false);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [currentFrequency]);

  // Generate disco light positions when an angelic frequency is detected
  useEffect(() => {
    if (hasAngelicFrequency) {
      // Create 15 random disco lights
      const newLights = Array.from({ length: 15 }, () => ({
        x: Math.random() * 100, // percentage position
        y: Math.random() * 100,
        size: 20 + Math.random() * 60, // size in pixels
        delay: Math.random() * 0.5 // animation delay
      }));
      setDiscoLights(newLights);
    } else {
      setDiscoLights([]);
    }
  }, [hasAngelicFrequency]);

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

      // IMPORTANT: Use the local state for rendering
      if (displayedFrequency > 0) {
        // Draw Tesla-style frequency circles for each angelic frequency
        angelicFrequencies.forEach((freq, index) => {
          const isActive = Math.abs(displayedFrequency - freq.frequency) < 15; // Increased tolerance
          const color = isActive ? 
            `hsla(${140}, 80%, 60%, ${0.7 + Math.sin(phase) * 0.3})` : 
            'rgba(74, 222, 128, 0.2)';

          drawTeslaPattern(ctx, width/2, height/2, 100 + index * 20, phase, color, 6 + index);
        });
      } else {
        // Draw pentagram when no frequency detected
        drawPentagram(ctx, width/2, height/2, Math.min(width, height) * 0.4, phase);
      }

      // Update phase for animation
      phase += hasAngelicFrequency ? 0.04 : 0.02; // Faster animation when angelic frequency detected
      animationFrameId = requestAnimationFrame(draw);
    };

    draw();

    return () => cancelAnimationFrame(animationFrameId);
  }, [isActive, displayedFrequency, currentFrequency, hasAngelicFrequency]);

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
      {/* Audio detected indicator - pulses when sound is detected */}
      {isActive && (
        <div 
          className={`absolute inset-0 rounded-full 
                     ${displayedFrequency > 0 ? 'border-4 border-green-500 animate-ping opacity-75' : 
                       audioDetected ? 'border-2 border-green-400 animate-pulse opacity-50' : 'border border-green-300 opacity-25'}`}
        />
      )}
      
      {/* Disco ball effect overlay when angelic frequency is detected */}
      {hasAngelicFrequency && (
        <>
          <div className="disco-ball-effect" />
          {discoLights.map((light, index) => (
            <div 
              key={index}
              className="disco-light"
              style={{
                left: `${light.x}%`,
                top: `${light.y}%`,
                width: `${light.size}px`,
                height: `${light.size}px`,
                opacity: 0.6 + Math.random() * 0.4,
                animationDelay: `${light.delay}s`
              }}
            />
          ))}
        </>
      )}
      
      <canvas
        ref={canvasRef}
        className="w-full h-full"
      />
      
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center z-10">
        <div className={`text-3xl font-bold ${hasAngelicFrequency ? 'text-white animate-pulse' : 'text-green-400'}`}>
          {Math.round(displayedFrequency)} Hz
        </div>
        <div className={`${hasAngelicFrequency ? 'text-green-200' : 'text-gray-400'}`}>
          {hasAngelicFrequency ? '✨ Angelic Frequency Detected ✨' : detectionStatus}
        </div>
        
        {/* Sound level indicator - shows when audio is being detected */}
        {isActive && !hasAngelicFrequency && displayedFrequency > 0 && (
          <div className="mt-2 flex justify-center items-center">
            <div className="flex gap-1">
              <div className="h-2 w-1 bg-green-500 animate-bounce" style={{ animationDelay: '0ms' }}></div>
              <div className="h-3 w-1 bg-green-500 animate-bounce" style={{ animationDelay: '100ms' }}></div>
              <div className="h-4 w-1 bg-green-500 animate-bounce" style={{ animationDelay: '200ms' }}></div>
              <div className="h-5 w-1 bg-green-500 animate-bounce" style={{ animationDelay: '300ms' }}></div>
              <div className="h-4 w-1 bg-green-500 animate-bounce" style={{ animationDelay: '400ms' }}></div>
              <div className="h-3 w-1 bg-green-500 animate-bounce" style={{ animationDelay: '500ms' }}></div>
              <div className="h-2 w-1 bg-green-500 animate-bounce" style={{ animationDelay: '600ms' }}></div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
import { motion, AnimatePresence } from "framer-motion";
import { useRef, useEffect } from "react";
import { calculateFrequencyIndicatorPosition } from "@/lib/frequencyAnalysis";

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
  
  // Draw wave animation
  useEffect(() => {
    if (!isActive || !canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    let animationFrameId: number;
    let phase = 0;
    
    const draw = () => {
      // Set canvas dimensions to match container
      const { width, height } = canvas.getBoundingClientRect();
      canvas.width = width;
      canvas.height = height;
      
      // Clear canvas
      ctx.clearRect(0, 0, width, height);
      
      // Draw wave
      ctx.beginPath();
      ctx.strokeStyle = 'rgba(74, 222, 128, 0.5)';
      ctx.lineWidth = 2;
      
      const amplitude = hasAngelicFrequency ? 20 : 10;
      const frequency = hasAngelicFrequency ? 0.05 : 0.02;
      
      for (let x = 0; x < width; x++) {
        const y = height / 2 + Math.sin(x * frequency + phase) * amplitude;
        if (x === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      
      ctx.stroke();
      
      // Update phase for animation
      phase += 0.05;
      animationFrameId = requestAnimationFrame(draw);
    };
    
    draw();
    
    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [isActive, hasAngelicFrequency]);
  
  const indicatorPosition = calculateFrequencyIndicatorPosition(
    currentFrequency, 
    minFrequency, 
    maxFrequency
  );

  return (
    <div className="flex flex-col items-center justify-center py-8">
      <div className={`relative w-[220px] h-[220px] rounded-full bg-green-500/5 flex items-center justify-center overflow-hidden mb-5`}>
        <AnimatePresence>
          {isActive && (
            <>
              <motion.div 
                className="absolute w-full h-full rounded-full bg-green-500/10"
                initial={{ opacity: 0 }}
                animate={{ 
                  opacity: hasAngelicFrequency ? 0.7 : 0.3,
                  scale: hasAngelicFrequency ? [0.8, 1.1, 0.9, 1.05] : [0.95, 1.05]
                }}
                exit={{ opacity: 0 }}
                transition={{ 
                  opacity: { duration: 0.3 },
                  scale: { 
                    duration: hasAngelicFrequency ? 2 : 4, 
                    repeat: Infinity,
                    repeatType: "reverse" 
                  }
                }}
                style={{
                  filter: "blur(8px)",
                  background: "radial-gradient(circle, rgba(74, 222, 128, 0.4) 0%, rgba(74, 222, 128, 0) 70%)"
                }}
              />
              
              {hasAngelicFrequency && (
                <>
                  {/* Enhanced disco ball effect with multiple layers */}
                  <motion.div 
                    className="absolute w-full h-full"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1, rotate: 360 }}
                    exit={{ opacity: 0 }}
                    transition={{ rotate: { duration: 8, repeat: Infinity, ease: "linear" } }}
                    style={{
                      backgroundImage: `
                        radial-gradient(circle at 25% 25%, rgba(74, 222, 128, 0.8) 2%, transparent 2.5%),
                        radial-gradient(circle at 75% 35%, rgba(74, 222, 128, 0.8) 2%, transparent 2.5%),
                        radial-gradient(circle at 40% 60%, rgba(74, 222, 128, 0.8) 2%, transparent 2.5%),
                        radial-gradient(circle at 65% 75%, rgba(74, 222, 128, 0.8) 2%, transparent 2.5%),
                        radial-gradient(circle at 50% 50%, rgba(74, 222, 128, 0.8) 2%, transparent 2.5%),
                        radial-gradient(circle at 20% 80%, rgba(74, 222, 128, 0.8) 2%, transparent 2.5%),
                        radial-gradient(circle at 80% 15%, rgba(74, 222, 128, 0.8) 2%, transparent 2.5%)
                      `
                    }}
                  />
                  
                  {/* Second layer with different rotation for enhanced effect */}
                  <motion.div 
                    className="absolute w-full h-full"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 0.7, rotate: -360 }}
                    exit={{ opacity: 0 }}
                    transition={{ rotate: { duration: 12, repeat: Infinity, ease: "linear" } }}
                    style={{
                      backgroundImage: `
                        radial-gradient(circle at 15% 15%, rgba(74, 222, 128, 0.6) 1%, transparent 1.5%),
                        radial-gradient(circle at 85% 85%, rgba(74, 222, 128, 0.6) 1%, transparent 1.5%),
                        radial-gradient(circle at 30% 70%, rgba(74, 222, 128, 0.6) 1%, transparent 1.5%),
                        radial-gradient(circle at 70% 30%, rgba(74, 222, 128, 0.6) 1%, transparent 1.5%),
                        radial-gradient(circle at 60% 85%, rgba(74, 222, 128, 0.6) 1%, transparent 1.5%),
                        radial-gradient(circle at 85% 40%, rgba(74, 222, 128, 0.6) 1%, transparent 1.5%)
                      `
                    }}
                  />
                  
                  {/* Third layer with smaller, faster light dots */}
                  <motion.div 
                    className="absolute w-full h-full"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 0.9, rotate: 180 }}
                    exit={{ opacity: 0 }}
                    transition={{ rotate: { duration: 5, repeat: Infinity, ease: "linear" } }}
                    style={{
                      backgroundImage: `
                        radial-gradient(circle at 45% 45%, rgba(255, 255, 255, 0.9) 0.5%, transparent 0.7%),
                        radial-gradient(circle at 55% 55%, rgba(255, 255, 255, 0.9) 0.5%, transparent 0.7%),
                        radial-gradient(circle at 35% 65%, rgba(255, 255, 255, 0.9) 0.5%, transparent 0.7%),
                        radial-gradient(circle at 65% 35%, rgba(255, 255, 255, 0.9) 0.5%, transparent 0.7%),
                        radial-gradient(circle at 25% 25%, rgba(255, 255, 255, 0.9) 0.5%, transparent 0.7%),
                        radial-gradient(circle at 75% 75%, rgba(255, 255, 255, 0.9) 0.5%, transparent 0.7%),
                        radial-gradient(circle at 85% 15%, rgba(255, 255, 255, 0.9) 0.5%, transparent 0.7%),
                        radial-gradient(circle at 15% 85%, rgba(255, 255, 255, 0.9) 0.5%, transparent 0.7%)
                      `
                    }}
                  />
                  
                  {/* Central glow effect */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <motion.div 
                      className="w-16 h-16 rounded-full"
                      initial={{ opacity: 0 }}
                      animate={{ 
                        opacity: [0.4, 0.7, 0.4],
                        scale: [0.8, 1.1, 0.8]
                      }}
                      transition={{ 
                        duration: 3,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                      style={{
                        background: "radial-gradient(circle, rgba(74, 222, 128, 0.8) 0%, rgba(74, 222, 128, 0) 70%)",
                        boxShadow: "0 0 20px 5px rgba(74, 222, 128, 0.3)",
                        filter: "blur(5px)"
                      }}
                    />
                  </div>
                  
                  {/* Light rays emanating from center */}
                  <div className="absolute inset-0 overflow-hidden">
                    {[...Array(12)].map((_, i) => (
                      <motion.div
                        key={`ray-${i}`}
                        className="absolute top-1/2 left-1/2 origin-left h-0.5 bg-gradient-to-r from-green-400 to-transparent"
                        style={{ 
                          width: '50%',
                          transform: `rotate(${i * 30}deg)`,
                          opacity: 0.3
                        }}
                        animate={{
                          opacity: [0.1, 0.4, 0.1],
                          scaleX: [0.7, 1.3, 0.7]
                        }}
                        transition={{
                          duration: 3 + i % 3,
                          repeat: Infinity,
                          delay: i * 0.2
                        }}
                      />
                    ))}
                  </div>
                  
                  {/* Pulsing overlay for angelic frequency */}
                  <motion.div
                    className="absolute w-full h-full rounded-full"
                    initial={{ opacity: 0 }}
                    animate={{ 
                      opacity: [0.1, 0.4, 0.1],
                      scale: [0.9, 1.1, 0.9]
                    }}
                    transition={{ 
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                    style={{
                      background: "radial-gradient(circle, rgba(74, 222, 128, 0.4) 0%, rgba(74, 222, 128, 0) 70%)",
                      filter: "blur(5px)"
                    }}
                  />
                </>
              )}
              
              <canvas 
                ref={canvasRef} 
                className="absolute w-full h-full"
              />
            </>
          )}
        </AnimatePresence>
        
        <div className="relative z-10 flex flex-col items-center justify-center">
          <div className="text-sm text-gray-400 mb-1">Currently Detecting</div>
          <div className={`text-3xl font-bold ${currentFrequency > 0 ? "text-green-400" : "text-gray-300"}`}>
            {currentFrequency > 0 ? `${currentFrequency} Hz` : "0 Hz"}
          </div>
          <div className="text-xs text-gray-400 mt-2">{detectionStatus}</div>
        </div>
      </div>
      
      <div className="w-full max-w-md mt-5">
        <div className="text-sm text-gray-400 flex justify-between mb-1">
          <span>{minFrequency} Hz</span>
          <span>{Math.round((minFrequency + maxFrequency) / 2)} Hz</span>
          <span>{maxFrequency} Hz</span>
        </div>
        <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
          <motion.div 
            className="h-full bg-green-400 rounded-full"
            initial={{ width: "0%" }}
            animate={{ width: `${indicatorPosition}%` }}
            transition={{ duration: 0.2 }}
          />
        </div>
        <div className="text-sm text-gray-400 mt-1">
          <span>Frequency range: {minFrequency}Hz - {maxFrequency}Hz</span>
        </div>
      </div>
    </div>
  );
}

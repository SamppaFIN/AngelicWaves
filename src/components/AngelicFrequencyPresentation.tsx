import { useState, useEffect, useRef } from "react";
import { angelicFrequencies } from "@/lib/frequencyAnalysis";
import { DetectedFrequency } from "@/lib/schema";
import { motion, AnimatePresence } from "framer-motion";

interface AngelicFrequencyPresentationProps {
  currentFrequency: number;
  isActive: boolean;
  detectedFrequencies: DetectedFrequency[];
}

export function AngelicFrequencyPresentation({
  currentFrequency,
  isActive,
  detectedFrequencies
}: AngelicFrequencyPresentationProps) {
  const [highlights, setHighlights] = useState<Record<number, number>>({});
  const [recentlyDetected, setRecentlyDetected] = useState<number[]>([]);
  const lastFrequencyRef = useRef<number>(0);
  
  // Monitor for angelic frequencies
  useEffect(() => {
    if (!isActive) {
      setHighlights({});
      setRecentlyDetected([]);
      return;
    }
    
    // Check if current frequency is close to any angelic frequency
    const newHighlights = { ...highlights };
    
    angelicFrequencies.forEach(({ frequency }) => {
      const distance = Math.abs(currentFrequency - frequency);
      
      // If we're within 5Hz of an angelic frequency, highlight it
      if (distance <= 5) {
        // Increase highlight level
        newHighlights[frequency] = Math.min(100, (newHighlights[frequency] || 0) + 5);
        
        // If this is a new detection, add to recently detected
        if (!recentlyDetected.includes(frequency) && currentFrequency !== lastFrequencyRef.current) {
          setRecentlyDetected(prev => [...prev.slice(-4), frequency]);
        }
      } else {
        // Decrease highlight level
        if (newHighlights[frequency]) {
          newHighlights[frequency] = Math.max(0, newHighlights[frequency] - 2);
          
          // Remove if it fades out completely
          if (newHighlights[frequency] === 0) {
            delete newHighlights[frequency];
          }
        }
      }
    });
    
    lastFrequencyRef.current = currentFrequency;
    setHighlights(newHighlights);
  }, [currentFrequency, isActive]);
  
  // Get list of detected angelic frequencies from recent detections
  const recentAngelicFrequencies = detectedFrequencies
    .filter(f => angelicFrequencies.some(af => Math.abs(af.frequency - f.frequency) <= 5))
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, 5);
  
  // If no active frequencies, but we have detected frequencies, show those
  const hasActiveHighlights = Object.keys(highlights).length > 0;
  
  return (
    <div className="bg-gray-800/70 p-4 rounded-lg mb-6 overflow-hidden">
      <h3 className="text-green-400 font-medium mb-4 flex justify-between items-center">
        <span>Angelic Frequency Presentation</span>
        {hasActiveHighlights && (
          <span className="text-sm text-purple-300 animate-pulse">
            Angelic Energy Detected!
          </span>
        )}
      </h3>
      
      {/* Active frequency visualization */}
      <div className="relative h-40 bg-black/50 rounded-lg mb-4 overflow-hidden flex">
        {/* Base aura background */}
        <div 
          className={`absolute inset-0 bg-blue-900/10 transition-opacity duration-1000 ${
            hasActiveHighlights ? 'opacity-100' : 'opacity-0'
          }`}
        />
        
        {/* Highlight zones for each angelic frequency */}
        {Object.entries(highlights).map(([freq, level]) => {
          const frequency = parseInt(freq);
          const angelicFreq = angelicFrequencies.find(af => af.frequency === frequency);
          
          if (!angelicFreq) return null;
          
          // Calculate position based on frequency value relative to range
          const position = Math.max(0, Math.min(100, (
            (frequency - 400) / (1000 - 400) * 100
          )));
          
          return (
            <div 
              key={frequency}
              className="absolute top-0 bottom-0 flex items-center justify-center"
              style={{
                left: `${position}%`,
                width: '80px',
                marginLeft: '-40px',
                zIndex: level
              }}
            >
              {/* Outer glow */}
              <div 
                className="absolute rounded-full animate-pulse"
                style={{
                  background: `radial-gradient(circle, rgba(139, 92, 246, ${level/100}) 0%, rgba(16, 24, 39, 0) 70%)`,
                  width: `${120 + level}px`,
                  height: `${120 + level}px`,
                  opacity: level / 100,
                  animation: `pulse ${2 - level/200}s cubic-bezier(0.4, 0, 0.6, 1) infinite`,
                  filter: `blur(${8 + level/10}px)`
                }}
              />
              
              {/* Inner glow */}
              <div 
                className="absolute rounded-full animate-ping"
                style={{
                  background: `radial-gradient(circle, rgba(167, 139, 250, ${level/100}) 0%, rgba(16, 24, 39, 0) 70%)`,
                  width: `${60 + level/2}px`,
                  height: `${60 + level/2}px`,
                  animation: `ping ${1 - level/400}s cubic-bezier(0, 0, 0.2, 1) infinite`,
                  filter: `blur(${4 + level/20}px)`
                }}
              />
              
              {/* Core */}
              <div className="z-10 text-center">
                <div 
                  className="font-semibold text-xl mb-1 backdrop-blur-sm p-1 rounded"
                  style={{
                    color: `rgba(216, 180, 254, ${Math.min(1, level/50)})`,
                    textShadow: `0 0 ${5 + level/10}px rgba(168, 85, 247, ${level/100})`,
                  }}
                >
                  {frequency} Hz
                </div>
                <div 
                  className="text-xs px-2 backdrop-blur-sm rounded"
                  style={{
                    color: `rgba(196, 181, 253, ${Math.min(1, level/70)})`,
                    textShadow: `0 0 ${3 + level/20}px rgba(139, 92, 246, ${level/100})`,
                  }}
                >
                  {angelicFreq.description}
                </div>
              </div>
            </div>
          );
        })}
        
        {/* Particle effects when angelic frequencies are active */}
        {hasActiveHighlights && (
          <div className="absolute inset-0 overflow-hidden">
            {Array.from({ length: 20 }).map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-1 h-1 rounded-full bg-purple-300/50"
                initial={{ 
                  x: Math.random() * 100 + '%', 
                  y: '100%', 
                  opacity: 0.2 + Math.random() * 0.5 
                }}
                animate={{ 
                  y: '0%', 
                  opacity: 0 
                }}
                transition={{
                  duration: 2 + Math.random() * 3,
                  repeat: Infinity,
                  delay: Math.random() * 5,
                  ease: "easeOut"
                }}
                style={{
                  filter: `blur(${1 + Math.random() * 2}px)`
                }}
              />
            ))}
          </div>
        )}
        
        {/* No active frequencies message */}
        {!hasActiveHighlights && recentAngelicFrequencies.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-gray-400 text-center">
              <div className="text-sm">No angelic frequencies detected yet</div>
              <div className="text-xs mt-2">Frequencies will appear here when detected</div>
            </div>
          </div>
        )}
      </div>
      
      {/* Recently detected angelic frequencies */}
      <div className="space-y-2">
        <div className="text-sm text-gray-300 font-medium">Recently Detected Frequencies:</div>
        
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          <AnimatePresence>
            {recentAngelicFrequencies.map((detected) => {
              const angelicFreq = angelicFrequencies.find(af => 
                Math.abs(af.frequency - detected.frequency) <= 5
              );
              
              if (!angelicFreq) return null;
              
              return (
                <motion.div
                  key={`${detected.timestamp}-${detected.frequency}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="bg-gray-900/80 border border-purple-900/50 rounded-md p-2 relative overflow-hidden"
                >
                  <div className="absolute inset-0 bg-purple-900/20 rounded-md filter blur-md" />
                  <div className="relative z-10">
                    <div className="flex justify-between">
                      <div className="font-medium text-purple-300">{angelicFreq.frequency} Hz</div>
                      <div className="text-xs text-gray-400">
                        {new Date(detected.timestamp).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                    </div>
                    <div className="text-xs text-gray-300 mt-1">{angelicFreq.description}</div>
                    <div className="text-xs text-gray-400 mt-1">
                      Duration: {detected.duration.toFixed(1)}s
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
          
          {recentAngelicFrequencies.length === 0 && hasActiveHighlights === false && (
            <div className="text-sm text-gray-400 col-span-3">
              No angelic frequencies have been detected yet.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
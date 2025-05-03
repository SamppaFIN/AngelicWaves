import { useState, useEffect, useRef } from "react";
import { Progress } from "@/components/ui/progress";
import { angelicFrequencies } from "@/lib/frequencyAnalysis";

interface FrequencyMeterPanelProps {
  currentFrequency: number;
  isActive: boolean;
}

export function FrequencyMeterPanel({ currentFrequency, isActive }: FrequencyMeterPanelProps) {
  // Track frequency proximity as percentage values (0-100) for each angelic frequency
  const [frequencyLevels, setFrequencyLevels] = useState<Record<number, number>>({});
  // Track peak levels to show "resonance memory"
  const [peakLevels, setPeakLevels] = useState<Record<number, number>>({});
  // Display frequency (for UI only, smoothed update)
  const [displayFrequency, setDisplayFrequency] = useState(currentFrequency);
  
  // Keep track of previous frequency for debugging
  const prevFrequencyRef = useRef<number>(0);
  
  // Update frequency levels based on proximity to current frequency
  useEffect(() => {
    console.log(`📊 FrequencyMeterPanel: Received frequency update ${currentFrequency}Hz (prev: ${prevFrequencyRef.current}Hz)`);
    prevFrequencyRef.current = currentFrequency;
    
    // Always update the display frequency to match current
    setDisplayFrequency(currentFrequency);
    
    if (!isActive || currentFrequency === 0) {
      // Keep peak levels but set current levels to zero when inactive
      const resetLevels = Object.fromEntries(
        angelicFrequencies.map(f => [f.frequency, 0])
      );
      setFrequencyLevels(resetLevels);
      return;
    }
    
    // Calculate proximity for each angelic frequency
    const newLevels: Record<number, number> = {};
    const newPeakLevels = { ...peakLevels };
    
    angelicFrequencies.forEach(angelicFreq => {
      const freq = angelicFreq.frequency;
      // Calculate how close the current frequency is to this angelic frequency
      const distance = Math.abs(currentFrequency - freq);
      
      // Calculate level (0-100) based on distance with enhanced sensitivity
      // The closer to the angelic frequency, the higher the level
      // We consider frequencies within 15Hz to be close enough for full signal for better visualization
      let level = 0;
      
      if (distance <= 15) {
        // Create a smooth curve from 0-100% as we get closer
        // Using a quadratic curve for more dramatic effect near the target frequency
        const normalizedDistance = distance / 15;
        level = 100 - (normalizedDistance * normalizedDistance) * 100;
      }
      
      // Ensure level is between 0-100 and round to integer
      level = Math.max(0, Math.min(100, Math.round(level)));
      
      // Apply some smoothing to prevent abrupt changes (weight previous value at 30%)
      if (frequencyLevels[freq] !== undefined) {
        level = Math.round(frequencyLevels[freq] * 0.3 + level * 0.7);
      }
      
      // Update the peak level if current level is higher
      if (!newPeakLevels[freq] || level > newPeakLevels[freq]) {
        newPeakLevels[freq] = level;
      } else if (newPeakLevels[freq] > 0) {
        // Slowly decrease peak levels over time (memory fade effect)
        newPeakLevels[freq] = Math.max(0, newPeakLevels[freq] - 0.1);
      }
      
      newLevels[freq] = level;
    });
    
    // Always set frequency levels with a fresh object to trigger updates
    setFrequencyLevels(newLevels);
    setPeakLevels(newPeakLevels);
    
  }, [currentFrequency, isActive]);
  
  return (
    <div className="bg-gray-800/70 p-4 rounded-lg mb-6">
      <h3 className="text-green-400 font-medium mb-3 flex items-center justify-between">
        <span>Frequency Proximity Meter</span>
        {isActive && <span className="text-xs text-green-300 bg-green-900/40 px-2 py-1 rounded">Active</span>}
      </h3>
      
      <div className="space-y-3">
        {angelicFrequencies.map(({ frequency, description }) => {
          const level = frequencyLevels[frequency] || 0;
          const peak = peakLevels[frequency] || 0;
          const isPerfectMatch = level >= 95;
          
          return (
            <div key={frequency} className="space-y-1">
              <div className="flex justify-between text-sm">
                <div className={`font-medium ${isPerfectMatch ? 'text-green-300 font-bold' : 'text-purple-300'}`}>
                  {frequency} Hz
                  {isPerfectMatch && ' ✧'}
                </div>
                <div className={`text-xs ${isPerfectMatch ? 'text-green-300' : 'text-gray-400'}`}>
                  {level.toFixed(0)}% {peak > level && peak > 50 ? `(Peak: ${Math.round(peak)}%)` : ''}
                </div>
              </div>
              <div className="relative flex items-center gap-2">
                {/* Peak marker line */}
                {peak > level && peak > 20 && (
                  <div 
                    className="absolute h-2 w-0.5 bg-green-400/60 z-10"
                    style={{ 
                      left: `${peak}%`, 
                      opacity: peak / 100 
                    }}
                  ></div>
                )}
                
                {/* Main progress bar */}
                <Progress 
                  key={`prog-${frequency}-${level}`}
                  value={level} 
                  className={`h-2 transition-all duration-300 ${isPerfectMatch ? 'animate-pulse' : ''}`}
                  // Enhanced color changes based on level intensity
                  style={{ 
                    backgroundColor: 'rgba(75, 85, 99, 0.3)',
                    '--progress-background': `rgba(${Math.round(130 - level/2)}, ${Math.round(190 + level/5)}, ${Math.round(80 + level)}, ${0.7 + level/300})`
                  } as any}
                />
                <div className={`text-xs w-24 truncate ${isPerfectMatch ? 'text-green-300' : 'text-gray-400'}`}>
                  {description}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      
      <div className="mt-5 py-2 px-3 bg-gray-900/60 rounded-md border border-gray-700/50">
        <div className="flex justify-between text-sm">
          <div className="text-gray-400">Current:</div>
          <div className="font-medium text-green-400">{displayFrequency.toFixed(0)} Hz</div>
        </div>
      </div>
      
      <div className="mt-4 text-xs text-gray-400">
        This panel shows how close the current frequency is to each of the angelic frequencies.
        <br/>
        <span className="text-green-400/70">Green markers</span> show the highest resonance points detected.
      </div>
    </div>
  );
}
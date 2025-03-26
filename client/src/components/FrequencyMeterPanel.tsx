import { useState, useEffect } from "react";
import { Progress } from "@/components/ui/progress";
import { angelicFrequencies } from "@/lib/frequencyAnalysis";

interface FrequencyMeterPanelProps {
  currentFrequency: number;
  isActive: boolean;
}

export function FrequencyMeterPanel({ currentFrequency, isActive }: FrequencyMeterPanelProps) {
  // Track frequency proximity as percentage values (0-100) for each angelic frequency
  const [frequencyLevels, setFrequencyLevels] = useState<Record<number, number>>({});
  
  // Update frequency levels based on proximity to current frequency
  useEffect(() => {
    if (!isActive || currentFrequency === 0) {
      // Reset all levels when inactive
      const resetLevels = Object.fromEntries(
        angelicFrequencies.map(f => [f.frequency, 0])
      );
      setFrequencyLevels(resetLevels);
      return;
    }
    
    // Calculate proximity for each angelic frequency
    const newLevels = { ...frequencyLevels };
    
    angelicFrequencies.forEach(angelicFreq => {
      const freq = angelicFreq.frequency;
      // Calculate how close the current frequency is to this angelic frequency
      const distance = Math.abs(currentFrequency - freq);
      
      // Calculate level (0-100) based on distance
      // The closer to the angelic frequency, the higher the level
      // We consider frequencies within 20Hz to be close enough for full signal
      let level = 0;
      
      if (distance <= 20) {
        // Create a smooth curve from 0-100% as we get closer
        level = 100 - (distance / 20) * 100;
      }
      
      // Ensure level is between 0-100 and round to integer
      level = Math.max(0, Math.min(100, Math.round(level)));
      
      // Apply some smoothing to prevent abrupt changes (weight previous value at 30%)
      if (frequencyLevels[freq] !== undefined) {
        level = Math.round(frequencyLevels[freq] * 0.3 + level * 0.7);
      }
      
      newLevels[freq] = level;
    });
    
    setFrequencyLevels(newLevels);
  }, [currentFrequency, isActive]);
  
  return (
    <div className="bg-gray-800/70 p-4 rounded-lg mb-6">
      <h3 className="text-green-400 font-medium mb-3">Frequency Proximity Meter</h3>
      
      <div className="space-y-3">
        {angelicFrequencies.map(({ frequency, description }) => (
          <div key={frequency} className="space-y-1">
            <div className="flex justify-between text-sm">
              <div className="font-medium text-purple-300">{frequency} Hz</div>
              <div className="text-gray-400 text-xs">{frequencyLevels[frequency] || 0}%</div>
            </div>
            <div className="flex items-center gap-2">
              <Progress 
                value={frequencyLevels[frequency] || 0} 
                className="h-2"
                // Color changes based on level intensity
                style={{ 
                  backgroundColor: 'rgba(75, 85, 99, 0.3)',
                  '--progress-background': `rgba(${Math.round(130 - frequencyLevels[frequency]/2)}, ${Math.round(190 + frequencyLevels[frequency]/5)}, ${Math.round(80 + frequencyLevels[frequency])}, ${0.7 + frequencyLevels[frequency]/300})`
                } as any}
              />
              <div className="text-xs text-gray-400 w-20 truncate">{description}</div>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-4 text-xs text-gray-400">
        This panel shows how close the current frequency ({currentFrequency}Hz) is to each of the angelic frequencies.
      </div>
    </div>
  );
}
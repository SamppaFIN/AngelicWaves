import { Slider } from "@/components/ui/slider";
import { useState, useEffect } from "react";
import { isAngelicFrequency, getClosestAngelicFrequency, angelicFrequencies } from "@/lib/frequencyAnalysis";

interface DemoFrequencySliderProps {
  minFrequency: number;
  maxFrequency: number;
  demoFrequency: number;
  onDemoFrequencyChange: (frequency: number) => void;
  isDemoMode: boolean;
}

export function DemoFrequencySlider({
  minFrequency,
  maxFrequency,
  demoFrequency,
  onDemoFrequencyChange,
  isDemoMode
}: DemoFrequencySliderProps) {
  const [value, setValue] = useState([demoFrequency]);
  
  // Update slider when demoFrequency changes externally
  useEffect(() => {
    setValue([demoFrequency]);
  }, [demoFrequency]);
  
  // Find if current frequency is angelic
  const isAngelic = isAngelicFrequency(demoFrequency);
  
  // Find closest angelic frequency
  const closestAngelic = getClosestAngelicFrequency(demoFrequency);
  
  const handleValueChange = (newValue: number[]) => {
    setValue(newValue);
    onDemoFrequencyChange(newValue[0]);
  };
  
  return (
    <div className={`mb-5 p-4 rounded-lg transition-colors ${
      isDemoMode 
        ? 'bg-purple-900/30 border border-purple-700/50' 
        : 'bg-gray-800/70'
    }`}>
      <h3 className="text-green-400 font-medium mb-2 flex justify-between items-center">
        <span>Demo Frequency Control</span>
        <span className="text-sm font-normal text-gray-300">
          {value[0].toFixed(0)} Hz
          {isAngelic && (
            <span className="ml-1 text-purple-300">(Angelic)</span>
          )}
        </span>
      </h3>
      
      <div className="py-4">
        <Slider
          value={value}
          min={minFrequency}
          max={maxFrequency}
          step={1}
          onValueChange={handleValueChange}
          className={`${isDemoMode ? 'bg-purple-950' : ''}`}
        />
      </div>
      
      <div className="flex justify-between text-xs text-gray-400">
        <span>{minFrequency} Hz</span>
        <span>{maxFrequency} Hz</span>
      </div>
      
      {closestAngelic && !isAngelic && (
        <div className="mt-3 text-xs">
          <span className="text-gray-400">Closest angelic frequency: </span>
          <button 
            className="text-purple-400 hover:text-purple-300 font-medium"
            onClick={() => onDemoFrequencyChange(closestAngelic.frequency)}
          >
            {closestAngelic.frequency} Hz ({Math.abs(demoFrequency - closestAngelic.frequency)} Hz away)
          </button>
        </div>
      )}
      
      <div className="mt-2 flex flex-wrap gap-1">
        {angelicFrequencies.map(freq => (
          <button
            key={freq.frequency}
            onClick={() => onDemoFrequencyChange(freq.frequency)}
            className={`text-xs px-2 py-1 rounded-md transition-colors ${
              demoFrequency === freq.frequency
                ? 'bg-purple-600 text-white'
                : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
            }`}
          >
            {freq.frequency} Hz
          </button>
        ))}
      </div>
      
      <div className="mt-4 text-xs text-gray-400">
        <p>Slide to adjust the demo frequency or click one of the preset angelic frequencies above.</p>
        {!isDemoMode && (
          <p className="mt-1 text-amber-400">
            Note: Enable Demo Mode to see this frequency.
          </p>
        )}
      </div>
    </div>
  );
}
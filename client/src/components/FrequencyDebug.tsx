
import React from 'react';

interface FrequencyDebugProps {
  frequencies: Array<{frequency: number, amplitude: number}>;
  isVisible: boolean;
}

export function FrequencyDebug({ frequencies, isVisible }: FrequencyDebugProps) {
  if (!isVisible) return null;

  return (
    <div className="fixed bottom-4 right-4 bg-black/80 text-white p-4 rounded-lg max-h-60 overflow-y-auto">
      <h3 className="font-bold mb-2">Active Frequencies</h3>
      <div className="space-y-1">
        {frequencies.map(({ frequency, amplitude }, i) => (
          <div key={i} className="text-sm">
            {frequency.toFixed(1)} Hz ({amplitude.toFixed(1)} dB)
          </div>
        ))}
      </div>
    </div>
  );
}

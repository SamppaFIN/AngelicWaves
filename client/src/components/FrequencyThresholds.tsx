import { Slider } from "@/components/ui/slider";
import { useState } from "react";
import { FrequencySettings } from "@/lib/types";

interface FrequencyThresholdsProps {
  settings: FrequencySettings;
  onSettingsChange: (settings: FrequencySettings) => void;
}

export function FrequencyThresholds({ settings, onSettingsChange }: FrequencyThresholdsProps) {
  const handleMinFrequencyChange = (value: number[]) => {
    onSettingsChange({
      ...settings,
      minFrequency: value[0]
    });
  };

  const handleMaxFrequencyChange = (value: number[]) => {
    onSettingsChange({
      ...settings,
      maxFrequency: value[0]
    });
  };

  const handleSensitivityChange = (value: number[]) => {
    const sensValues: ['Low', 'Medium', 'High'] = ['Low', 'Medium', 'High'];
    onSettingsChange({
      ...settings,
      sensitivity: sensValues[value[0] - 1]
    });
  };

  return (
    <div className="bg-gray-800 rounded-lg p-4 mb-5">
      <h2 className="text-lg font-medium mb-3">Frequency Thresholds</h2>
      <div className="space-y-4">
        <div>
          <div className="flex justify-between mb-1">
            <label className="text-sm text-gray-300">Min Frequency</label>
            <span className="text-sm text-green-400">{settings.minFrequency} Hz</span>
          </div>
          <Slider
            defaultValue={[settings.minFrequency]}
            min={400}
            max={600}
            step={1}
            onValueChange={handleMinFrequencyChange}
            className="w-full"
          />
        </div>
        
        <div>
          <div className="flex justify-between mb-1">
            <label className="text-sm text-gray-300">Max Frequency</label>
            <span className="text-sm text-green-400">{settings.maxFrequency} Hz</span>
          </div>
          <Slider
            defaultValue={[settings.maxFrequency]}
            min={600}
            max={1000}
            step={1}
            onValueChange={handleMaxFrequencyChange}
            className="w-full"
          />
        </div>
        
        <div>
          <div className="flex justify-between mb-1">
            <label className="text-sm text-gray-300">Sensitivity</label>
            <span className="text-sm text-green-400">{settings.sensitivity}</span>
          </div>
          <Slider
            defaultValue={[settings.sensitivity === 'Low' ? 1 : settings.sensitivity === 'Medium' ? 2 : 3]}
            min={1}
            max={3}
            step={1}
            onValueChange={handleSensitivityChange}
            className="w-full"
          />
          <div className="flex justify-between mt-1 text-xs text-gray-400">
            <span>Low</span>
            <span>Medium</span>
            <span>High</span>
          </div>
        </div>
      </div>
    </div>
  );
}

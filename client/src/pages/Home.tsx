import { useState, useCallback } from "react";
import { FrequencyVisualizer } from "@/components/FrequencyVisualizer";
import { FrequencyThresholds } from "@/components/FrequencyThresholds";
import { AngelicFrequencies } from "@/components/AngelicFrequencies";
import { AnalysisPanel } from "@/components/AnalysisPanel";
import { MicrophonePermission } from "@/components/MicrophonePermission";
import { useAudioAnalyzer } from "@/hooks/useAudioAnalyzer";
import { Switch } from "@/components/ui/switch";
import { FrequencySettings, AnalysisReportData } from "@/lib/types";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function Home() {
  const [showPermissionModal, setShowPermissionModal] = useState(false);
  const [settings, setSettings] = useState<FrequencySettings>({
    minFrequency: 432,
    maxFrequency: 963,
    sensitivity: 'Medium'
  });
  
  const { toast } = useToast();
  
  const { 
    isActive,
    currentFrequency,
    detectionStatus,
    detectedFrequencies,
    hasAngelicFrequency,
    toggleDetector,
    resetDetectedFrequencies,
    microphoneAccess,
    requestMicrophoneAccess,
    isSimulationMode,
    toggleSimulationMode,
    isDemoMode,
    toggleDemoMode,
    showCalculationMethod,
    toggleCalculationMethod
  } = useAudioAnalyzer(settings);

  const handleToggleClick = useCallback(() => {
    if (!isActive && !microphoneAccess) {
      setShowPermissionModal(true);
    } else {
      toggleDetector();
    }
  }, [isActive, microphoneAccess, toggleDetector]);

  const handleAllowMicrophone = useCallback(async () => {
    const success = await requestMicrophoneAccess();
    setShowPermissionModal(false);
    
    if (success) {
      toggleDetector();
    } else {
      toast({
        title: "Microphone access denied",
        description: "This app requires microphone access to detect frequencies.",
        variant: "destructive"
      });
    }
  }, [requestMicrophoneAccess, toggleDetector, toast]);

  const handleCancelMicrophone = useCallback(() => {
    setShowPermissionModal(false);
  }, []);

  const handleSettingsChange = useCallback((newSettings: FrequencySettings) => {
    setSettings(newSettings);
  }, []);

  const handleSaveReport = async (report: AnalysisReportData) => {
    await apiRequest("POST", "/api/frequency-reports", report);
    resetDetectedFrequencies();
  };

  return (
    <div className="font-sans bg-gray-900 text-white min-h-screen pb-32">
      {/* Header */}
      <header className="fixed top-0 w-full bg-gray-800 shadow-md z-10">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <div>
            <h1 className="text-xl font-semibold flex items-center">
              <span className="text-green-400 mr-2">✧</span>
              Angelic Frequency Detector
            </h1>
            {isSimulationMode && (
              <div className="text-xs text-green-400/60 mt-1">Simulation Mode Enabled</div>
            )}
          </div>
          
          <div className="flex flex-col items-end gap-2">
            <div className="flex items-center">
              <span className="mr-3 text-sm text-gray-300">
                {isActive ? 'Active' : 'Inactive'}
              </span>
              <Switch
                checked={isActive}
                onCheckedChange={handleToggleClick}
              />
            </div>
            
            <div className="flex space-x-2">
              <button 
                onClick={toggleSimulationMode}
                className={`text-xs px-3 py-1 rounded-md transition-colors ${
                  isSimulationMode 
                    ? 'bg-green-600 hover:bg-green-700 text-white' 
                    : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                }`}
              >
                {isSimulationMode ? 'Using Simulation' : 'Use Simulation'}
              </button>
              
              {isActive && (
                <button 
                  onClick={toggleDemoMode}
                  className={`text-xs px-3 py-1 rounded-md transition-colors ${
                    isDemoMode 
                      ? 'bg-purple-600 hover:bg-purple-700 text-white' 
                      : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                  }`}
                >
                  {isDemoMode ? 'Exit Demo' : 'Show Angelic Frequency'}
                </button>
              )}
            </div>

            <div className="flex items-center mt-1">
              <button
                onClick={toggleCalculationMethod}
                className="text-xs underline text-gray-400 hover:text-gray-300"
              >
                {showCalculationMethod ? 'Hide Calculation Method' : 'Show Calculation Method'}
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 pt-20">
        <FrequencyVisualizer
          isActive={isActive}
          currentFrequency={currentFrequency}
          detectionStatus={detectionStatus}
          hasAngelicFrequency={hasAngelicFrequency}
          minFrequency={settings.minFrequency}
          maxFrequency={settings.maxFrequency}
        />
        
        {showCalculationMethod && (
          <div className="bg-gray-800/70 p-4 rounded-lg mb-6 text-sm">
            <h3 className="text-green-400 font-medium mb-2">How Frequencies Are Calculated</h3>
            <div className="space-y-2 text-gray-300">
              <p>The frequency detection uses a Fast Fourier Transform (FFT) algorithm to analyze audio signals:</p>
              <ol className="list-decimal pl-5 space-y-1">
                <li>Audio is sampled at ~44.1kHz through your microphone</li>
                <li>The signal is divided into frequency bins using FFT analysis</li>
                <li>We identify the dominant frequency bin with the highest amplitude</li>
                <li>The bin index is converted to Hz using the formula: <code className="px-1 bg-gray-700 rounded">frequency = (binIndex * sampleRate/2) / totalBins</code></li>
                <li>Noise filtering is applied based on your sensitivity setting ({settings.sensitivity})</li>
                <li>Frequencies are only displayed when they fall within your set range ({settings.minFrequency}Hz - {settings.maxFrequency}Hz)</li>
              </ol>
              {isSimulationMode && (
                <p className="text-amber-400 mt-2">Note: In simulation mode, frequencies are generated algorithmically rather than detected from audio input.</p>
              )}
              {isDemoMode && (
                <p className="text-purple-400 mt-2">Note: Demo mode is currently active, showing a specific angelic frequency (432Hz).</p>
              )}
            </div>
          </div>
        )}
        
        <FrequencyThresholds
          settings={settings}
          onSettingsChange={handleSettingsChange}
        />
        
        <AngelicFrequencies />
      </main>

      <AnalysisPanel
        detectedFrequencies={detectedFrequencies}
        onSaveReport={handleSaveReport}
      />

      <MicrophonePermission
        open={showPermissionModal}
        onAllow={handleAllowMicrophone}
        onCancel={handleCancelMicrophone}
      />
    </div>
  );
}

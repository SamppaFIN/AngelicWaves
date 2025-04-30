import { useState, useCallback } from "react";
import { FrequencyVisualizer } from "@/components/FrequencyVisualizer";
import { FrequencyThresholds } from "@/components/FrequencyThresholds";
import { AngelicFrequencies } from "@/components/AngelicFrequencies";
import { FrequencyHistory } from "@/components/FrequencyHistory";
import { AnalysisPanel } from "@/components/AnalysisPanel";
import { MicrophonePermission } from "@/components/MicrophonePermission";
import { FrequencyExplorerMascot } from "@/components/FrequencyExplorerMascot";
import { FrequencyPlayer } from "@/components/FrequencyPlayer";
import { FrequencyMeterPanel } from "@/components/FrequencyMeterPanel";
import { DemoFrequencySlider } from "@/components/DemoFrequencySlider";
import { AngelicFrequencyPresentation } from "@/components/AngelicFrequencyPresentation";
import { AIFrequencyAnalysis } from "@/components/AIFrequencyAnalysis";
import { AudioRecorder } from "@/components/AudioRecorder";
import { useAudioAnalyzer } from "@/hooks/useAudioAnalyzer";
import { isAngelicFrequency } from "@/lib/frequencyAnalysis";
import { Switch } from "@/components/ui/switch";
import { FrequencySettings, AnalysisReportData } from "@/lib/types";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { playActivationSound, playDeactivationSound } from "@/lib/soundEffects";
import { DetectedFrequency } from "@shared/schema";

export default function Home() {
  const [showPermissionModal, setShowPermissionModal] = useState(false);
  const [isPlayingSound, setIsPlayingSound] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [settings, setSettings] = useState<FrequencySettings>({
    minFrequency: 432,
    maxFrequency: 963,
    sensitivity: 'Medium'
  });
  
  const { toast } = useToast();
  
  // We'll manage detected frequencies manually to handle AudioRecorder component
  const [localDetectedFrequencies, setLocalDetectedFrequencies] = useState<DetectedFrequency[]>([]);
  
  const { 
    isActive,
    currentFrequency,
    detectionStatus,
    detectedFrequencies: hookDetectedFrequencies,
    hasAngelicFrequency,
    toggleDetector,
    resetDetectedFrequencies: hookResetDetectedFrequencies,
    microphoneAccess,
    requestMicrophoneAccess,
    isSimulationMode,
    toggleSimulationMode,
    isDemoMode,
    toggleDemoMode,
    showCalculationMethod,
    toggleCalculationMethod,
    demoFrequency,
    setDemoFrequency,
    // New simulation function for debugging
    simulateAudioAnalysis,
    // Add the new frequency spectrum analysis properties
    frequencySpectrum,
    dominantFrequencies
  } = useAudioAnalyzer(settings);
  
  // Combine frequencies from the hook and our local state
  const detectedFrequencies = [...hookDetectedFrequencies, ...localDetectedFrequencies];
  
  // Create a reset function that resets both
  const resetDetectedFrequencies = useCallback(() => {
    hookResetDetectedFrequencies();
    setLocalDetectedFrequencies([]);
  }, [hookResetDetectedFrequencies]);

  const handleToggleClick = useCallback(() => {
    if (!isActive && !microphoneAccess) {
      setShowPermissionModal(true);
    } else {
      // Play the appropriate sound effect based on the new state
      if (isActive) {
        playDeactivationSound();
      } else {
        playActivationSound();
      }
      toggleDetector();
    }
  }, [isActive, microphoneAccess, toggleDetector]);

  const handleAllowMicrophone = useCallback(async () => {
    const success = await requestMicrophoneAccess();
    setShowPermissionModal(false);
    
    if (success) {
      playActivationSound();
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
    await apiRequest("/api/frequency-reports", {
      method: "POST",
      body: JSON.stringify(report)
    });
    resetDetectedFrequencies();
  };
  
  // Handler for when AI generates insights
  const [aiInsight, setAiInsight] = useState<string | null>(null);
  const handleAiInsightGenerated = useCallback((insight: string) => {
    setAiInsight(insight);
  }, []);
  
  const handleFrequencyPlay = useCallback((frequency: number) => {
    // This function is called when a frequency is played
    console.log(`Playing frequency: ${frequency}Hz`);
  }, []);
  
  const handlePlayingStateChange = useCallback((isPlaying: boolean) => {
    setIsPlayingSound(isPlaying);
  }, []);

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
                  onClick={() => {
                    toggleDemoMode();
                  }}
                  className={`text-xs px-3 py-1 rounded-md transition-colors ${
                    isDemoMode 
                      ? 'bg-purple-600 hover:bg-purple-700 text-white' 
                      : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                  }`}
                >
                  {isDemoMode ? 'Exit Demo' : 'Start Demo Mode'}
                </button>
              )}
            </div>

            <div className="flex items-center mt-1 space-x-4">
              <button
                onClick={toggleCalculationMethod}
                className="text-xs underline text-gray-400 hover:text-gray-300"
              >
                {showCalculationMethod ? 'Hide Calculation Method' : 'Show Calculation Method'}
              </button>
              
              <button
                onClick={() => setShowHistory(prev => !prev)}
                className="text-xs underline text-purple-400 hover:text-purple-300"
              >
                {showHistory ? 'Hide History & References' : 'Show History & References'}
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 pt-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2">
            <FrequencyVisualizer
              isActive={isActive}
              currentFrequency={currentFrequency}
              detectionStatus={detectionStatus}
              hasAngelicFrequency={hasAngelicFrequency}
              minFrequency={settings.minFrequency}
              maxFrequency={settings.maxFrequency}
            />
          </div>
          <div>
            <FrequencyMeterPanel
              currentFrequency={currentFrequency}
              isActive={isActive}
            />
          </div>
        </div>
        
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
                <p className="text-purple-400 mt-2">
                  Note: Demo mode is currently active, showing frequency at {demoFrequency}Hz
                  {isAngelicFrequency(demoFrequency) && " (Angelic Frequency)"}.
                </p>
              )}
            </div>
          </div>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <FrequencyThresholds
            settings={settings}
            onSettingsChange={handleSettingsChange}
          />
          
          {isDemoMode ? (
            <DemoFrequencySlider
              minFrequency={settings.minFrequency}
              maxFrequency={settings.maxFrequency}
              demoFrequency={demoFrequency}
              onDemoFrequencyChange={setDemoFrequency}
              isDemoMode={isDemoMode}
            />
          ) : (
            <div className="bg-gray-800/70 border border-gray-700 rounded-lg p-6">
              <h3 className="text-lg font-medium text-green-400 mb-4">Audio Frequency Recorder</h3>
              <p className="text-sm text-gray-300 mb-4">
                Record a short audio sample to analyze dominant frequencies.
                This works more reliably than continuous analysis on mobile devices.
              </p>
              <AudioRecorder 
                onFrequencyDetected={(freq) => {
                  // Add the detected frequency to our local state
                  setLocalDetectedFrequencies(prev => [...prev, freq]);
                  
                  // If it's an angelic frequency, show a toast notification
                  if (isAngelicFrequency(freq.frequency)) {
                    toast({
                      title: "Angelic Frequency Detected!",
                      description: `Detected ${freq.frequency}Hz - This is an angelic frequency!`,
                      variant: "success",
                    });
                  } else {
                    toast({
                      title: "Frequency Detected",
                      description: `Detected ${freq.frequency}Hz`,
                    });
                  }
                  
                  console.log(`AudioRecorder detected frequency: ${freq.frequency}Hz`);
                }}
                minFrequency={settings.minFrequency}
                maxFrequency={settings.maxFrequency}
                sensitivity={settings.sensitivity}
              />
            </div>
          )}
        </div>

        <FrequencyPlayer
          onFrequencyPlay={handleFrequencyPlay}
          onPlayingStateChange={handlePlayingStateChange}
        />
        
        <AngelicFrequencyPresentation
          currentFrequency={currentFrequency}
          isActive={isActive}
          detectedFrequencies={detectedFrequencies}
        />
        
        <AngelicFrequencies />
        
        {showHistory && <FrequencyHistory />}
        
        <div className="mt-10 mb-6">
          <h2 className="text-2xl font-bold text-green-400 mb-4">AI-Powered Frequency Analysis</h2>
          <AIFrequencyAnalysis 
            detectedFrequencies={detectedFrequencies}
            dominantFrequencies={dominantFrequencies}
            onAiInsightGenerated={handleAiInsightGenerated}
          />
        </div>
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
      
      {/* Frequency Explorer Mascot */}
      <FrequencyExplorerMascot
        isActive={isActive}
        hasAngelicFrequency={hasAngelicFrequency}
        currentFrequency={currentFrequency}
        isDemoMode={isDemoMode}
        isPlayingSound={isPlayingSound}
      />
    </div>
  );
}

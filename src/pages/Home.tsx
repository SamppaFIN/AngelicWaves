import { useState, useCallback, useEffect, useRef } from "react";
import { FrequencyVisualizer } from "@/components/FrequencyVisualizer";
import { FrequencyThresholds } from "@/components/FrequencyThresholds";
import { AngelicFrequencies } from "@/components/AngelicFrequencies";
import { FrequencyHistory } from "@/components/FrequencyHistory";
import { MicrophonePermission } from "@/components/MicrophonePermission";
import { FrequencyExplorerMascot } from "@/components/FrequencyExplorerMascot";
import { EchoEffect } from "@/components/EchoEffect";
import { FrequencyPlayer } from "@/components/FrequencyPlayer";
import { FrequencyMeterPanel } from "@/components/FrequencyMeterPanel";
import { DemoFrequencySlider } from "@/components/DemoFrequencySlider";
import { useAudioAnalyzer } from "@/hooks/useAudioAnalyzer";
import { isAngelicFrequency } from "@/lib/frequencyAnalysis";
import { Switch } from "@/components/ui/switch";
import { FrequencySettings } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { playActivationSound, playDeactivationSound } from "@/lib/soundEffects";
import { DetectedFrequency } from "@/lib/schema";

export default function Home() {
  const [showPermissionModal, setShowPermissionModal] = useState(false);
  const [isPlayingSound, setIsPlayingSound] = useState(false);
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
    dominantFrequencies,
    // Recording loop information 
    isRecordingLoop,
    currentIteration,
    iterationResults,
    MAX_ITERATIONS
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

  // Simplified frequency handling
  const handleResetFrequencies = useCallback(() => {
    resetDetectedFrequencies();
  }, [resetDetectedFrequencies]);
  
  const handleFrequencyPlay = useCallback((frequency: number) => {
    // This function is called when a frequency is played
    console.log(`Playing frequency: ${frequency}Hz`);
  }, []);
  
  const handlePlayingStateChange = useCallback((isPlaying: boolean) => {
    setIsPlayingSound(isPlaying);
  }, []);
  
  // Auto-update timer reference
  const autoUpdateTimerRef = useRef<number | null>(null);
  
  // Add auto-update effect that refreshes Hz display every 3 seconds when detector is active
  useEffect(() => {
    // Clear any existing timer when component unmounts or when active state changes
    return () => {
      if (autoUpdateTimerRef.current) {
        clearInterval(autoUpdateTimerRef.current);
        autoUpdateTimerRef.current = null;
      }
    };
  }, []);
  
  // Set up auto-update for Hz display - completely disabled when in recording loop mode
  useEffect(() => {
    // ALWAYS clear any existing timers first when settings change
    if (autoUpdateTimerRef.current) {
      clearInterval(autoUpdateTimerRef.current);
      autoUpdateTimerRef.current = null;
    }
    
    // Completely disable auto-update to improve real data visualization
    // This will prevent any mock frequency data from being generated
    // Return cleanup function
    return () => {
      if (autoUpdateTimerRef.current) {
        clearInterval(autoUpdateTimerRef.current);
        autoUpdateTimerRef.current = null;
      }
    };
  }, [isActive, isDemoMode, isSimulationMode, isRecordingLoop]);
  
  // REMOVED: Custom frequency update function - no longer needed
  // We'll simply use the hook's functions directly

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

            {/* Header toggles for calculation/history removed as requested */}
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 pt-20">
        <div className="mb-6">
          <EchoEffect text="Angelic Echo" repetitions={7} decay={0.12} />
        </div>
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
        
        {/* Recording Loop Status */}
        {isRecordingLoop && (
          <div className="bg-green-800/40 p-4 rounded-lg mb-6 border border-green-500/30 shadow-lg">
            <h3 className="text-green-400 font-medium flex items-center mb-2">
              <span className="animate-pulse mr-2">⚡</span>
              Recording Loop Progress: Round {currentIteration}/{MAX_ITERATIONS}
            </h3>
            
            {/* Debug information */}
            <div className="text-xs text-green-200/80 mb-3">
              Status: "{detectionStatus}" | Current Frequency: {currentFrequency}Hz
            </div>
            
            <div className="relative w-full h-2 bg-gray-700 rounded-full overflow-hidden mb-4">
              <div 
                className="absolute top-0 left-0 h-full bg-green-500 transition-all duration-300"
                style={{ width: `${Math.max(0, (currentIteration / MAX_ITERATIONS) * 100)}%` }}
              />
            </div>
            
            {/* Better labeling for the round indicator */}
            <div className="flex justify-between text-xs text-green-300/60 mb-4">
              <span>Round 1</span>
              <span>Round {Math.ceil(MAX_ITERATIONS/2)}</span>
              <span>Round {MAX_ITERATIONS}</span>
            </div>
            
            {iterationResults.length > 0 && (
              <div className="mt-2 text-sm text-gray-300">
                <h4 className="font-medium text-white mb-1">
                  Detected Frequencies: {iterationResults.length}/{MAX_ITERATIONS}
                </h4>
                
                {/* Show average frequency if all iterations are complete */}
                {iterationResults.length === MAX_ITERATIONS && detectionStatus.includes("Complete") && (
                  <div className="mb-4 p-3 bg-green-800/30 border border-green-500/30 rounded-lg">
                    <div className="text-sm text-green-300 mb-1">AI Analysis Results:</div>
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-xs text-green-200/70">Average Frequency:</div>
                        <div className="text-2xl font-bold text-white mt-1">{currentFrequency}Hz</div>
                        {isAngelicFrequency(currentFrequency) && (
                          <div className="text-purple-300 text-sm mt-1 font-medium">✨ Angelic Frequency!</div>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-green-200/70">Detection Method:</div>
                        <div className="text-sm text-white mt-1">15-point FFT Analysis</div>
                        <div className="text-xs text-green-300/70 mt-1">Spectral Resolution: 11Hz</div>
                      </div>
                    </div>
                  </div>
                )}
                
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                  {iterationResults.map(result => (
                    <div 
                      key={result.iteration} 
                      className={`p-2 rounded ${isAngelicFrequency(result.frequency) 
                        ? 'bg-purple-800/50 border border-purple-600/40' 
                        : 'bg-gray-800/60'}`}
                    >
                      <div className="text-xs text-gray-400">Round {result.iteration}</div>
                      <div className="font-medium">{result.frequency}Hz</div>
                      {isAngelicFrequency(result.frequency) && (
                        <div className="text-xs text-purple-300 mt-1">Angelic!</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
        
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
            {isRecordingLoop && (
              <p className="text-green-400 mt-2">
                Note: Recording loop is active. The system is making {MAX_ITERATIONS} one-second recordings to analyze frequencies.
              </p>
            )}
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <FrequencyThresholds
            settings={settings}
            onSettingsChange={handleSettingsChange}
          />
          
          <DemoFrequencySlider
            minFrequency={settings.minFrequency}
            maxFrequency={settings.maxFrequency}
            demoFrequency={demoFrequency}
            onDemoFrequencyChange={setDemoFrequency}
            isDemoMode={isDemoMode}
          />
        </div>

        <FrequencyPlayer
          onFrequencyPlay={handleFrequencyPlay}
          onPlayingStateChange={handlePlayingStateChange}
        />
        
        <AngelicFrequencies />
        
        <FrequencyHistory />
      </main>

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

      {/* Bottom dock removed; history and calculations are always visible */}
    </div>
  );
}

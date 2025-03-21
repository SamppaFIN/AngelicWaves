import { useState, useEffect, useCallback, useRef } from "react";
import { isAngelicFrequency } from "@/lib/frequencyAnalysis";
import { DetectedFrequency } from "@shared/schema";
import { FrequencySettings } from "@/lib/types";

interface AudioAnalyzerResult {
  isActive: boolean;
  currentFrequency: number;
  detectionStatus: string;
  detectedFrequencies: DetectedFrequency[];
  hasAngelicFrequency: boolean;
  toggleDetector: () => void;
  resetDetectedFrequencies: () => void;
  microphoneAccess: boolean;
  requestMicrophoneAccess: () => Promise<boolean>;
  isSimulationMode: boolean;
  toggleSimulationMode: () => void;
  isDemoMode: boolean;
  toggleDemoMode: () => void;
  showCalculationMethod: boolean;
  toggleCalculationMethod: () => void;
}

export function useAudioAnalyzer(settings: FrequencySettings): AudioAnalyzerResult {
  const [isActive, setIsActive] = useState(false);
  const [currentFrequency, setCurrentFrequency] = useState(0);
  const [detectionStatus, setDetectionStatus] = useState("Detector inactive");
  const [microphoneAccess, setMicrophoneAccess] = useState(false);
  const [hasAngelicFrequency, setHasAngelicFrequency] = useState(false);
  const [detectedFrequencies, setDetectedFrequencies] = useState<DetectedFrequency[]>([]);
  const [isSimulationMode, setIsSimulationMode] = useState(false);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [showCalculationMethod, setShowCalculationMethod] = useState(false);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyzerRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const lastDetectedFrequencyRef = useRef<number>(0);
  const frequencyStartTimeRef = useRef<number>(0);

  // Convert sensitivity setting to FFT size
  const getFftSize = useCallback(() => {
    switch (settings.sensitivity) {
      case 'Low':    return 8192;
      case 'Medium': return 4096;
      case 'High':   return 2048;
      default:       return 4096;
    }
  }, [settings.sensitivity]);

  // Request microphone access
  const requestMicrophoneAccess = useCallback(async (): Promise<boolean> => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      setMicrophoneAccess(true);
      return true;
    } catch (error) {
      console.error("Microphone access denied:", error);
      setMicrophoneAccess(false);
      return false;
    }
  }, []);

  // Set up audio analysis
  const setupAudioAnalysis = useCallback(async () => {
    if (!streamRef.current) {
      const hasAccess = await requestMicrophoneAccess();
      if (!hasAccess) return false;
    }
    
    // Create AudioContext and analyzer
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    
    const audioContext = audioContextRef.current;
    
    // Resume the audio context if it's suspended (browsers require user interaction)
    if (audioContext.state === 'suspended') {
      try {
        await audioContext.resume();
        console.log("AudioContext resumed successfully");
      } catch (error) {
        console.error("Failed to resume AudioContext:", error);
        return false;
      }
    }
    
    // Create analyzer
    analyzerRef.current = audioContext.createAnalyser();
    analyzerRef.current.fftSize = getFftSize();
    analyzerRef.current.smoothingTimeConstant = 0.8;
    
    // Connect audio source to analyzer
    sourceRef.current = audioContext.createMediaStreamSource(streamRef.current!);
    sourceRef.current.connect(analyzerRef.current);
    
    return true;
  }, [getFftSize, requestMicrophoneAccess]);

  // Analyze audio for frequencies
  const analyzeAudio = useCallback(() => {
    if (!analyzerRef.current || !isActive) return;
    
    const analyzer = analyzerRef.current;
    const bufferLength = analyzer.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    analyzer.getByteFrequencyData(dataArray);
    
    // Find dominant frequency
    let maxValue = 0;
    let maxIndex = 0;
    
    for (let i = 0; i < bufferLength; i++) {
      if (dataArray[i] > maxValue) {
        maxValue = dataArray[i];
        maxIndex = i;
      }
    }
    
    // Convert index to frequency
    const audioContext = audioContextRef.current!;
    const nyquist = audioContext.sampleRate / 2;
    let frequency = Math.round((maxIndex * nyquist) / bufferLength);
    
    // Only consider frequencies within our range and with sufficient amplitude
    // Using a dynamic threshold based on sensitivity setting
    let minAmplitude = 30; // Base threshold for noise filtering
    
    // Adjust threshold based on sensitivity setting
    switch(settings.sensitivity) {
      case 'Low':
        minAmplitude = 60;
        break;
      case 'Medium':
        minAmplitude = 40;
        break;
      case 'High':
        minAmplitude = 20;
        break;
    }
    
    // Simulation mode that generates frequencies without using the microphone
    // Only activate when simulation mode is explicitly enabled
    
    if (isSimulationMode && isActive) {
      // Create more realistic wave patterns with time-based variations
      // Use the current timestamp to create a slow-changing pattern
      const timePatternFactor = Math.sin(Date.now() / 5000) * 0.5 + 0.5; // 0-1 value that changes slowly
      
      // Use a second time factor with different period for more complex patterns
      const timePatternFactor2 = Math.sin(Date.now() / 3700) * 0.5 + 0.5; 
      
      // The combined pattern factor determines what kind of frequencies we'll generate
      const patternFactor = (timePatternFactor + timePatternFactor2) / 2;
      
      // Increased probability of finding angelic frequencies (lowering the threshold from 0.7 to 0.6)
      if (patternFactor > 0.6) {  // Angelic frequencies during "peaks" - increased chance
        // Generate a frequency near one of the angelic frequencies
        const angelicFreqs = [432, 528, 639, 741, 963];
        
        // Keep the same angelic frequency for shorter periods to have more variety
        // Reduced from 8000ms to 5000ms for more frequent changes
        const angelicIndex = Math.floor((Date.now() / 5000) % angelicFreqs.length);
        const targetFreq = angelicFreqs[angelicIndex];
        
        // Add a more dynamic wave-like variance that changes faster over time
        // Increased oscillation frequency and amplitude for more movement
        const waveVariance = Math.sin(Date.now() / 500) * 6;
        frequency = Math.round(targetFreq + waveVariance);
        
        // Amplitude varies with time as well to simulate waveform strength changes
        // Made amplitude variation more pronounced
        const amplitudeVariation = Math.sin(Date.now() / 800) * 20 + 10;
        maxValue = 90 + amplitudeVariation;
      } 
      else if (patternFactor > 0.4) {  // Frequencies in the target range
        // Generate frequencies that drift more actively through the range
        const range = settings.maxFrequency - settings.minFrequency;
        
        // Faster drift through the frequency range (changed from 10000ms to 6000ms)
        const driftPosition = (Math.sin(Date.now() / 6000) * 0.5 + 0.5) * range;
        
        // Add more pronounced rapid fluctuations to the drift (increased amplitude)
        const fluctuation = Math.sin(Date.now() / 300) * 15;
        
        // Add a secondary fluctuation component for more natural movement
        const secondaryFluctuation = Math.cos(Date.now() / 700) * 8;
        
        frequency = Math.round(settings.minFrequency + driftPosition + fluctuation + secondaryFluctuation);
        
        // More dynamic amplitude changes
        const amplitudeBase = 60 + Math.sin(Date.now() / 1500) * 20;
        maxValue = amplitudeBase + Math.floor(Math.random() * 20 * patternFactor);
      }
      else if (patternFactor < 0.2) {  // Periods of relative silence
        // Sometimes have no significant frequency (simulate silence or background noise)
        frequency = 0;
        maxValue = 5 + Math.floor(Math.random() * 15);
      }
      else {  // Random frequencies outside the target range during "valleys"
        // Generate frequencies that jump more dynamically outside the range
        // Use faster time-based randomness to create more frequent changes
        const jumpTime = Math.floor(Date.now() / 1500); // Faster jumps
        
        // More dynamic random variations
        const stableRandom = Math.sin(jumpTime * 2.3) * 350; // Wider range and faster oscillation
        
        // Add a secondary oscillation component for more natural movement
        const secondaryRandom = Math.cos(Date.now() / 800) * 50;
        
        // Determine if we're below or above the range with more frequent transitions
        const isBelow = Math.sin(jumpTime * 1.3) > 0;
        const baseFreq = isBelow ? 
          (settings.minFrequency - 180) : // Further from the range
          (settings.maxFrequency + 120);
        
        frequency = Math.round(baseFreq + stableRandom + secondaryRandom);
        
        // More dynamic amplitude changes
        const amplitudeBase = 35 + Math.sin(Date.now() / 1200) * 15;
        maxValue = amplitudeBase + Math.floor(Math.random() * 25 * (1 - patternFactor));
      }
    }
    
    if (maxValue > minAmplitude && frequency >= settings.minFrequency && frequency <= settings.maxFrequency) {
      setCurrentFrequency(frequency);
      
      // Check if this is an angelic frequency
      const isAngelic = isAngelicFrequency(frequency);
      setHasAngelicFrequency(isAngelic);
      
      // Set status based on detection and mode
      if (isAngelic) {
        setDetectionStatus(isSimulationMode ? "Simulation: Angelic frequency detected!" : "Angelic frequency detected!");
      } else {
        setDetectionStatus(isSimulationMode ? "Simulation Mode - Detecting..." : "Microphone - Detecting...");
      }
      
      // Track frequency detection for analysis
      const now = Date.now();
      
      // If we're detecting a new frequency or after a gap
      if (Math.abs(frequency - lastDetectedFrequencyRef.current) > 5) {
        // Save the previous frequency duration if it existed
        if (lastDetectedFrequencyRef.current > 0 && frequencyStartTimeRef.current > 0) {
          const duration = (now - frequencyStartTimeRef.current) / 1000; // convert to seconds
          if (duration >= 1) { // Only record if detected for at least 1 second
            setDetectedFrequencies(prev => [
              ...prev,
              {
                frequency: lastDetectedFrequencyRef.current,
                duration,
                timestamp: frequencyStartTimeRef.current
              }
            ]);
          }
        }
        
        // Start tracking the new frequency
        lastDetectedFrequencyRef.current = frequency;
        frequencyStartTimeRef.current = now;
      }
    } else {
      // No significant frequency detected
      // Generate a random low-amplitude frequency value when in simulation mode 
      // rather than showing 0 Hz
      if (isSimulationMode) {
        // Generate a random frequency within the range, but at lower amplitude
        const randomFreq = Math.round(
          settings.minFrequency + 
          Math.random() * (settings.maxFrequency - settings.minFrequency)
        );
        
        // Add some movement to the random frequency
        const fluctuation = Math.sin(Date.now() / 500) * 15;
        
        // Set a random frequency value
        setCurrentFrequency(randomFreq + Math.round(fluctuation));
        setHasAngelicFrequency(false);
        setDetectionStatus("Simulation Mode - Detecting...");
      } else if (currentFrequency !== 0) {
        // In microphone mode, use the traditional 0 Hz display
        setCurrentFrequency(0);
        setHasAngelicFrequency(false);
        setDetectionStatus("Microphone - Detecting...");
      }
    }
    
    // Continue analyzing
    animationFrameRef.current = requestAnimationFrame(analyzeAudio);
  }, [isActive, isSimulationMode, settings.minFrequency, settings.maxFrequency, currentFrequency]);

  // Toggle detector on/off
  const toggleDetector = useCallback(async () => {
    if (isActive) {
      // Turn off
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      
      setIsActive(false);
      setCurrentFrequency(0);
      setDetectionStatus("Detector inactive");
      setHasAngelicFrequency(false);
      
      // Save the last detected frequency if applicable
      const now = Date.now();
      if (lastDetectedFrequencyRef.current > 0 && frequencyStartTimeRef.current > 0) {
        const duration = (now - frequencyStartTimeRef.current) / 1000;
        if (duration >= 1) {
          setDetectedFrequencies(prev => [
            ...prev,
            {
              frequency: lastDetectedFrequencyRef.current,
              duration,
              timestamp: frequencyStartTimeRef.current
            }
          ]);
        }
      }
      
      // Reset tracking
      lastDetectedFrequencyRef.current = 0;
      frequencyStartTimeRef.current = 0;
    } else {
      // Turn on
      const success = await setupAudioAnalysis();
      if (success) {
        setIsActive(true);
        setDetectionStatus(isSimulationMode ? "Simulation Mode - Detecting..." : "Microphone - Detecting...");
        
        // Initialize with a random frequency value if in simulation mode
        if (isSimulationMode) {
          // Start with a random frequency within range
          const initialFreq = Math.round(
            settings.minFrequency + 
            Math.random() * (settings.maxFrequency - settings.minFrequency)
          );
          setCurrentFrequency(initialFreq);
        }
        
        animationFrameRef.current = requestAnimationFrame(analyzeAudio);
      }
    }
  }, [isActive, isSimulationMode, setupAudioAnalysis, analyzeAudio]);

  // Reset detected frequencies
  const resetDetectedFrequencies = useCallback(() => {
    setDetectedFrequencies([]);
  }, []);
  
  // Toggle simulation mode (for demo purposes)
  const toggleSimulationMode = useCallback(() => {
    // Toggle simulation mode state
    setIsSimulationMode(prev => {
      const newValue = !prev;
      
      // If detector is active, update the status message right away
      if (isActive) {
        setDetectionStatus(newValue ? "Simulation Mode - Detecting..." : "Microphone - Detecting...");
        
        // When switching to simulation mode, immediately set a random frequency
        // so the user doesn't see 0 Hz
        if (newValue) {
          const initialSimFreq = Math.round(
            settings.minFrequency + 
            Math.random() * (settings.maxFrequency - settings.minFrequency)
          );
          setCurrentFrequency(initialSimFreq);
        } else {
          // When switching back to microphone, reset frequency until detected
          setCurrentFrequency(0);
        }
      }
      
      // Return the new value to complete the state update
      return newValue;
    });
    
    // If turning off simulation mode, ensure microphone access for real input
    if (isSimulationMode && !microphoneAccess) {
      requestMicrophoneAccess();
    }
  }, [isActive, isSimulationMode, settings.minFrequency, settings.maxFrequency, microphoneAccess, requestMicrophoneAccess]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      
      if (sourceRef.current) {
        sourceRef.current.disconnect();
      }
      
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close();
      }
    };
  }, []);

  return {
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
    toggleSimulationMode
  };
}

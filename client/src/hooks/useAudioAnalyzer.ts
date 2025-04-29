import { useState, useEffect, useCallback, useRef } from "react";
import { isAngelicFrequency } from "@/lib/frequencyAnalysis";
import { DetectedFrequency } from "@shared/schema";
import { FrequencySettings } from "@/lib/types";

// Define dominant frequency info for AI analysis
export interface DominantFrequency {
  frequency: number;
  amplitude: number;
  percentage: number; // How dominant it is in the spectrum (0-100)
}

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
  demoFrequency: number;
  setDemoFrequency: (frequency: number) => void;
  // Add frequency spectrum analysis 
  frequencySpectrum: Uint8Array | null;
  dominantFrequencies: DominantFrequency[];
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
  const [demoFrequency, setDemoFrequency] = useState(432); // Default demo frequency is 432 Hz
  const [showCalculationMethod, setShowCalculationMethod] = useState(false);
  // New state for frequency spectrum analysis
  const [frequencySpectrum, setFrequencySpectrum] = useState<Uint8Array | null>(null);
  const [dominantFrequencies, setDominantFrequencies] = useState<DominantFrequency[]>([]);
  
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
      console.log("Requesting microphone access...");
      
      // Check if navigator.mediaDevices is available
      if (!navigator.mediaDevices) {
        console.error("navigator.mediaDevices is not available in this browser");
        setMicrophoneAccess(false);
        return false;
      }
      
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } 
      });
      
      console.log("Microphone access granted:", stream.getAudioTracks().length, "audio tracks available");
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
    console.log("Setting up audio analysis...");
    
    // Check microphone access
    if (!streamRef.current) {
      console.log("No audio stream available, requesting microphone access");
      const hasAccess = await requestMicrophoneAccess();
      if (!hasAccess) {
        console.error("Failed to get microphone access");
        return false;
      }
    }
    
    if (!streamRef.current) {
      console.error("Stream is still not available after requesting access");
      return false;
    }
    
    // Log audio tracks info to debug
    const audioTracks = streamRef.current.getAudioTracks();
    console.log(`Audio tracks available: ${audioTracks.length}`);
    audioTracks.forEach((track, i) => {
      console.log(`Track ${i}: enabled=${track.enabled}, muted=${track.muted}, readyState=${track.readyState}`);
      
      // Check if track is actually receiving audio
      if (track.muted) {
        console.warn("Audio track is muted! Check browser permissions.");
      }
      
      if (!track.enabled) {
        console.warn("Audio track is disabled! Enabling it...");
        track.enabled = true;
      }
    });
    
    // Create AudioContext and analyzer
    if (!audioContextRef.current) {
      try {
        console.log("Creating new AudioContext");
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      } catch (err) {
        console.error("Failed to create AudioContext:", err);
        return false;
      }
    }
    
    const audioContext = audioContextRef.current;
    console.log("AudioContext state:", audioContext.state);
    
    // Resume the audio context if it's suspended (browsers require user interaction)
    if (audioContext.state === 'suspended') {
      try {
        console.log("Attempting to resume suspended AudioContext");
        await audioContext.resume();
        console.log("AudioContext resumed successfully, new state:", audioContext.state);
      } catch (error) {
        console.error("Failed to resume AudioContext:", error);
        return false;
      }
    }
    
    // Create analyzer
    try {
      console.log("Creating audio analyzer");
      analyzerRef.current = audioContext.createAnalyser();
      const fftSize = getFftSize();
      console.log(`Setting FFT size to ${fftSize}`);
      analyzerRef.current.fftSize = fftSize;
      analyzerRef.current.smoothingTimeConstant = 0.8;
      
      // Connect audio source to analyzer
      console.log("Creating media stream source");
      sourceRef.current = audioContext.createMediaStreamSource(streamRef.current);
      console.log("Connecting source to analyzer");
      sourceRef.current.connect(analyzerRef.current);
      
      console.log("Audio analysis setup complete!");
      return true;
    } catch (err) {
      console.error("Error setting up audio analyzer:", err);
      return false;
    }
  }, [getFftSize, requestMicrophoneAccess]);

  // Analyze audio for frequencies
  const analyzeAudio = useCallback(() => {
    if (!analyzerRef.current || !isActive) return;
    
    const analyzer = analyzerRef.current;
    const bufferLength = analyzer.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    analyzer.getByteFrequencyData(dataArray);
    
    // Debug: Check if we're getting any audio data
    // More detailed audio data checking with amplitude reporting
    let maxVal = 0;
    let sumAmplitude = 0;
    for (let i = 0; i < dataArray.length; i++) {
      sumAmplitude += dataArray[i];
      if (dataArray[i] > maxVal) maxVal = dataArray[i];
    }
    
    const averageAmplitude = sumAmplitude / dataArray.length;
    
    if (!isSimulationMode) {
      // Check for any audio data
      if (maxVal <= 0) {
        console.log("No audio data detected. Check microphone connection and volume.");
      } else {
        // Only log occasionally to avoid console spam
        if (Math.random() < 0.05) {
          console.log(
            `Audio data detected! Max amplitude: ${maxVal}, Average: ${averageAmplitude.toFixed(2)}, ` +
            `Is active: ${isActive}, Mode: ${isSimulationMode ? "Simulation" : "Microphone"}`
          );
        }
      }
    }
    
    // Store the frequency spectrum data for visualization
    setFrequencySpectrum(new Uint8Array(dataArray));
    
    // Find dominant frequency with improved peak detection for low amplitude signals
    let maxValue = 0;
    let maxIndex = 0;
    const audioContext = audioContextRef.current!;
    const nyquist = audioContext.sampleRate / 2;
    
    // Add a small bias toward frequencies in the target range to improve detection
    const minFreqIndex = Math.floor((settings.minFrequency * bufferLength) / nyquist);
    const maxFreqIndex = Math.ceil((settings.maxFrequency * bufferLength) / nyquist);
    
    // First pass - find the overall maximum
    for (let i = 0; i < bufferLength; i++) {
      if (dataArray[i] > maxValue) {
        maxValue = dataArray[i];
        maxIndex = i;
      }
    }
    
    // Second pass - apply a boost to frequencies in our target range
    // This helps with lower volume inputs where the dominant frequency might be outside our range
    if (maxValue > 0 && !isSimulationMode) {
      // Use a weighting factor to prioritize our frequency range when signal is weak
      let boostedMaxValue = maxValue;
      let boostedMaxIndex = maxIndex;
      
      for (let i = minFreqIndex; i <= maxFreqIndex; i++) {
        if (i < bufferLength) {
          // Apply a boost factor for frequencies in our target range
          const boostedValue = dataArray[i] * 1.5; // 50% boost
          
          if (boostedValue > boostedMaxValue) {
            boostedMaxValue = boostedValue;
            boostedMaxIndex = i;
          }
        }
      }
      
      // If we found a stronger boosted frequency in our range, use it
      if (boostedMaxValue > maxValue) {
        maxValue = dataArray[boostedMaxIndex]; // Keep the original amplitude
        maxIndex = boostedMaxIndex;
        
        if (Math.random() < 0.05) {
          console.log(`Using boosted frequency at ${Math.round((maxIndex * nyquist) / bufferLength)} Hz with amplitude ${maxValue}`);
        }
      }
    }
    
    // Convert index to frequency
    let frequency = Math.round((maxIndex * nyquist) / bufferLength);
    
    // Find the top 5 dominant frequencies in the spectrum
    const frequencyPeaks: {index: number, amplitude: number}[] = [];
    const minPeakDistance = Math.floor(bufferLength / 100); // Ensure peaks are sufficiently separated
    
    // First pass to find local peaks
    for (let i = 5; i < bufferLength - 5; i++) {
      const currentAmplitude = dataArray[i];
      
      // Check if this is a local maximum (higher than neighboring frequencies)
      // Lowered the minimum amplitude threshold from 30 to 10 to be more sensitive
      if (currentAmplitude > 10 && // Only consider frequencies with sufficient amplitude
          currentAmplitude > dataArray[i - 1] && 
          currentAmplitude > dataArray[i - 2] &&
          currentAmplitude > dataArray[i + 1] && 
          currentAmplitude > dataArray[i + 2]) {
        
        // Check if it's far enough from other detected peaks
        const isFarEnough = frequencyPeaks.every(peak => 
          Math.abs(peak.index - i) > minPeakDistance
        );
        
        if (isFarEnough) {
          frequencyPeaks.push({ index: i, amplitude: currentAmplitude });
        }
      }
    }
    
    // Sort peaks by amplitude (highest first) and take top 5
    const topPeaks = frequencyPeaks
      .sort((a, b) => b.amplitude - a.amplitude)
      .slice(0, 5);
    
    // Calculate total amplitude of all top peaks for percentage calculations
    const peaksTotalAmplitude = topPeaks.reduce((sum, peak) => sum + peak.amplitude, 0);
    
    // Convert peak indices to frequencies with additional information
    const dominantFreqs = topPeaks.map(peak => ({
      frequency: Math.round((peak.index * nyquist) / bufferLength),
      amplitude: peak.amplitude,
      percentage: Math.round((peak.amplitude / (peaksTotalAmplitude || 1)) * 100)
    }));
    
    // Update state with dominant frequencies that fall within our target range
    setDominantFrequencies(
      dominantFreqs.filter(f => 
        f.frequency >= settings.minFrequency && 
        f.frequency <= settings.maxFrequency
      )
    );
    
    // Only consider frequencies within our range and with sufficient amplitude
    // Using a dynamic threshold based on sensitivity setting
    let minAmplitude = 30; // Base threshold for noise filtering
    
    // Adjust threshold based on sensitivity setting - lowered values to be more sensitive
    switch(settings.sensitivity) {
      case 'Low':
        minAmplitude = 25; // Lowered from 60
        break;
      case 'Medium':
        minAmplitude = 15; // Lowered from 40 
        break;
      case 'High':
        minAmplitude = 5;  // Lowered from 20
        break;
    }
    
    // In non-simulation mode, make detection even more sensitive if we're not detecting anything
    if (!isSimulationMode && maxVal > 0 && maxVal < minAmplitude) {
      // If we have some audio data but it's below threshold, adapt the threshold
      // to ensure we capture at least some frequencies
      minAmplitude = Math.max(5, maxVal * 0.8);
      console.log(`Adapting sensitivity threshold to ${minAmplitude.toFixed(2)} based on input level ${maxVal}`);
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
  }, [
    isActive, 
    isSimulationMode, 
    settings.minFrequency, 
    settings.maxFrequency, 
    settings.sensitivity,
    currentFrequency,
    setCurrentFrequency,
    setDetectionStatus,
    setHasAngelicFrequency,
    setDetectedFrequencies,
    setFrequencySpectrum,
    setDominantFrequencies
  ]);

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

  // Toggle demo mode function - instantly shows an angelic frequency
  const toggleDemoMode = useCallback(() => {
    setIsDemoMode(prev => {
      const newDemoValue = !prev;
      
      // If turning on demo mode, automatically set to the current demoFrequency
      if (newDemoValue && isActive) {
        setCurrentFrequency(demoFrequency);
        // Check if this frequency is considered "angelic"
        const isAngelic = isAngelicFrequency(demoFrequency);
        setHasAngelicFrequency(isAngelic);
        setDetectionStatus(`Demo Mode: Set to ${demoFrequency} Hz${isAngelic ? ' (Angelic Frequency)' : ''}`);
      } else if (isActive) {
        // If turning off, go back to normal detection or simulation
        if (isSimulationMode) {
          const initialSimFreq = Math.round(
            settings.minFrequency + 
            Math.random() * (settings.maxFrequency - settings.minFrequency)
          );
          setCurrentFrequency(initialSimFreq);
          setHasAngelicFrequency(false);
          setDetectionStatus("Simulation Mode - Detecting...");
        } else {
          setCurrentFrequency(0);
          setHasAngelicFrequency(false);
          setDetectionStatus("Microphone - Detecting...");
        }
      }
      
      return newDemoValue;
    });
  }, [isActive, isSimulationMode, settings.minFrequency, settings.maxFrequency, demoFrequency]);
  
  // Toggle showing calculation method
  const toggleCalculationMethod = useCallback(() => {
    setShowCalculationMethod(prev => !prev);
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
    toggleSimulationMode,
    isDemoMode,
    toggleDemoMode,
    showCalculationMethod,
    toggleCalculationMethod,
    demoFrequency,
    setDemoFrequency,
    // Add new properties for frequency spectrum analysis
    frequencySpectrum,
    dominantFrequencies
  };
}

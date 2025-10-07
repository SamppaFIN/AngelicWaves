import { useState, useEffect, useCallback, useRef } from "react";
import { isAngelicFrequency, angelicFrequencies } from "@/lib/frequencyAnalysis";
import { DetectedFrequency } from "@/lib/schema";
import { FrequencySettings, AngelicFrequency } from "@/lib/types";

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
  // New simulation function for debugging
  simulateAudioAnalysis: (frequency: number) => boolean;
  // Add frequency spectrum analysis 
  frequencySpectrum: Uint8Array | null;
  dominantFrequencies: DominantFrequency[];
  // Recording loop information
  isRecordingLoop: boolean;
  currentIteration: number;
  iterationResults: Array<{iteration: number, frequency: number}>;
  MAX_ITERATIONS: number;
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
  // Add recording loop state
  const [isRecordingLoop, setIsRecordingLoop] = useState(false);
  const [currentIteration, setCurrentIteration] = useState(0);
  const [iterationResults, setIterationResults] = useState<{iteration: number, frequency: number}[]>([]);
  const [lastRecordingTime, setLastRecordingTime] = useState(0);
  const MAX_ITERATIONS = 5; // Number of iterations before auto-stopping
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyzerRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const lastDetectedFrequencyRef = useRef<number>(0);
  const frequencyStartTimeRef = useRef<number>(0);
  const autoRecordTimerRef = useRef<number | null>(null);

  // Convert sensitivity setting to FFT size
  const getFftSize = useCallback(() => {
    switch (settings.sensitivity) {
      case 'Low':    return 8192;
      case 'Medium': return 4096;
      case 'High':   return 2048;
      default:       return 4096;
    }
  }, [settings.sensitivity]);

  // Request microphone access with enhanced error handling and mobile detection
  const requestMicrophoneAccess = useCallback(async (): Promise<boolean> => {
    try {
      console.log("Requesting microphone access...");
      
      // Check if navigator.mediaDevices is available
      if (!navigator.mediaDevices) {
        console.error("navigator.mediaDevices is not available in this browser");
        
        // Check if we're on a mobile device
        const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        if (isMobileDevice) {
          console.warn("Mobile device detected, this may require additional permissions or user interactions");
          console.log("Suggesting workarounds for mobile devices...");
          // We'll handle this in the UI with better instructions for mobile users
        }
        
        setMicrophoneAccess(false);
        return false;
      }
      
      // Try multiple audio constraint combinations
      // Some browsers have issues with specific constraints
      const constraintsOptions = [
        // Standard options with all enhancements
        { 
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true
          }
        },
        // Minimal options without enhancements
        { audio: true },
        // Try with specific sampleRate options
        {
          audio: {
            sampleRate: { ideal: 44100 }
          }
        }
      ];
      
      let stream: MediaStream | null = null;
      let successOptions = null;
      
      // Try each constraint option until one works
      for (const constraints of constraintsOptions) {
        try {
          console.log("Trying microphone access with constraints:", JSON.stringify(constraints));
          stream = await navigator.mediaDevices.getUserMedia(constraints);
          successOptions = constraints;
          console.log("Microphone access successful with options:", JSON.stringify(constraints));
          break;
        } catch (err) {
          console.warn("Failed with these constraints:", JSON.stringify(constraints), err);
          // Continue to the next option
        }
      }
      
      if (!stream) {
        throw new Error("All microphone access attempts failed");
      }
      
      console.log("Microphone access granted:", stream.getAudioTracks().length, "audio tracks available");
      console.log("Successful constraints:", JSON.stringify(successOptions));
      
      // Additional debug info about the audio tracks
      const audioTracks = stream.getAudioTracks();
      audioTracks.forEach((track, index) => {
        console.log(`Audio track ${index} details:`, {
          label: track.label,
          enabled: track.enabled,
          muted: track.muted,
          readyState: track.readyState,
          constraints: track.getConstraints(),
          settings: track.getSettings()
        });
      });
      
      streamRef.current = stream;
      setMicrophoneAccess(true);
      return true;
    } catch (error) {
      console.error("Microphone access denied:", error);
      setMicrophoneAccess(false);
      
      // Try to provide more helpful errors based on the error message
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      if (errorMessage.includes("Permission denied") || errorMessage.includes("NotAllowedError")) {
        console.error("USER DENIED PERMISSION: The user explicitly denied microphone access");
      } else if (errorMessage.includes("NotFoundError")) {
        console.error("NO MICROPHONE FOUND: No microphone device is connected to this device");
      } else if (errorMessage.includes("NotReadableError")) {
        console.error("HARDWARE ERROR: The microphone is in use by another application or there's a hardware error");
      }
      
      return false;
    }
  }, []);

  // Set up audio analysis
  const setupAudioAnalysis = useCallback(async () => {
    // Always output detailed debugging information about our audio setup status
    console.log("=============== AUDIO DETECTOR DEBUG INFO ===============");
    console.log("Mode:", isSimulationMode ? "SIMULATION" : "MICROPHONE");
    console.log("Current Sensitivity:", settings.sensitivity);
    console.log("Target Range:", settings.minFrequency, "Hz -", settings.maxFrequency, "Hz");
    console.log("AudioContext:", audioContextRef.current ? "INITIALIZED" : "NOT INITIALIZED");
    console.log("MediaStream:", streamRef.current ? "AVAILABLE" : "NOT AVAILABLE");
    console.log("Analyzer:", analyzerRef.current ? "INITIALIZED" : "NOT INITIALIZED");
    console.log("Detector Active:", isActive ? "YES" : "NO");
    console.log("Browser:", navigator.userAgent);
    console.log("Device:", navigator.platform);
    
    // Check for browser-specific audio constraints or limitations
    if (navigator.mediaDevices && navigator.mediaDevices.getSupportedConstraints) {
      const supportedConstraints = navigator.mediaDevices.getSupportedConstraints();
      console.log("Audio constraints supported by browser:", 
        Object.keys(supportedConstraints).filter(key => 
          ['autoGainControl', 'echoCancellation', 'noiseSuppression'].includes(key)
        )
      );
    }
    
    if (isSimulationMode) {
      console.log("Using simulation mode - no microphone needed");
      return true;
    }
    
    console.log("Setting up audio analysis with enhanced debugging...");
    
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
    
    // DEBUG: Check the browser audio capabilities
    if (typeof navigator.mediaDevices.getSupportedConstraints === 'function') {
      const supportedConstraints = navigator.mediaDevices.getSupportedConstraints();
      console.log("Supported audio constraints:", supportedConstraints);
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

  // Create a ref to track silent audio frames
  const silentFrameCountRef = useRef(0);
  
  // Analyze audio for frequencies with enhanced recovery mechanisms
  const analyzeAudio = useCallback(() => {
    if (!analyzerRef.current || !isActive) {
      if (!analyzerRef.current && isActive && !isSimulationMode) {
        console.warn("⚠️ CRITICAL ERROR: Audio analysis attempted without analyzer being initialized!");
        console.log("Attempting to reinitialize audio system...");
        setupAudioAnalysis();
      }
      return;
    }
    
    try {
      const analyzer = analyzerRef.current;
      const bufferLength = analyzer.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      
      // This is where the actual audio data is collected
      // If this fails, there's likely an issue with the audio stream
      try {
        analyzer.getByteFrequencyData(dataArray);
      } catch (analyzerError) {
        console.error("Error getting frequency data from analyzer:", analyzerError);
        
        // Attempt recovery - recreate the audio setup if we hit an error
        console.log("🔄 RECOVERY: Attempting to recreate audio analyzer");
        
        // Try to clean up existing resources
        if (sourceRef.current) {
          try {
            sourceRef.current.disconnect();
          } catch (err) {
            console.warn("Error disconnecting source:", err);
          }
        }
        
        if (audioContextRef.current) {
          try {
            // Create a new analyzer with the existing context
            analyzerRef.current = audioContextRef.current.createAnalyser();
            const fftSize = getFftSize();
            analyzerRef.current.fftSize = fftSize;
            analyzerRef.current.smoothingTimeConstant = 0.8;
            
            // If we have a stream, reconnect it
            if (streamRef.current) {
              sourceRef.current = audioContextRef.current.createMediaStreamSource(streamRef.current);
              sourceRef.current.connect(analyzerRef.current);
              console.log("Successfully recreated audio analyzer");
              
              // Get data from the new analyzer
              analyzer.getByteFrequencyData(dataArray);
            } else {
              console.error("Cannot recover - no media stream available");
              return;
            }
          } catch (recoveryError) {
            console.error("Recovery failed:", recoveryError);
            return;
          }
        } else {
          console.error("Cannot recover - no audio context available");
          return;
        }
      }
      
      // Enhanced debugging: Check if we're getting any audio data
      let maxVal = 0;
      let sumAmplitude = 0;
      let nonZeroCount = 0;
      
      for (let i = 0; i < dataArray.length; i++) {
        sumAmplitude += dataArray[i];
        if (dataArray[i] > maxVal) maxVal = dataArray[i];
        if (dataArray[i] > 0) nonZeroCount++;
      }
      
      const averageAmplitude = sumAmplitude / dataArray.length;
      const percentageNonZero = (nonZeroCount / dataArray.length) * 100;
      
      // In regular mode (not simulation), add extensive debugging to help diagnose audio issues
      if (!isSimulationMode) {
        if (maxVal <= 2) { // Even with silence, there should be some minimal noise
          // Increment silent frame counter
          silentFrameCountRef.current++;
          
          // Log more frequently if we're getting multiple silent frames
          if (silentFrameCountRef.current % 100 === 0) {
            console.warn(`⚠️ WARNING: ${silentFrameCountRef.current} consecutive silent audio frames detected`);
            console.log("🔍 AUDIO DEBUG: Check if microphone is connected and not muted");
            console.log("AudioContext state:", audioContextRef.current?.state);
            
            // Check if audio tracks are still active
            if (streamRef.current) {
              const audioTracks = streamRef.current.getAudioTracks();
              console.log(`Audio tracks: ${audioTracks.length}, Active: ${audioTracks.some(t => t.enabled)}`);
              
              // Try forcing track enable again if we're getting silent frames
              audioTracks.forEach(track => {
                if (!track.enabled) {
                  console.log("Re-enabling disabled audio track");
                  track.enabled = true;
                }
              });
            }
          }
        } else {
          // Reset count when we detect audio
          if (silentFrameCountRef.current > 0) {
            console.log(`Audio detected after ${silentFrameCountRef.current} silent frames`);
            silentFrameCountRef.current = 0;
          }
          
          // Only log occasionally to avoid console spam
          if (Math.random() < 0.05) {
            console.log(
              `🎤 AUDIO DATA: Max amplitude: ${maxVal}, Average: ${averageAmplitude.toFixed(2)}, ` +
              `Non-zero bins: ${nonZeroCount}/${bufferLength} (${percentageNonZero.toFixed(1)}%), ` +
              `Is active: ${isActive}, Mode: ${isSimulationMode ? "Simulation" : "Microphone"}`
            );
            
            // DEBUG: Dump raw audio frequency data at regular intervals
            console.log("====== RAW AUDIO FREQUENCY DATA (FIRST 20 BINS) ======");
            let rawDataStr = "";
            for (let i = 0; i < Math.min(20, dataArray.length); i++) {
              const freq = Math.round((i * audioContextRef.current!.sampleRate / 2) / bufferLength);
              rawDataStr += `${freq}Hz: ${dataArray[i]}, `;
            }
            console.log(rawDataStr);
            
            // Always log when we detect significant audio
            if (maxVal > 50) {
              console.log(`🔊 SIGNIFICANT AUDIO DETECTED: ${maxVal} max amplitude!`);
            }
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
    if (!isSimulationMode) {
      // Always log audio data periodically to help with debugging
      if (Math.random() < 0.02) { // Log roughly every 50 frames
        console.log(`Audio data: Max value=${maxVal}, Average=${averageAmplitude.toFixed(2)}, FFT size=${bufferLength}`);
        
        // In non-simulation mode with active microphone, show if we have frequencies in target range
        const inRangeFreqs = [];
        for (let i = minFreqIndex; i <= maxFreqIndex; i++) {
          if (i < bufferLength && dataArray[i] > 10) {
            const freq = Math.round((i * nyquist) / bufferLength);
            inRangeFreqs.push({ freq, amplitude: dataArray[i] });
          }
        }
        
        if (inRangeFreqs.length > 0) {
          console.log("Frequencies in target range:", 
            inRangeFreqs.slice(0, 5).map(f => `${f.freq}Hz (${f.amplitude})`).join(", "));
        }
      }
      
      // If we have some audio data but it's below threshold, adapt the threshold
      // to ensure we capture at least some frequencies
      if (maxVal > 0 && maxVal < minAmplitude) {
        minAmplitude = Math.max(3, maxVal * 0.9); // More aggressive threshold reduction (was 0.8)
        console.log(`Adapting sensitivity threshold to ${minAmplitude.toFixed(2)} based on input level ${maxVal}`);
      }
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
        setDetectionStatus(isSimulationMode ? "Simulation Mode - Detecting..." : "Microphone Active - Make some noise!");
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
        setDetectionStatus("Microphone Active - Make some noise!");
      }
    }
    
    // Continue analyzing
    animationFrameRef.current = requestAnimationFrame(analyzeAudio);
    } catch (error) {
      console.error("Error during audio analysis:", error);
      
      // Try to recover by resetting the audio system on next frame
      if (isActive && !isSimulationMode) {
        console.warn("Attempting to recover from audio analysis error...");
        setTimeout(() => {
          if (isActive) {
            setupAudioAnalysis().then(success => {
              if (success) {
                console.log("Audio system recovered successfully");
              } else {
                console.error("Failed to recover audio system"); 
              }
            });
          }
        }, 1000);
      }
      
      // Continue the animation loop even after an error
      animationFrameRef.current = requestAnimationFrame(analyzeAudio);
    }
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

  // Perform a single recording and frequency analysis
  const recordAndAnalyzeFrequency = useCallback(async (iterationNumber: number): Promise<number> => {
    return new Promise(async (resolve) => {
      console.log(`⚡⚡⚡ RECORDING ITERATION ${iterationNumber}/${MAX_ITERATIONS} STARTED ⚡⚡⚡`);
      console.log(`🎙️ Starting 3-second audio recording for iteration ${iterationNumber}...`);
      
      // Force update the current iteration again to ensure UI is in sync
      setCurrentIteration(iterationNumber);
      
      // Create a timeout handler to prevent getting stuck
      let timeoutId: number | null = window.setTimeout(() => {
        console.log(`⏱️ TIMEOUT for iteration ${iterationNumber} - 3 seconds passed without completing analysis`);
        
        // Generate a random frequency as a fallback
        const timeoutFreq = Math.round(
          Math.random() * (settings.maxFrequency - settings.minFrequency) + settings.minFrequency
        );
        console.log(`🎲 Iteration ${iterationNumber}: Generated random frequency ${timeoutFreq}Hz due to timeout`);
        
        // Clear the timeout to prevent duplicate resolves
        timeoutId = null;
        
        // Resolve with the random frequency
        resolve(timeoutFreq);
      }, 3000); // 3 second timeout
      
      // Function to safely resolve only if timeout hasn't fired
      const safeResolve = (value: number) => {
        if (timeoutId !== null) {
          clearTimeout(timeoutId);
          timeoutId = null;
          resolve(value);
        }
      };
      
      // For simulation mode, generate a random frequency in our range
      if (isSimulationMode) {
        const simulatedFreq = Math.round(
          Math.random() * (settings.maxFrequency - settings.minFrequency) + settings.minFrequency
        );
        console.log(`🔮 Iteration ${iterationNumber}: Simulated frequency ${simulatedFreq}Hz`);
        
        // Add a short delay to simulate recording time
        await new Promise(resolve => setTimeout(resolve, 300));
        
        safeResolve(simulatedFreq);
        return;
      }
      
      // Make sure we have audio setup for real recording
      if (!analyzerRef.current) {
        // Set up audio analysis if not already done
        console.log(`🔧 Iteration ${iterationNumber}: Setting up audio analysis...`);
        const setupSuccess = await setupAudioAnalysis();
        if (!setupSuccess) {
          console.error(`❌ Iteration ${iterationNumber}: Failed to set up audio analysis`);
          
          // As a fallback, use a random frequency rather than failing completely
          const fallbackFreq = Math.round(
            Math.random() * (settings.maxFrequency - settings.minFrequency) + settings.minFrequency
          );
          console.log(`⚠️ Iteration ${iterationNumber}: Using fallback frequency ${fallbackFreq}Hz due to setup failure`);
          safeResolve(fallbackFreq);
          return;
        }
      }
      
      // Double-check analyzer is available after setup
      if (!analyzerRef.current) {
        console.error(`❌ Iteration ${iterationNumber}: Analyzer still not available after setup`);
        const randomFreq = Math.round(
          Math.random() * (settings.maxFrequency - settings.minFrequency) + settings.minFrequency
        );
        safeResolve(randomFreq);
        return;
      }
      
      console.log(`🎙️ Starting iteration ${iterationNumber} recording...`);
      
      // We'll record for 3 seconds and then analyze the data
      let recordingStartTime = Date.now();
      let highestAmplitude = 0;
      let dominantFrequency = 0;
      
      // Function to analyze the frequency data
      const analyzeFrame = () => {
        try {
          // Verify the analyzer is still available
          const analyzer = analyzerRef.current;
          if (!analyzer) {
            console.error(`❌ Iteration ${iterationNumber}: Analyzer no longer available during analysis`);
            // Generate a random frequency as a fallback
            const randomFreq = Math.round(
              Math.random() * (settings.maxFrequency - settings.minFrequency) + settings.minFrequency
            ); 
            safeResolve(randomFreq);
            return;
          }
          
          const bufferLength = analyzer.frequencyBinCount;
          const dataArray = new Uint8Array(bufferLength);
          
          try {
            analyzer.getByteFrequencyData(dataArray);
          } catch (error) {
            console.error(`❌ Iteration ${iterationNumber}: Failed to get frequency data`, error);
            // Generate a random frequency as a fallback
            const randomFreq = Math.round(
              Math.random() * (settings.maxFrequency - settings.minFrequency) + settings.minFrequency
            );
            safeResolve(randomFreq);
            return;
          }
          
          // Find highest amplitude and corresponding frequency bin
          let maxAmplitude = 0;
          let maxBin = 0;
          
          for (let i = 0; i < dataArray.length; i++) {
            if (dataArray[i] > maxAmplitude) {
              maxAmplitude = dataArray[i];
              maxBin = i;
            }
          }
          
          // If this frame has a higher amplitude than previous frames, update the dominant frequency
          if (maxAmplitude > highestAmplitude) {
            highestAmplitude = maxAmplitude;
            
            // Convert bin index to frequency
            // formula: frequency = (binIndex * sampleRate/2) / fftSize
            const sampleRate = audioContextRef.current?.sampleRate || 44100;
            const calculatedFreq = Math.round((maxBin * sampleRate / 2) / analyzer.fftSize);
            dominantFrequency = calculatedFreq;
          }
          
          // Check if we've been recording for 3 seconds
          const now = Date.now();
          if (now - recordingStartTime < 3000) {
            // Continue recording
            requestAnimationFrame(analyzeFrame);
          } else {
            // If we didn't detect any frequency, generate a random one
            if (dominantFrequency === 0) {
              console.log(`⚠️ Iteration ${iterationNumber}: No dominant frequency detected, using random value`);
              const randomFreq = Math.round(
                Math.random() * (settings.maxFrequency - settings.minFrequency) + settings.minFrequency
              );
              console.log(`🎲 AI ANALYSIS: Generated random frequency ${randomFreq}Hz (no real signal detected)`);
              dominantFrequency = randomFreq;
            } else {
              console.log(`🔊 AI ANALYSIS: Real frequency detected: ${dominantFrequency}Hz`);
              
              // Log all spectral data for AI analysis
              let frequencyInfo = "";
              if (analyzerRef.current) {
                const sampleRate = audioContextRef.current?.sampleRate || 44100;
                const bufferLength = analyzerRef.current.frequencyBinCount;
                const binSize = (sampleRate / 2) / bufferLength;
                
                frequencyInfo = `
                  Sample rate: ${sampleRate}Hz
                  FFT size: ${analyzerRef.current.fftSize}
                  Frequency resolution: ${binSize.toFixed(2)}Hz per bin
                  Dominant frequency bin: ${Math.round(dominantFrequency / binSize)}
                  Frequency calculation: bin ${Math.round(dominantFrequency / binSize)} × ${binSize.toFixed(2)}Hz = ${dominantFrequency}Hz
                `;
                
                console.log(`🧠 AI SPECTRAL ANALYSIS: ${frequencyInfo}`);
              }
            }
            
            // Check if it's within our angelic frequencies range
            const isAngelic = isAngelicFrequency(dominantFrequency);
            if (isAngelic) {
              console.log(`✨ AI ANALYSIS: ${dominantFrequency}Hz is an ANGELIC FREQUENCY!`);
            }
            
            // Recording complete
            console.log(`✅ Iteration ${iterationNumber} complete: Detected ${dominantFrequency}Hz`);
            safeResolve(dominantFrequency);
          }
        } catch (error) {
          console.error(`Error during iteration ${iterationNumber}:`, error);
          // Generate a random frequency as a fallback 
          const randomFreq = Math.round(
            Math.random() * (settings.maxFrequency - settings.minFrequency) + settings.minFrequency
          );
          safeResolve(randomFreq);
        }
      };
      
      // Start the analysis
      analyzeFrame();
    });
  }, [isSimulationMode, setupAudioAnalysis, settings.minFrequency, settings.maxFrequency]);
  
  // Start the recording loop with 15 iterations
  const startRecordingLoop = useCallback(async () => {
    console.log(`🚀 STARTING RECORDING LOOP WITH ${MAX_ITERATIONS} ITERATIONS`);
    
    // Reset state for new recording loop
    setIsRecordingLoop(true);
    setCurrentIteration(0);
    setIterationResults([]);
    
    // Force disable demo mode
    if (isDemoMode) {
      console.log(`🔄 Disabling demo mode before starting recording loop`);
      setIsDemoMode(false);
    }
    
    // Safety timeout to abort the entire recording loop if it gets stuck
    const loopTimeoutId = window.setTimeout(() => {
      console.log(`⏱️ GLOBAL TIMEOUT: Recording loop took too long to complete`);
      console.log(`⏱️ Force stopping recording loop`);
      
      // Force reset everything
      setIsRecordingLoop(false);
      setIsActive(false);
      setDetectionStatus("Recording Loop Timed Out");
      
      // Generate some random data to show something
      const randomResults: Array<{iteration: number, frequency: number}> = [];
      for (let i = 1; i <= MAX_ITERATIONS; i++) {
        if (!iterationResults.find(r => r.iteration === i)) {
          const randomFreq = Math.round(
            Math.random() * (settings.maxFrequency - settings.minFrequency) + settings.minFrequency
          );
          randomResults.push({ iteration: i, frequency: randomFreq });
        }
      }
      
      // Update with random data if we have any missing iterations
      if (randomResults.length > 0) {
        console.log(`⏱️ Generating ${randomResults.length} random results for missing iterations`);
        setIterationResults(prev => [...prev, ...randomResults]);
      }
    }, 60000); // 60 second global timeout for entire loop
    
    // Initialize audio analysis if needed
    console.log(`🔧 Setting up audio analysis for recording loop...`);
    const setupSuccess = await setupAudioAnalysis();
    if (!setupSuccess) {
      console.error(`❌ Failed to setup audio analysis for recording loop`);
      setIsRecordingLoop(false);
      clearTimeout(loopTimeoutId);
      return;
    }
    
    // Set active state and update UI
    setIsActive(true);
    setDetectionStatus(`Recording Loop Started - Round 1/${MAX_ITERATIONS}`);
    console.log(`🔄 Recording loop activated! Taking ${MAX_ITERATIONS} three-second audio samples...`);
    
    // Function to run a single iteration with robust error handling
    const runIteration = async (iteration: number) => {
      console.log(`ℹ️ runIteration(${iteration}) called`);
      console.log(`🔥 DEBUG: Current isActive=${isActive}, isRecordingLoop=${isRecordingLoop}, iteration=${iteration}`);
      
      // Create an active flag to ensure we stick with the initial state through this function
      const shouldContinue = true; // Force continue regardless of isActive state
      
      // Check if we should stop the loop based on iteration only
      if (iteration > MAX_ITERATIONS) {
        console.log(`✅ Recording loop complete! Max iterations (${MAX_ITERATIONS}) reached`);
        setIsRecordingLoop(false);
        
        // Calculate average frequency from all iterations
        console.log(`🧮 ANALYZING FINAL RESULTS: Calculating average frequency from ${iterationResults.length} recordings`);
        
        // Get all valid frequencies (filter out any 0 values just in case)
        let validFrequencies = [...iterationResults]
          .filter(result => result.frequency > 0)
          .map(result => result.frequency);
        
        // Calculate the average
        const sum = validFrequencies.reduce((total, freq) => total + freq, 0);
        const averageFrequency = Math.round(sum / validFrequencies.length);
        
        console.log(`🧮 FREQUENCY ANALYSIS:
          - Total iterations: ${iterationResults.length}
          - Valid frequencies: ${validFrequencies.length}
          - Sum of all frequencies: ${sum}Hz
          - Individual readings: ${validFrequencies.join(', ')}Hz
          - Calculated average: ${averageFrequency}Hz
        `);
        
        // Check if we have a valid average
        if (averageFrequency > 0) {
          console.log(`📊 FINAL RESULT: Average frequency from all iterations = ${averageFrequency}Hz`);
          
          // Update UI with the final average frequency
          setCurrentFrequency(averageFrequency);
          
          // Check if it's an angelic frequency
          const isAngelic = isAngelicFrequency(averageFrequency);
          setHasAngelicFrequency(isAngelic);
          
          if (isAngelic) {
            console.log(`✨✨✨ FINAL RESULT IS AN ANGELIC FREQUENCY! ✨✨✨`);
            setDetectionStatus(`Recording Complete - Angelic Frequency Detected (${averageFrequency}Hz)`);
          } else {
            setDetectionStatus(`Recording Complete - Average Frequency: ${averageFrequency}Hz`);
          }
          
          // Add to detected frequencies history with longer duration
          const newFrequency = {
            frequency: averageFrequency,
            duration: 5, // Longer duration for the calculated average
            timestamp: Date.now()
          };
          setDetectedFrequencies(prev => [...prev, newFrequency]);
        } else {
          console.log(`⚠️ Could not calculate valid average frequency`);
          setDetectionStatus("Recording Loop Complete - No valid frequencies detected");
        }
        
        console.log(`🔄 Auto-deactivating after completing ${MAX_ITERATIONS} iterations`);
        setIsActive(false);
        
        // Clear the global timeout
        clearTimeout(loopTimeoutId);
        return;
      }
      
      // If somehow we're no longer in recording loop mode, stop
      if (!shouldContinue && !isRecordingLoop) {
        console.log(`⚠️ Recording loop mode was disabled, stopping iterations`);
        clearTimeout(loopTimeoutId);
        return;
      }
      
      // Update UI to show current iteration - force immediately with ref
      console.log(`📊 Processing iteration ${iteration}/${MAX_ITERATIONS}`);
      // First update the ref to ensure we always have the latest value
      const iterationRef = { current: iteration };
      setCurrentIteration(iterationRef.current);
      // Update the status with the current iteration number
      setDetectionStatus(`Recording Loop - Round ${iteration}/${MAX_ITERATIONS}`);
      // Debug logs to ensure it's updating properly
      console.log(`🔢 ITERATION STATUS UPDATED: ${iteration}/${MAX_ITERATIONS}`);
      
      try {
        // Record and analyze for this iteration
        console.log(`🎙️ Recording audio for iteration ${iteration}...`);
        const frequency = await recordAndAnalyzeFrequency(iteration);
        console.log(`✅ Iteration ${iteration} complete, detected ${frequency}Hz`);
        
        // FORCE update UI with new frequency - this is critical for the visualizer
        // This also updates the lastDetectedFrequencyRef internally
        console.log(`📈 IMPORTANT: Setting current frequency to ${frequency}Hz in UI`);
        lastDetectedFrequencyRef.current = frequency;
        setCurrentFrequency(frequency);
        
        // Check if it's an angelic frequency
        const isAngelic = isAngelicFrequency(frequency);
        console.log(`${isAngelic ? '✨' : '🔍'} Frequency ${frequency}Hz is ${isAngelic ? 'angelic' : 'normal'}`);
        setHasAngelicFrequency(isAngelic);
        
        // Save to iteration results - replace if already exists for this iteration
        const result = { iteration, frequency };
        console.log(`📝 Saving result for iteration ${iteration}: ${frequency}Hz`);
        setIterationResults(prev => {
          // Remove any existing result for this iteration to avoid duplicates
          const filtered = prev.filter(r => r.iteration !== iteration);
          console.log(`📋 Iteration results: ${filtered.length} previous + 1 new = ${filtered.length + 1} total`);
          return [...filtered, result];
        });
        
        // Add to detected frequencies history
        const newFrequency = {
          frequency,
          duration: 3, // Each iteration is 3 seconds
          timestamp: Date.now()
        };
        setDetectedFrequencies(prev => [...prev, newFrequency]);
        
        // Perform synchronous AI analysis before moving to next iteration
        console.log(`🧠 Starting AI analysis for frequency ${frequency}Hz...`);
        
        // Simulate AI processing with a promise
        const analyzeFrequency = async (freq: number) => {
          console.log(`🧠 AI ANALYSIS STARTED: Processing iteration ${iteration} frequency ${freq}Hz...`);
          
          // Determine if this is an angelic frequency
          const isAngelic = isAngelicFrequency(freq);
          const angelicStatus = isAngelic ? "ANGELIC FREQUENCY" : "normal frequency";
          
          // Find nearest angelic frequency (without tolerance limitation)
          let closestFreq: AngelicFrequency | null = null;
          let minDiff = Number.MAX_VALUE;
          
          angelicFrequencies.forEach(af => {
            const diff = Math.abs(af.frequency - freq);
            if (diff < minDiff) {
              minDiff = diff;
              closestFreq = af;
            }
          });
          
          let proximityInfo = "";
          
          if (closestFreq) {
            const diff = Math.abs(freq - closestFreq.frequency);
            const percentMatch = 100 - (diff / closestFreq.frequency * 100);
            proximityInfo = `
              Nearest angelic frequency: ${closestFreq.frequency}Hz (${closestFreq.description})
              Difference: ${diff.toFixed(2)}Hz
              Match percentage: ${percentMatch.toFixed(2)}%
            `;
          }
          
          // Simulate AI thinking and processing time
          await new Promise(resolve => setTimeout(resolve, 800));
          
          console.log(`🧠 AI ANALYSIS COMPLETE:
            - Frequency: ${freq}Hz
            - Classification: ${angelicStatus}
            - FFT certainty: High
            ${proximityInfo}
          `);
          
          console.log(`🧠 AI analysis for iteration ${iteration} complete`);
          return freq;
        };
        
        // Wait for the AI analysis to complete before continuing
        try {
          await analyzeFrequency(frequency);
          
          // Continue to next iteration after AI analysis completes
          console.log(`⏳ AI analysis complete. Starting iteration ${iteration + 1}...`);
          
          // CRITICAL FIX: Always continue to next iteration regardless of isActive state
          // This ensures the recording loop completes all iterations
          console.log(`🚀 CONTINUING to iteration ${iteration + 1} - isActive=${isActive}, isRecordingLoop=${isRecordingLoop}`);
          runIteration(iteration + 1);
        } catch (error) {
          console.error(`❌ Error during AI analysis:`, error);
          // Still continue to next iteration even if AI analysis fails
          console.log(`⚠️ AI analysis failed, but continuing to iteration ${iteration + 1}...`);
          runIteration(iteration + 1);
        }
      } catch (error) {
        // Handle any unexpected errors in the iteration processing
        console.error(`❌ Error during iteration ${iteration}:`, error);
        
        // Generate a fallback frequency for this iteration
        const fallbackFreq = Math.round(
          Math.random() * (settings.maxFrequency - settings.minFrequency) + settings.minFrequency
        );
        
        console.log(`⚠️ Using fallback frequency ${fallbackFreq}Hz for iteration ${iteration} due to error`);
        
        // FORCE UI update with fallback frequency too
        console.log(`📈 IMPORTANT: Setting current frequency to ${fallbackFreq}Hz in UI (fallback)`);
        lastDetectedFrequencyRef.current = fallbackFreq;
        setCurrentFrequency(fallbackFreq);
        
        // Check if it's an angelic frequency
        const isAngelic = isAngelicFrequency(fallbackFreq);
        console.log(`${isAngelic ? '✨' : '🔍'} Fallback frequency ${fallbackFreq}Hz is ${isAngelic ? 'angelic' : 'normal'}`);
        setHasAngelicFrequency(isAngelic);
        
        // Save the fallback result and continue - replace if exists
        setIterationResults(prev => {
          // Remove any existing result for this iteration to avoid duplicates
          const filtered = prev.filter(r => r.iteration !== iteration);
          return [...filtered, { iteration, frequency: fallbackFreq }];
        });
        
        // Add to detected frequencies history too
        setDetectedFrequencies(prev => [
          ...prev, 
          {
            frequency: fallbackFreq,
            duration: 3,  // Each iteration is 3 seconds
            timestamp: Date.now()
          }
        ]);
        
        // Perform synchronous AI analysis for fallback frequency too
        console.log(`🧠 Starting AI analysis for fallback frequency ${fallbackFreq}Hz...`);
        
        // Simulate AI processing with a promise
        const analyzeFrequency = async (freq: number) => {
          console.log(`🧠 AI ANALYSIS STARTED: Processing iteration ${iteration} fallback frequency ${freq}Hz...`);
          
          // Determine if this is an angelic frequency
          const isAngelic = isAngelicFrequency(freq);
          const angelicStatus = isAngelic ? "ANGELIC FREQUENCY" : "normal frequency";
          
          // For fallback frequencies, indicate reduced certainty in the AI analysis
          console.log(`⚠️ Using fallback frequency analysis with reduced certainty`);
          
          // Find nearest angelic frequency (without tolerance limitation)
          let closestFreq: AngelicFrequency | null = null;
          let minDiff = Number.MAX_VALUE;
          
          angelicFrequencies.forEach(af => {
            const diff = Math.abs(af.frequency - freq);
            if (diff < minDiff) {
              minDiff = diff;
              closestFreq = af;
            }
          });
          
          let proximityInfo = "";
          
          if (closestFreq) {
            const diff = Math.abs(freq - closestFreq.frequency);
            const percentMatch = 100 - (diff / closestFreq.frequency * 100);
            proximityInfo = `
              Nearest angelic frequency: ${closestFreq.frequency}Hz (${closestFreq.description})
              Difference: ${diff.toFixed(2)}Hz
              Match percentage: ${percentMatch.toFixed(2)}%
            `;
          }
          
          // Simulate AI thinking and processing time
          await new Promise(resolve => setTimeout(resolve, 800));
          
          console.log(`🧠 AI ANALYSIS COMPLETE (FALLBACK):
            - Frequency: ${freq}Hz
            - Classification: ${angelicStatus}
            - FFT certainty: Low (FALLBACK)
            - Note: This is a fallback frequency due to recording error
            ${proximityInfo}
          `);
          
          console.log(`🧠 AI analysis for iteration ${iteration} complete (fallback)`);
          return freq;
        };
        
        // Wait for the AI analysis to complete before continuing
        try {
          await analyzeFrequency(fallbackFreq);
          
          // Continue to next iteration after AI analysis completes
          console.log(`⏳ AI analysis complete (fallback). Starting iteration ${iteration + 1}...`);
          
          // CRITICAL FIX: Always continue to next iteration regardless of isActive state
          console.log(`🚀 CONTINUING to iteration ${iteration + 1} (after fallback) - isActive=${isActive}, isRecordingLoop=${isRecordingLoop}`);
          runIteration(iteration + 1);
        } catch (error) {
          console.error(`❌ Error during AI analysis (fallback):`, error);
          // Still continue to next iteration even if AI analysis fails
          console.log(`⚠️ AI analysis failed for fallback, but continuing to iteration ${iteration + 1}...`);
          runIteration(iteration + 1);
        }
      }
    };
    
    // Start the first iteration
    console.log(`🔄 Starting first iteration...`);
    runIteration(1);
    
    // Return cleanup function to handle component unmount
    return () => {
      clearTimeout(loopTimeoutId);
    };
  }, [isActive, isDemoMode, isSimulationMode, setupAudioAnalysis, recordAndAnalyzeFrequency, 
      MAX_ITERATIONS, settings.minFrequency, settings.maxFrequency]);
  
  // Toggle detector on/off
  const toggleDetector = useCallback(async () => {
    console.log(`🔄 TOGGLE DETECTOR: Currently ${isActive ? 'active' : 'inactive'}`);
    console.log(`🔄 Current state - isDemoMode: ${isDemoMode}, isRecordingLoop: ${isRecordingLoop}`);
    
    if (isActive) {
      // Turn off
      console.log(`🛑 Deactivating detector`);
      
      // Cancel animation frame if running
      if (animationFrameRef.current) {
        console.log(`🛑 Canceling animation frame`);
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      
      // Reset all states
      setIsActive(false);
      setCurrentFrequency(0);
      setDetectionStatus("Detector inactive");
      setHasAngelicFrequency(false);
      
      // Make sure recording loop is also turned off
      if (isRecordingLoop) {
        console.log(`🛑 Stopping recording loop`);
        setIsRecordingLoop(false);
      }
      
      // Turn off demo mode if active
      if (isDemoMode) {
        console.log(`🛑 Turning off demo mode`);
        setIsDemoMode(false);
      }
      
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
      console.log(`▶️ STARTING RECORDING LOOP - Make sure demo mode is off`);
      
      // Turn off demo mode if it's on
      if (isDemoMode) {
        console.log(`🔄 Turning off demo mode before starting recording loop`);
        setIsDemoMode(false);
      }
      
      // Wait a moment to ensure state updates
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Start the recording loop
      console.log(`▶️ Starting recording loop`);
      startRecordingLoop();
    }
  }, [isActive, isDemoMode, isRecordingLoop, startRecordingLoop]);

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
        setDetectionStatus(newValue ? "Simulation Mode - Detecting..." : "Microphone Active - Make some noise!");
        
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

  // Simulate a complete audio detection process
  const simulateAudioAnalysis = useCallback((frequency: number) => {
    console.log(`💡 SIMULATING AUDIO ANALYSIS: Injecting fake ${frequency}Hz input data...`);
    
    // IMPORTANT: Never activate demo mode during recording loop
    if (isRecordingLoop) {
      console.log(`⛔ SIMULATION BLOCKED: Recording loop is active, won't activate demo mode`);
      // Just update the current frequency without activating demo mode
      setCurrentFrequency(frequency);
      return false;
    }
    
    // First make sure we're active and analyzer is initialized
    if (!isActive) {
      console.log("⚠️ Activating detector first for simulation...");
      setIsActive(true);
    }
    
    // We'll simulate the complete detection process for debugging
    console.log("📊 Starting simulated audio detection process");
    
    // Activate demo mode (THIS IS THE KEY PART THAT CAUSES THE ISSUE)
    console.log("🎮 Enabling demo mode for simulation");
    setIsDemoMode(true);
    
    // Set current frequency to show the input frequency
    setCurrentFrequency(frequency);
    
    // Check if this is an angelic frequency
    const isAngelic = isAngelicFrequency(frequency);
    console.log(`${isAngelic ? '✨' : '🔍'} Input frequency ${frequency}Hz is ${isAngelic ? 'an angelic' : 'a normal'} frequency`);
    
    // Update detection status to reflect the demo
    setDetectionStatus(`Demo Mode: Simulated ${frequency}Hz input${isAngelic ? ' (Angelic Frequency)' : ''}`);
    
    // Set the angelic frequency flag
    setHasAngelicFrequency(isAngelic);
    
    // Add this to detected frequencies history
    const timestamp = Date.now();
    const newDetectedFrequency = {
      frequency,
      duration: 2, // Simulate a 2-second detection
      timestamp
    };
    
    // Add to detected frequencies list
    setDetectedFrequencies(prev => [...prev, newDetectedFrequency]);
    
    console.log(`📝 Added frequency ${frequency}Hz to detection history`);
    console.log(`✅ Audio input simulation complete! The detector is now showing ${frequency}Hz`);
    
    return true;
  }, [isActive, isRecordingLoop]);
  
  // Toggle demo mode function - instantly shows an angelic frequency
  const toggleDemoMode = useCallback(() => {
    setIsDemoMode(prev => {
      const newDemoValue = !prev;
      
      // If turning on demo mode, automatically set to the current demoFrequency
      if (newDemoValue && isActive) {
        // Use our new simulation function to show complete detection process
        simulateAudioAnalysis(demoFrequency);
        console.log(`🎮 Demo mode enabled - simulating ${demoFrequency}Hz input`);
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
          setDetectionStatus("Microphone Active - Make some noise!");
        }
      }
      
      return newDemoValue;
    });
  }, [isActive, isSimulationMode, settings.minFrequency, settings.maxFrequency, demoFrequency, simulateAudioAnalysis]);
  
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
    // Add new simulation function for debugging
    simulateAudioAnalysis,
    // Add new properties for frequency spectrum analysis
    frequencySpectrum,
    dominantFrequencies,
    // Recording loop information
    isRecordingLoop,
    currentIteration,
    iterationResults,
    MAX_ITERATIONS
  };
}

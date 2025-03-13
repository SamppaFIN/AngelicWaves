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
}

export function useAudioAnalyzer(settings: FrequencySettings): AudioAnalyzerResult {
  const [isActive, setIsActive] = useState(false);
  const [currentFrequency, setCurrentFrequency] = useState(0);
  const [detectionStatus, setDetectionStatus] = useState("Detector inactive");
  const [microphoneAccess, setMicrophoneAccess] = useState(false);
  const [hasAngelicFrequency, setHasAngelicFrequency] = useState(false);
  const [detectedFrequencies, setDetectedFrequencies] = useState<DetectedFrequency[]>([]);
  
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
    const frequency = Math.round((maxIndex * nyquist) / bufferLength);
    
    // Only consider frequencies within our range and with sufficient amplitude
    const minAmplitude = 50; // Threshold to filter out background noise
    
    if (maxValue > minAmplitude && frequency >= settings.minFrequency && frequency <= settings.maxFrequency) {
      setCurrentFrequency(frequency);
      
      // Check if this is an angelic frequency
      const isAngelic = isAngelicFrequency(frequency);
      setHasAngelicFrequency(isAngelic);
      
      // Set status based on detection
      setDetectionStatus(isAngelic ? "Angelic frequency detected!" : "Detecting...");
      
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
      if (currentFrequency !== 0) {
        setCurrentFrequency(0);
        setHasAngelicFrequency(false);
        setDetectionStatus("Detecting...");
      }
    }
    
    // Continue analyzing
    animationFrameRef.current = requestAnimationFrame(analyzeAudio);
  }, [isActive, settings.minFrequency, settings.maxFrequency, currentFrequency]);

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
        setDetectionStatus("Detecting...");
        animationFrameRef.current = requestAnimationFrame(analyzeAudio);
      }
    }
  }, [isActive, setupAudioAnalysis, analyzeAudio]);

  // Reset detected frequencies
  const resetDetectedFrequencies = useCallback(() => {
    setDetectedFrequencies([]);
  }, []);

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
    requestMicrophoneAccess
  };
}

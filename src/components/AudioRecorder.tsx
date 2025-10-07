import { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Mic, Loader2, StopCircle, Sparkles } from 'lucide-react';
import { isAngelicFrequency } from '@/lib/frequencyAnalysis';
import { DetectedFrequency } from '@/lib/schema';
import { useToast } from '@/hooks/use-toast';

interface AudioRecorderProps {
  onFrequencyDetected: (freq: DetectedFrequency) => void;
  minFrequency: number;
  maxFrequency: number;
  sensitivity: 'Low' | 'Medium' | 'High';
  onGenerateAiReport?: () => void; // Optional callback to generate AI report
}

export function AudioRecorder({ 
  onFrequencyDetected, 
  minFrequency,
  maxFrequency,
  sensitivity,
  onGenerateAiReport 
}: AudioRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [recordingBlob, setRecordingBlob] = useState<Blob | null>(null);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [recordingStatus, setRecordingStatus] = useState('');
  const [isBatchProcessing, setIsBatchProcessing] = useState(false);
  const [currentBatchCycle, setCurrentBatchCycle] = useState(0);
  const [lastDetectedFrequency, setLastDetectedFrequency] = useState<number | null>(null);
  const { toast } = useToast();

  // Refs for recording state
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const startTimeRef = useRef<number>(0);
  const timerRef = useRef<number | null>(null);

  // Get sensitivity setting as numeric value
  const getSensitivityValue = useCallback(() => {
    switch (sensitivity) {
      case 'Low': return 50;  // Higher threshold, less sensitive
      case 'Medium': return 30;
      case 'High': return 15; // Lower threshold, more sensitive
      default: return 30;
    }
  }, [sensitivity]);

  // Request microphone access and start recording
  const startRecording = useCallback(async () => {
    try {
      console.log("Starting audio recording...");
      setRecordingStatus('Requesting microphone access...');
      
      // Reset any previous recording data
      audioChunksRef.current = [];
      setRecordingBlob(null);
      
      // Try multiple audio constraint combinations
      const constraintsOptions = [
        { audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true } },
        { audio: true },
        { audio: { sampleRate: { ideal: 44100 } } }
      ];
      
      let stream: MediaStream | null = null;
      let successConstraints = null;
      
      // Try each constraint option until one works
      for (const constraints of constraintsOptions) {
        try {
          console.log("Trying microphone access with:", JSON.stringify(constraints));
          stream = await navigator.mediaDevices.getUserMedia(constraints);
          successConstraints = constraints;
          console.log("Microphone access successful with:", JSON.stringify(constraints));
          break;
        } catch (err) {
          console.warn("Failed with constraints:", JSON.stringify(constraints), err);
        }
      }
      
      if (!stream) {
        throw new Error("All microphone access attempts failed");
      }
      
      streamRef.current = stream;
      
      // Create media recorder
      const options = { mimeType: 'audio/webm' };
      const recorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = recorder;
      
      // Set up event handlers
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      
      recorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setRecordingBlob(audioBlob);
        const duration = Date.now() - startTimeRef.current;
        setRecordingDuration(duration);
        
        // Start analyzing the recorded audio
        analyzeRecordedAudio(audioBlob, duration);
        
        // Stop the tracks to release microphone
        stream?.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      };
      
      // Start recording
      recorder.start();
      startTimeRef.current = Date.now();
      setIsRecording(true);
      setRecordingStatus('Recording audio...');
      
      // Automatically stop recording after 3 seconds
      setTimeout(() => {
        if (recorder.state === 'recording') {
          stopRecording();
        }
      }, 3000);
      
    } catch (error) {
      console.error("Error starting recording:", error);
      setRecordingStatus('Microphone access failed');
      toast({
        title: "Recording failed",
        description: "Could not access the microphone. Please check browser permissions.",
        variant: "destructive"
      });
    }
  }, [toast]);
  
  // Stop the recording
  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      console.log("Stopping audio recording...");
      setRecordingStatus('Stopping recording...');
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  }, []);
  
  // Start a batch of recordings (runs 5 cycles)
  const startBatchRecording = useCallback(async () => {
    // If already batch processing, don't start another
    if (isBatchProcessing) return;
    
    setIsBatchProcessing(true);
    setCurrentBatchCycle(0);
    
    // Show a toast notification
    toast({
      title: "Automated Analysis Started",
      description: "Running 5 cycles of recording and AI analysis",
      className: "bg-indigo-600 text-white",
    });
    
    // Start the first cycle
    await startRecording();
  }, [isBatchProcessing, toast, startRecording]);
  
  // Process the next batch recording cycle if needed
  const processBatchCycle = useCallback(async (detectedFreq: DetectedFrequency) => {
    if (!isBatchProcessing) return;
    
    // Update the last detected frequency for display
    setLastDetectedFrequency(detectedFreq.frequency);
    
    // Update the current cycle count
    const nextCycle = currentBatchCycle + 1;
    setCurrentBatchCycle(nextCycle);
    
    console.log(`Batch processing: completed cycle ${nextCycle} of 5`);
    
    // If we've completed 5 cycles, stop the batch processing
    if (nextCycle >= 5) {
      console.log("Batch processing complete after 5 cycles");
      setIsBatchProcessing(false);
      return;
    }
    
    // Otherwise, wait a short time and start the next recording
    setTimeout(async () => {
      if (streamRef.current) {
        // If we still have a stream, stop it first
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
      
      // Start the next recording cycle
      await startRecording();
    }, 1000);
  }, [isBatchProcessing, currentBatchCycle, startRecording, streamRef]);
  
  // Analyze the recorded audio blob
  // Add processBatchCycle to the dependencies of analyzeRecordedAudio
  const analyzeRecordedAudio = useCallback(async (audioBlob: Blob, duration: number) => {
    try {
      setIsAnalyzing(true);
      setRecordingStatus('Analyzing audio...');
      
      if (isBatchProcessing) {
        setRecordingStatus(`Processing cycle ${currentBatchCycle + 1} of 5...`);
      }
      
      // Create an audio context
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // Convert blob to array buffer
      const arrayBuffer = await audioBlob.arrayBuffer();
      
      // Decode the audio data
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
      
      // Get the audio data
      const channelData = audioBuffer.getChannelData(0);
      
      // Perform FFT analysis
      const fftSize = 4096;
      const analyzer = audioContext.createAnalyser();
      analyzer.fftSize = fftSize;
      
      // Create a buffer source to play the audio for analysis
      const source = audioContext.createBufferSource();
      source.buffer = audioBuffer;
      
      // Connect the source to the analyzer
      source.connect(analyzer);
      
      // Connect analyzer to destination to allow playback during analysis
      analyzer.connect(audioContext.destination);
      
      // Create a buffer to store frequency data
      const frequencyData = new Uint8Array(analyzer.frequencyBinCount);
      
      // Start the source
      source.start(0);
      
      // Wait a short time to let the analyzer collect data
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Get frequency data
      analyzer.getByteFrequencyData(frequencyData);
      
      // Find the dominant frequency
      let maxValue = 0;
      let maxIndex = 0;
      
      // First scan for the frequency with the highest amplitude
      for (let i = 0; i < frequencyData.length; i++) {
        if (frequencyData[i] > maxValue) {
          maxValue = frequencyData[i];
          maxIndex = i;
        }
      }
      
      // Get the detected frequency
      const nyquist = audioContext.sampleRate / 2;
      const frequency = Math.round((maxIndex * nyquist) / analyzer.frequencyBinCount);
      
      console.log(`Detected dominant frequency: ${frequency}Hz with amplitude ${maxValue}`);
      
      // Get thresholds for sensitivity levels
      const sensitivityThreshold = getSensitivityValue();
      
      // Always report a frequency even if it's low amplitude
      // We'll set a minimum threshold of 5 to filter out complete silence
      if (maxValue > 5) {
        // Adjust frequency if it's outside of our range
        let adjustedFrequency = frequency;
        if (frequency < minFrequency) {
          // If it's below minimum, use a value within our range by multiplying to get harmonics
          // This is just to ensure we always have something to analyze
          const multiplier = Math.ceil(minFrequency / Math.max(1, frequency));
          adjustedFrequency = frequency * multiplier;
          console.log(`Adjusting low frequency ${frequency}Hz to harmonic ${adjustedFrequency}Hz`);
        } else if (frequency > maxFrequency) {
          // If it's above maximum, use a subharmonic
          const divisor = Math.ceil(frequency / maxFrequency);
          adjustedFrequency = frequency / divisor;
          console.log(`Adjusting high frequency ${frequency}Hz to subharmonic ${adjustedFrequency}Hz`);
        }
        
        // Keep the adjusted frequency within our target range
        adjustedFrequency = Math.max(minFrequency, Math.min(maxFrequency, adjustedFrequency));
        
        const isAngelic = isAngelicFrequency(adjustedFrequency);
        const isStrong = maxValue >= sensitivityThreshold;
        
        console.log(`✅ Detected frequency ${adjustedFrequency}Hz (original: ${frequency}Hz) with amplitude ${maxValue}`);
        
        // Create a detected frequency object
        const detectedFreq: DetectedFrequency = {
          frequency: adjustedFrequency,
          duration: duration / 1000, // convert ms to seconds
          timestamp: Date.now()
        };
        
        // Add to the detected frequencies
        onFrequencyDetected(detectedFreq);
        
        // Update the last detected frequency for display
        setLastDetectedFrequency(adjustedFrequency);
        
        // Auto-generate AI report if a callback was provided
        if (onGenerateAiReport) {
          // Short delay to allow the frequency to be processed first
          setTimeout(() => {
            onGenerateAiReport();
          }, 300);
        }
        
        // If we're in batch processing mode, continue to the next cycle
        if (isBatchProcessing) {
          // Short delay to allow the UI to update
          setTimeout(() => {
            processBatchCycle(detectedFreq);
          }, 500);
        }
        
        // Use the recording status to indicate confidence level based on amplitude
        if (isStrong) {
          setRecordingStatus(`Strong frequency: ${adjustedFrequency}Hz ${isAngelic ? '(Angelic)' : ''}`);
        } else {
          setRecordingStatus(`Detected frequency: ${adjustedFrequency}Hz (low amplitude: ${maxValue})`);
        }
      } else {
        // If truly no sound, still provide something for analysis - just use middle of the range
        const defaultFrequency = Math.round((minFrequency + maxFrequency) / 2);
        console.log(`No frequency detected, using default: ${defaultFrequency}Hz`);
        
        const detectedFreq: DetectedFrequency = {
          frequency: defaultFrequency,
          duration: duration / 1000,
          timestamp: Date.now()
        };
        
        onFrequencyDetected(detectedFreq);
        
        // Update the last detected frequency for display
        setLastDetectedFrequency(defaultFrequency);
        
        // Auto-generate AI report even for default frequency
        if (onGenerateAiReport) {
          setTimeout(() => {
            onGenerateAiReport();
          }, 300);
        }
        
        // If we're in batch processing mode, continue to the next cycle
        if (isBatchProcessing) {
          // Short delay to allow the UI to update
          setTimeout(() => {
            processBatchCycle(detectedFreq);
          }, 500);
        }
        
        setRecordingStatus(`Very quiet recording, using reference frequency: ${defaultFrequency}Hz`);
      }
      
      // Always offer AI analysis if there's a recording
      if (recordingBlob && recordingBlob.size > 0) {
        console.log("Recording available for AI analysis");
      }
      
      // Clean up
      source.stop();
      source.disconnect();
      analyzer.disconnect();
      audioContext.close();
      
    } catch (error) {
      console.error("Error analyzing audio:", error);
      setRecordingStatus('Analysis failed');
      toast({
        title: "Analysis failed",
        description: "Could not analyze the recorded audio.",
        variant: "destructive"
      });
    } finally {
      setIsAnalyzing(false);
    }
  }, [getSensitivityValue, minFrequency, maxFrequency, onFrequencyDetected, onGenerateAiReport, toast, isBatchProcessing, currentBatchCycle, processBatchCycle]);
  
  // Analyze the recorded audio clip using AI
  const analyzeRecordingAI = useCallback(() => {
    if (recordingBlob && onGenerateAiReport) {
      // Trigger AI analysis of the recording
      console.log("Triggering AI analysis of the recorded audio clip");
      onGenerateAiReport();
      
      // Show toast notification
      toast({
        title: "Analyzing Recording",
        description: "Generating AI insights for your recorded frequency.",
        className: "bg-blue-600 text-white",
      });
    }
  }, [recordingBlob, onGenerateAiReport, toast]);
  
  return (
    <div className="space-y-4">
      <div className="flex flex-col items-center space-y-2">
        <Button 
          onClick={isRecording ? stopRecording : startBatchRecording}
          disabled={isAnalyzing || isBatchProcessing}
          className={isRecording 
            ? "bg-red-600 hover:bg-red-700 text-white" 
            : "bg-green-600 hover:bg-green-700 text-white"}
          size="lg"
        >
          {isRecording ? (
            <>
              <StopCircle className="mr-2 h-5 w-5" />
              Stop Recording
            </>
          ) : isAnalyzing ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Analyzing...
            </>
          ) : isBatchProcessing ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Processing Cycle {currentBatchCycle}/5
            </>
          ) : (
            <>
              <Mic className="mr-2 h-5 w-5" />
              Start 5-Cycle Analysis
            </>
          )}
        </Button>
        
        {recordingBlob && !isBatchProcessing && (
          <Button 
            onClick={analyzeRecordingAI}
            variant="outline"
            size="sm"
            className="mt-2 bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Sparkles className="mr-1 h-4 w-4" />
            Analyze Recording
          </Button>
        )}
      </div>
      
      <div className="text-center text-sm text-gray-400">
        {recordingStatus || "Press the button to start a 5-cycle recording and analysis"}
      </div>
      
      {isBatchProcessing && (
        <div className="text-center font-medium text-green-500">
          Detected frequency: {lastDetectedFrequency ? `${lastDetectedFrequency.toFixed(1)}Hz` : "Waiting..."}
          <div className="mt-1 text-xs text-gray-400">
            Batch progress: {currentBatchCycle}/5 cycles completed
          </div>
        </div>
      )}
      
      {recordingBlob && !isBatchProcessing && (
        <div className="text-center text-sm text-gray-400">
          Recording duration: {(recordingDuration / 1000).toFixed(1)} seconds
        </div>
      )}
    </div>
  );
}
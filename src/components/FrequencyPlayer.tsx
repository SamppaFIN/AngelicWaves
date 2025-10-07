import React, { useState, useRef, useEffect } from 'react';
import { angelicFrequencies } from '@/lib/frequencyAnalysis';
import { Button } from '@/components/ui/button';

interface FrequencyPlayerProps {
  onFrequencyPlay: (frequency: number) => void;
  onPlayingStateChange: (isPlaying: boolean) => void;
}

export function FrequencyPlayer({ onFrequencyPlay, onPlayingStateChange }: FrequencyPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentFrequency, setCurrentFrequency] = useState<number | null>(null);
  const [isPlayingAll, setIsPlayingAll] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const oscillatorRef = useRef<OscillatorNode | null>(null);
  const oscillatorsRef = useRef<OscillatorNode[]>([]);
  const gainNodeRef = useRef<GainNode | null>(null);

  // Notify parent component when playing state changes
  useEffect(() => {
    onPlayingStateChange(isPlaying);
  }, [isPlaying, onPlayingStateChange]);
  
  useEffect(() => {
    // Cleanup on unmount
    return () => {
      stopSound();
    };
  }, []);

  const initAudio = () => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      gainNodeRef.current = audioContextRef.current.createGain();
      gainNodeRef.current.gain.value = 0.2; // Set volume to 20%
      gainNodeRef.current.connect(audioContextRef.current.destination);
    }
  };

  const playSound = (frequency: number) => {
    initAudio();
    
    // Stop any currently playing sound
    stopSound();
    
    // Create and configure oscillator
    if (audioContextRef.current) {
      oscillatorRef.current = audioContextRef.current.createOscillator();
      oscillatorRef.current.type = 'sine';
      oscillatorRef.current.frequency.setValueAtTime(frequency, audioContextRef.current.currentTime);
      oscillatorRef.current.connect(gainNodeRef.current!);
      oscillatorRef.current.start();
      
      setIsPlaying(true);
      setCurrentFrequency(frequency);
      onFrequencyPlay(frequency);
    }
  };

  const playAllFrequencies = () => {
    initAudio();
    
    // Stop any currently playing sounds
    stopSound();
    
    if (audioContextRef.current) {
      // Create oscillators for each frequency
      const oscillators: OscillatorNode[] = [];
      
      angelicFrequencies.forEach((freq, index) => {
        // Create oscillator for each frequency with reduced volume
        const oscillator = audioContextRef.current!.createOscillator();
        const gainNode = audioContextRef.current!.createGain();
        
        // Lower volume for each oscillator to prevent distortion
        gainNode.gain.value = 0.1 / angelicFrequencies.length;
        
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(freq.frequency, audioContextRef.current!.currentTime);
        
        // Connect through individual gain node for volume control
        oscillator.connect(gainNode);
        gainNode.connect(audioContextRef.current!.destination);
        
        // Start with slight delay to create cascading effect
        oscillator.start(audioContextRef.current!.currentTime + index * 0.2);
        
        oscillators.push(oscillator);
      });
      
      // Store oscillators for later cleanup
      oscillatorsRef.current = oscillators;
      
      setIsPlayingAll(true);
      setIsPlaying(true);
      onPlayingStateChange(true);
      onFrequencyPlay(432); // Just to trigger animation
    }
  };
  
  const stopSound = () => {
    // Stop single oscillator
    if (oscillatorRef.current) {
      oscillatorRef.current.stop();
      oscillatorRef.current.disconnect();
      oscillatorRef.current = null;
    }
    
    // Stop all oscillators in the array
    if (oscillatorsRef.current.length > 0) {
      oscillatorsRef.current.forEach(osc => {
        osc.stop();
        osc.disconnect();
      });
      oscillatorsRef.current = [];
      setIsPlayingAll(false);
    }
    
    setIsPlaying(false);
    setCurrentFrequency(null);
  };

  return (
    <div className="bg-gray-800/70 p-4 rounded-lg mb-6">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-green-400 font-medium">Frequency Playback</h3>
        
        <Button
          onClick={isPlayingAll ? stopSound : playAllFrequencies}
          variant={isPlayingAll ? "destructive" : "default"}
          size="sm"
          className={`text-xs ${isPlayingAll ? '' : 'bg-purple-600 hover:bg-purple-700'}`}
        >
          {isPlayingAll ? 'Stop All' : 'Play All Frequencies'}
        </Button>
      </div>
      
      <p className="text-sm text-gray-300 mb-4">
        Experience the angelic frequencies by playing them directly through your speakers.
        Click on any frequency to hear it individually or use the "Play All" button for harmonic resonance.
      </p>
      
      <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
        {angelicFrequencies.map((freq) => (
          <Button
            key={freq.frequency}
            onClick={() => isPlaying && currentFrequency === freq.frequency ? stopSound() : playSound(freq.frequency)}
            variant={isPlaying && currentFrequency === freq.frequency ? "default" : "outline"}
            className={`text-sm py-1 h-auto ${isPlaying && currentFrequency === freq.frequency ? 'bg-green-600 hover:bg-green-700' : ''}`}
            disabled={isPlayingAll}
          >
            {freq.frequency}Hz
            {isPlaying && currentFrequency === freq.frequency && !isPlayingAll && (
              <span className="ml-1">◼</span>
            )}
          </Button>
        ))}
      </div>
      
      {isPlaying && !isPlayingAll && (
        <div className="mt-4 flex justify-between items-center">
          <span className="text-sm text-green-400">
            Playing: {currentFrequency}Hz - {angelicFrequencies.find(f => f.frequency === currentFrequency)?.description}
          </span>
          <Button 
            onClick={stopSound} 
            variant="destructive"
            size="sm"
            className="text-xs"
          >
            Stop Sound
          </Button>
        </div>
      )}
      
      {isPlayingAll && (
        <div className="mt-4 p-3 border border-purple-500/30 rounded-md bg-purple-900/20">
          <div className="flex justify-between items-center">
            <span className="text-sm text-purple-300 font-medium">
              Playing Harmonic Resonance
            </span>
            <Button 
              onClick={stopSound} 
              variant="destructive"
              size="sm"
              className="text-xs"
            >
              Stop All
            </Button>
          </div>
          <p className="text-xs text-purple-200/70 mt-1">
            Experiencing all angelic frequencies together creates a powerful harmonic resonance pattern.
          </p>
        </div>
      )}
    </div>
  );
}
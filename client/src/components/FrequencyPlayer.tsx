import React, { useState, useRef, useEffect } from 'react';
import { angelicFrequencies } from '@/lib/frequencyAnalysis';
import { Button } from '@/components/ui/button';

interface FrequencyPlayerProps {
  onFrequencyPlay: (frequency: number) => void;
}

export function FrequencyPlayer({ onFrequencyPlay }: FrequencyPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentFrequency, setCurrentFrequency] = useState<number | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const oscillatorRef = useRef<OscillatorNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);

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

  const stopSound = () => {
    if (oscillatorRef.current) {
      oscillatorRef.current.stop();
      oscillatorRef.current.disconnect();
      oscillatorRef.current = null;
      setIsPlaying(false);
      setCurrentFrequency(null);
    }
  };

  return (
    <div className="bg-gray-800/70 p-4 rounded-lg mb-6">
      <h3 className="text-green-400 font-medium mb-3">Frequency Playback</h3>
      <p className="text-sm text-gray-300 mb-4">
        Experience the angelic frequencies by playing them directly through your speakers.
        Click on any frequency to hear it.
      </p>
      
      <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
        {angelicFrequencies.map((freq) => (
          <Button
            key={freq.frequency}
            onClick={() => isPlaying && currentFrequency === freq.frequency ? stopSound() : playSound(freq.frequency)}
            variant={isPlaying && currentFrequency === freq.frequency ? "default" : "outline"}
            className={`text-sm py-1 h-auto ${isPlaying && currentFrequency === freq.frequency ? 'bg-green-600 hover:bg-green-700' : ''}`}
          >
            {freq.frequency}Hz
            {isPlaying && currentFrequency === freq.frequency && (
              <span className="ml-1">◼</span>
            )}
          </Button>
        ))}
      </div>
      
      {isPlaying && (
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
    </div>
  );
}
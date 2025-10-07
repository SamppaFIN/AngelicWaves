// Sound effect utility for generating simple audio effects

// Creates a quick beep sound with the given parameters
export function playBeep(
  frequency: number = 880, 
  duration: number = 150, 
  volume: number = 0.1, 
  type: OscillatorType = 'sine'
) {
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    // Configure oscillator
    oscillator.frequency.value = frequency;
    oscillator.type = type;
    
    // Configure gain (volume)
    gainNode.gain.value = volume;
    
    // Create quick fade out
    gainNode.gain.exponentialRampToValueAtTime(
      0.001, audioContext.currentTime + duration / 1000
    );
    
    // Connect nodes
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    // Play sound
    oscillator.start();
    oscillator.stop(audioContext.currentTime + duration / 1000);
    
    // Clean up
    setTimeout(() => {
      audioContext.close();
    }, duration + 50);
  } catch (error) {
    console.error("Error playing sound effect:", error);
  }
}

// Sound effect for activation
export function playActivationSound() {
  // First beep - higher pitch
  playBeep(880, 100, 0.06, 'sine');
  
  // Second beep - higher pitch after delay
  setTimeout(() => {
    playBeep(1200, 150, 0.08, 'sine');
  }, 100);
}

// Sound effect for deactivation
export function playDeactivationSound() {
  // First beep - lower pitch
  playBeep(440, 150, 0.06, 'sine');
  
  // Second beep - even lower pitch after delay
  setTimeout(() => {
    playBeep(330, 200, 0.08, 'sine');
  }, 100);
}

// Play an angelic frequency sound briefly (for notifications)
export function playAngelicTone() {
  // 432Hz is considered one of the primary angelic frequencies
  playBeep(432, 300, 0.1, 'sine');
}
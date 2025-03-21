import React, { useState, useEffect } from 'react';

interface FrequencyExplorerMascotProps {
  isActive: boolean;
  hasAngelicFrequency: boolean;
  currentFrequency: number;
  isDemoMode?: boolean;
  isPlayingSound?: boolean;
}

export function FrequencyExplorerMascot({ 
  isActive,
  hasAngelicFrequency,
  currentFrequency,
  isDemoMode = false,
  isPlayingSound = false
}: FrequencyExplorerMascotProps) {
  const [mascotState, setMascotState] = useState<'idle' | 'searching' | 'excited' | 'dancing' | 'listening'>('idle');
  const [mascotMessage, setMascotMessage] = useState('');
  const [showMessage, setShowMessage] = useState(false);
  const [blinkCounter, setBlinkCounter] = useState(0);
  
  // Randomly blink the mascot's eyes every few seconds
  useEffect(() => {
    const blinkInterval = setInterval(() => {
      setBlinkCounter(prev => prev + 1);
      setTimeout(() => setBlinkCounter(0), 150); // Eyes closed for 150ms
    }, 3000 + Math.random() * 4000); // Random interval between 3-7 seconds
    
    return () => clearInterval(blinkInterval);
  }, []);

  // Update mascot state based on detector status
  useEffect(() => {
    if (isPlayingSound) {
      setMascotState('dancing');
      setMascotMessage("I'm playing this frequency now! How does it sound to you?");
    } else if (!isActive) {
      setMascotState('idle');
      setMascotMessage("Hi! I'm Echo the Frequency Explorer. Activate the detector to start our adventure!");
    } else if (hasAngelicFrequency) {
      setMascotState('excited');
      if (isDemoMode) {
        setMascotMessage("This is an angelic frequency! Can you feel the vibration at 432Hz? Some say it resonates with the universe!");
      } else {
        const messages = [
          `Wow! We found an angelic frequency at ${Math.round(currentFrequency)}Hz! This is amazing!`,
          `${Math.round(currentFrequency)}Hz detected! This frequency has special healing properties!`,
          `Incredible! ${Math.round(currentFrequency)}Hz is a sacred frequency used in ancient healing!`
        ];
        setMascotMessage(messages[Math.floor(Math.random() * messages.length)]);
      }
    } else {
      setMascotState('searching');
      if (currentFrequency > 0) {
        if (Math.abs(currentFrequency - 432) < 15 || 
            Math.abs(currentFrequency - 528) < 15 ||
            Math.abs(currentFrequency - 639) < 15 || 
            Math.abs(currentFrequency - 741) < 15 ||
            Math.abs(currentFrequency - 963) < 15) {
          // Getting close to an angelic frequency
          setMascotMessage(`Ooh! ${Math.round(currentFrequency)}Hz is very close to an angelic frequency! Keep going!`);
        } else {
          setMascotMessage(`I'm detecting ${Math.round(currentFrequency)}Hz. Let's keep exploring!`);
        }
      } else {
        setMascotMessage("I'm listening for frequencies... make some sound!");
      }
    }
    
    // Show the message when state changes
    setShowMessage(true);
    const timer = setTimeout(() => {
      setShowMessage(false);
    }, 5000); // Hide message after 5 seconds
    
    return () => clearTimeout(timer);
  }, [isActive, hasAngelicFrequency, currentFrequency, isDemoMode, isPlayingSound]);
  
  // Show message on mascot click with fun random facts
  const handleMascotClick = () => {
    // Fun facts about frequencies and sound
    const funFacts = [
      "Did you know? The 432Hz frequency is said to be mathematically consistent with the patterns of the universe!",
      "Sound healing has been used for thousands of years in various cultures!",
      "The Earth itself has a frequency called the Schumann Resonance - about 7.83Hz!",
      "Try humming at 528Hz, the 'love frequency'! It's believed to have healing properties.",
      "Some say 963Hz is the frequency of divine consciousness and connects us to higher spiritual realms!",
      "In ancient Greece, Pythagoras used sound frequencies for healing and emotional balance!",
      "The 639Hz frequency is associated with harmonious relationships and connection!",
      "Try the sequence 432 → 528 → 639 → 741 → 963 for a full frequency journey!",
      "The sounds we hear can affect our brainwaves and change our mood and energy levels!",
      "I'm Echo, your frequency guide! I can detect sounds from 20Hz to 20,000Hz - the human hearing range!"
    ];
    
    // Pick a random fact
    setMascotMessage(funFacts[Math.floor(Math.random() * funFacts.length)]);
    setShowMessage(true);
    
    const timer = setTimeout(() => {
      setShowMessage(false);
    }, 7000); // Longer display for fun facts
    
    return () => clearTimeout(timer);
  };

  return (
    <div className="fixed bottom-4 right-4 flex items-end">
      {/* Speech bubble */}
      {showMessage && (
        <div className="mb-2 mr-4 max-w-xs bg-white text-gray-800 p-3 rounded-lg rounded-br-none shadow-lg transition-opacity animate-fade-in">
          <p className="text-sm">{mascotMessage}</p>
          <div className="absolute right-0 bottom-0 w-4 h-4 bg-white transform translate-x-1/2 rotate-45"></div>
        </div>
      )}
      
      {/* Mascot SVG */}
      <div 
        onClick={handleMascotClick}
        className="cursor-pointer transform hover:scale-105 transition-transform"
      >
        <svg
          width="110"
          height="120"
          viewBox="0 0 110 120"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={`
            drop-shadow-lg
            ${mascotState === 'idle' ? 'animate-float' : ''}
            ${mascotState === 'searching' ? 'animate-pulse' : ''}
            ${mascotState === 'excited' ? 'animate-bounce' : ''}
            ${mascotState === 'dancing' ? 'animate-dance' : ''}
            ${mascotState === 'listening' ? 'animate-head-bob' : ''}
          `}
        >
          {/* Body - sound wave shaped character */}
          <ellipse cx="55" cy="65" rx="40" ry="45" fill="#4ADE80" />
          
          {/* Sound wave rings - only show when active */}
          {isActive && (
            <>
              <circle 
                cx="55" 
                cy="65" 
                r="48" 
                stroke="#4ADE80" 
                strokeWidth="2"
                strokeDasharray="4 4"
                opacity="0.7"
                className="animate-ping-slow"
              />
              <circle 
                cx="55" 
                cy="65" 
                r="55" 
                stroke="#4ADE80" 
                strokeWidth="2"
                strokeDasharray="4 4"
                opacity="0.4"
                className="animate-ping-slow-delayed"
              />
            </>
          )}
          
          {/* Face - Eyes that blink */}
          {blinkCounter > 0 ? (
            // Closed eyes when blinking
            <>
              <path d="M40 55 Q45 52 50 55" stroke="white" strokeWidth="2" fill="none" /> {/* Left eye closed */}
              <path d="M60 55 Q65 52 70 55" stroke="white" strokeWidth="2" fill="none" /> {/* Right eye closed */}
            </>
          ) : (
            // Open eyes
            <>
              <circle cx="45" cy="55" r="5" fill="white" /> {/* Left eye */}
              <circle cx="65" cy="55" r="5" fill="white" /> {/* Right eye */}
              
              {/* Eye pupils that move based on state */}
              <circle 
                cx={mascotState === 'excited' ? 47 : (mascotState === 'searching' ? 46 : 45)} 
                cy={mascotState === 'excited' ? 53 : 55} 
                r="2.5" 
                fill="black" 
              /> {/* Left pupil */}
              <circle 
                cx={mascotState === 'excited' ? 67 : (mascotState === 'searching' ? 66 : 65)} 
                cy={mascotState === 'excited' ? 53 : 55} 
                r="2.5" 
                fill="black" 
              /> {/* Right pupil */}
            </>
          )}
          
          {/* Different mouth based on state */}
          {mascotState === 'idle' && (
            <path d="M45 75 Q55 80 65 75" stroke="white" strokeWidth="2" fill="none" />
          )}
          {mascotState === 'searching' && (
            <circle cx="55" cy="75" r="5" fill="white" />
          )}
          {mascotState === 'excited' && (
            <path d="M40 75 Q55 85 70 75" stroke="white" strokeWidth="3" fill="white" />
          )}
          {mascotState === 'dancing' && (
            <path d="M40 75 Q55 72 70 75 Q55 78 40 75" stroke="white" strokeWidth="2" fill="white" />
          )}
          {mascotState === 'listening' && (
            <path d="M45 75 L65 75" stroke="white" strokeWidth="2" />
          )}
          
          {/* Antenna with frequency pulse */}
          <line x1="55" y1="20" x2="55" y2="35" stroke="#9333EA" strokeWidth="2" />
          <circle cx="55" cy="15" r="5" fill="#9333EA" className={hasAngelicFrequency ? 'animate-pulse' : ''} />
          
          {/* Headphones */}
          <path d="M35 45 C25 45 25 60 25 65" stroke="#9333EA" strokeWidth="3" fill="none" />
          <path d="M75 45 C85 45 85 60 85 65" stroke="#9333EA" strokeWidth="3" fill="none" />
          <rect x="20" y="60" width="10" height="15" rx="5" fill="#9333EA" />
          <rect x="80" y="60" width="10" height="15" rx="5" fill="#9333EA" />
        </svg>
      </div>
    </div>
  );
}
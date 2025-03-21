import React, { useState, useEffect } from 'react';

interface FrequencyExplorerMascotProps {
  isActive: boolean;
  hasAngelicFrequency: boolean;
  currentFrequency: number;
  isDemoMode?: boolean;
}

export function FrequencyExplorerMascot({ 
  isActive,
  hasAngelicFrequency,
  currentFrequency,
  isDemoMode = false
}: FrequencyExplorerMascotProps) {
  const [mascotState, setMascotState] = useState<'idle' | 'searching' | 'excited'>('idle');
  const [mascotMessage, setMascotMessage] = useState('');
  const [showMessage, setShowMessage] = useState(false);

  // Update mascot state based on detector status
  useEffect(() => {
    if (!isActive) {
      setMascotState('idle');
      setMascotMessage("Hi! I'm Echo the Frequency Explorer. Activate the detector to start our adventure!");
    } else if (hasAngelicFrequency) {
      setMascotState('excited');
      if (isDemoMode) {
        setMascotMessage("This is an angelic frequency! Can you feel the vibration at 432Hz?");
      } else {
        setMascotMessage(`Wow! We found an angelic frequency at ${Math.round(currentFrequency)}Hz! This is amazing!`);
      }
    } else {
      setMascotState('searching');
      if (currentFrequency > 0) {
        setMascotMessage(`I'm detecting ${Math.round(currentFrequency)}Hz. Let's keep exploring!`);
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
  }, [isActive, hasAngelicFrequency, currentFrequency, isDemoMode]);
  
  // Show message on mascot click
  const handleMascotClick = () => {
    setShowMessage(true);
    const timer = setTimeout(() => {
      setShowMessage(false);
    }, 5000);
    
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
          
          {/* Face */}
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
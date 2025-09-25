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
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [blinkCounter, setBlinkCounter] = useState(0);
  
  // Randomly blink the mascot's eyes every few seconds
  useEffect(() => {
    // First-run onboarding (localStorage gate)
    const seen = typeof window !== 'undefined' && localStorage.getItem('aw_onboarded');
    if (!seen) {
      setShowOnboarding(true);
    }

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
        // More detailed and varied angelic frequency messages
        const roundedFreq = Math.round(currentFrequency);
        let messages;
        
        // Custom messages based on which angelic frequency was detected
        if (Math.abs(roundedFreq - 432) < 15) {
          messages = [
            `Wow! We found the sacred 432Hz frequency! This aligns with the heartbeat of the universe!`,
            `432Hz detected! Did you know Mozart tuned his instruments to this exact frequency?`,
            `Amazing! 432Hz is mathematically related to the Fibonacci sequence and sacred geometry!`,
            `432Hz located! This frequency helps release emotional blockages and expand consciousness!`,
            `We found Earth's natural tuning frequency - 432Hz! Feel how it resonates peacefully?`
          ];
        } else if (Math.abs(roundedFreq - 528) < 15) {
          messages = [
            `The Miracle frequency - 528Hz! It's known for DNA repair and transformation!`,
            `528Hz detected! This is the exact frequency used to repair damaged DNA in scientific studies!`,
            `The Love frequency - 528Hz! It's said to attract miracles and positive transformation!`,
            `We found 528Hz! This frequency is mathematically significant in sacred structures worldwide!`,
            `528Hz located! Ancient healing temples were designed to amplify this exact frequency!`
          ];
        } else if (Math.abs(roundedFreq - 639) < 15) {
          messages = [
            `639Hz detected! This frequency harmonizes relationships and encourages clear communication!`,
            `We found the 639Hz frequency! It's associated with the heart chakra and emotional balance!`,
            `639Hz located! Ancient monks used this tone to create harmony between mind and body!`,
            `The Connection frequency - 639Hz! It helps balance love and understanding in relationships!`,
            `639Hz discovered! This tone can help strengthen connections with others!`
          ];
        } else if (Math.abs(roundedFreq - 741) < 15) {
          messages = [
            `741Hz detected! This frequency helps with solving problems and expressing yourself!`,
            `The Awakening frequency - 741Hz! It helps cleanse the body from toxins!`,
            `741Hz located! This tone activates the third eye for intuition and expression!`,
            `We found 741Hz! Sound healers use this to help people express their truth!`,
            `741Hz discovered! This frequency can help clear your mind when feeling confused!`
          ];
        } else if (Math.abs(roundedFreq - 963) < 15) {
          messages = [
            `963Hz detected! This is connected to the light frequency and cosmic consciousness!`,
            `The Frequency of Gods - 963Hz! It's said to connect us to the divine energy field!`,
            `963Hz located! This tone awakens the pineal gland and cosmic awareness!`,
            `We found 963Hz! Ancient temples were designed to channel this divine frequency!`,
            `963Hz discovered! This is the highest frequency in the sacred Solfeggio scale!`
          ];
        } else {
          // General angelic frequency messages
          messages = [
            `Wow! We found an angelic frequency at ${roundedFreq}Hz! This is amazing!`,
            `${roundedFreq}Hz detected! This frequency has special healing properties!`,
            `Incredible! ${roundedFreq}Hz is a sacred frequency used in ancient healing!`,
            `${roundedFreq}Hz discovered! You've found a frequency that resonates with cosmic energy!`,
            `We found a healing vibration at ${roundedFreq}Hz! These special frequencies appear throughout nature!`
          ];
        }
        
        setMascotMessage(messages[Math.floor(Math.random() * messages.length)]);
      }
    } else {
      // When active but not detecting anything significant, make Echo bounce and encourage sound
      if (isActive && currentFrequency <= 0) {
        setMascotState('searching');
        // Expanded encouragement messages for making noise
        const noiseMessages = [
          "Make some noise! Try humming, whistling, or clapping!",
          "I need sound to detect frequencies! Try speaking or singing!",
          "Try making different sounds - I'll analyze them for you!",
          "Louder please! I'm listening for special frequencies!",
          "Talk, sing, or play some music - I'll detect the frequencies!",
          "Try whistling a tune! Different notes have different frequencies!",
          "How about humming at different pitches? I'll track the frequencies!",
          "Can you try tapping on different surfaces? Each creates unique frequencies!",
          "Ring a bell or strike a glass if you have one nearby!",
          "Try playing musical tones from 432Hz to 963Hz for best results!",
          "I'm listening for special vibrations! Any sound will help me analyze frequencies!",
          "Let's find some angelic frequencies! Try making gentle humming sounds...",
          "I need audio input to find special frequencies! Anything works - even finger snaps!"
        ];
        setMascotMessage(noiseMessages[Math.floor(Math.random() * noiseMessages.length)]);
      } 
      // When detecting a frequency, show more excitement
      else if (currentFrequency > 0) {
        // Make Echo bounce when detecting frequencies
        setMascotState('dancing');
        
        const roundedFreq = Math.round(currentFrequency);
        // Expanded messages about detected frequencies
        if (Math.abs(currentFrequency - 432) < 15 || 
            Math.abs(currentFrequency - 528) < 15 ||
            Math.abs(currentFrequency - 639) < 15 || 
            Math.abs(currentFrequency - 741) < 15 ||
            Math.abs(currentFrequency - 963) < 15) {
          // Getting close to an angelic frequency - more varied messages
          const closeMessages = [
            `Ooh! ${roundedFreq}Hz is very close to an angelic frequency! Keep going!`,
            `Almost there! ${roundedFreq}Hz is near a sacred frequency! Try adjusting a bit!`,
            `${roundedFreq}Hz detected! You're very close to one of the healing frequencies!`,
            `So close! ${roundedFreq}Hz is just off an angelic tone! Try again!`,
            `Nearly perfect! ${roundedFreq}Hz is approaching a frequency used in ancient healing!`
          ];
          setMascotMessage(closeMessages[Math.floor(Math.random() * closeMessages.length)]);
        } else {
          // Regular frequency detection - more informative messages
          const rangeDescription = currentFrequency < 100 ? "low" : 
                                 (currentFrequency < 500 ? "mid" : "high");
          
          const frequencyMessages = [
            `I'm detecting ${roundedFreq}Hz. Let's keep exploring!`,
            `${roundedFreq}Hz found! This is in the ${rangeDescription} frequency range.`,
            `Interesting! ${roundedFreq}Hz detected. Every sound has its own unique frequency signature!`,
            `${roundedFreq}Hz registered! Different materials resonate with different frequencies.`,
            `I'm picking up ${roundedFreq}Hz. Human hearing ranges from 20Hz to 20,000Hz!`,
            `${roundedFreq}Hz found! Try making a slightly ${currentFrequency < 500 ? "higher" : "lower"} pitch sound now!`,
            `That's ${roundedFreq}Hz! ${currentFrequency > 600 && currentFrequency < 900 ? "You're in the angelic frequency range!" : "Keep exploring different sounds!"}`,
            `${roundedFreq}Hz detected! Did you know different emotions respond to different frequencies?`,
            `Interesting vibration at ${roundedFreq}Hz! Sound travels at 343 meters per second in air!`
          ];
          setMascotMessage(frequencyMessages[Math.floor(Math.random() * frequencyMessages.length)]);
        }
      } else {
        setMascotState('searching');
        setMascotMessage("I'm listening for frequencies... make some sound!");
      }
    }
    
    // Show the message when state changes
    setShowMessage(true);
    
    // Only hide the message after a timeout if not actively detecting
    // This keeps encouragement messages visible while the detector is active
    let timer: NodeJS.Timeout;
    if (!isActive || currentFrequency > 0) {
      timer = setTimeout(() => {
        setShowMessage(false);
      }, 8000); // Hide message after 8 seconds for more reading time
    }
    
    return () => clearTimeout(timer);
  }, [isActive, hasAngelicFrequency, currentFrequency, isDemoMode, isPlayingSound]);
  
  // Show message on mascot click with fun random facts
  const handleMascotClick = () => {
    // Fun facts and stories about frequencies and sound
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
      "I'm Echo, your frequency guide! I can detect sounds from 20Hz to 20,000Hz - the human hearing range!",
      
      // Historical stories
      "In 1939, before WWII began, a movement tried to change the standard tuning from 440Hz to 432Hz, believing it would create more peaceful harmony!",
      "Legend has it that Tibetan monks could break down stone walls using precise frequency chanting!",
      "In the 1960s, Dr. Hans Jenny showed that sounds could create geometric patterns in materials - called Cymatics!",
      "Ancient Egyptian temples were designed with acoustic properties to amplify specific healing frequencies!",
      
      // Scientific facts
      "In hospitals, music at 440Hz is used to reduce anxiety before surgery - it's scientifically proven to calm nerves!",
      "Sound therapists use frequencies between 30Hz and 120Hz to help relieve chronic pain conditions!",
      "NASA discovered that black holes emit sounds - the lowest B-flat ever detected, about 57 octaves below middle C!",
      "When you hear music, your brain releases dopamine - the same chemical released when eating chocolate!",
      "Each organ in your body resonates with a specific frequency. The heart is around 72Hz!",
      
      // Cultural stories
      "In ancient China, precise 5-tone scales were composed to balance the five elements: water, fire, earth, metal and wood!",
      "Native American healing ceremonies use specific drum frequencies - typically between 4-7Hz - to induce trance states!",
      "In Islamic architecture, the muqarnas (honeycomb vaults) are designed to create specific frequency resonances for prayer!",
      "The famous 'Om' chant frequency measures around 432Hz, connecting many spiritual practices!",
      
      // Phenomena stories
      "Opera singers can shatter glass with their voice when they hit the resonant frequency of the glass - usually above 1000Hz!",
      "The lowest note on a piano is 27.5Hz, but some pipe organs can play as low as 8Hz - so deep you feel it rather than hear it!",
      "Whale songs can travel thousands of miles through ocean water because water conducts sound frequencies better than air!",
      "Infrasound (below 20Hz) can cause feelings of anxiety and awe - some haunted locations have natural infrasound!",
      
      // Practical applications
      "Ultrasound frequencies (above 20kHz) are used to clean jewelry by creating microscopic bubbles that remove dirt!",
      "The beach has a naturally calming sound frequency range between 1-10Hz that helps synchronize our brainwaves!",
      "Musicians tune to A=440Hz today, but Bach and Mozart composed for instruments tuned to A=432Hz!",
      "Some farmers use specific sound frequencies to increase crop yields by up to 50%!"
    ];
    
    // Pick a random fact
    setMascotMessage(funFacts[Math.floor(Math.random() * funFacts.length)]);
    setShowMessage(true);
    
    const timer = setTimeout(() => {
      setShowMessage(false);
    }, 12000); // Much longer display for fun facts and stories
    
    return () => clearTimeout(timer);
  };

  return (
    <div className="fixed bottom-16 right-4 flex items-end">
      {showOnboarding && (
        <div className="fixed inset-0 z-30 bg-black/60 flex items-center justify-center px-4">
          <div className="max-w-lg w-full bg-gray-900 border border-green-800/40 rounded-xl shadow-2xl p-6 relative">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-green-400">✧</span>
              <h2 className="text-lg font-semibold text-white">Welcome to AngelicWaves</h2>
            </div>
            <ol className="list-decimal pl-5 space-y-2 text-sm text-gray-200">
              <li>Allow microphone access so we can detect live frequencies.</li>
              <li>Toggle the detector at the top-right to start/stop listening.</li>
              <li>Watch the visualizer and look for angelic tones (432–963Hz).</li>
              <li>Use the bottom dock to open History and Calculations anytime.</li>
            </ol>
            <div className="mt-4 flex justify-end gap-2">
              <button
                className="px-3 py-1.5 text-sm rounded-md bg-gray-700 hover:bg-gray-600 text-gray-200"
                onClick={() => setShowOnboarding(false)}
              >
                Maybe later
              </button>
              <button
                className="px-3 py-1.5 text-sm rounded-md bg-green-600 hover:bg-green-700 text-white"
                onClick={() => {
                  setShowOnboarding(false);
                  try { localStorage.setItem('aw_onboarded', '1'); } catch {}
                }}
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Speech bubble */}
      {showMessage && (
        <div className="mb-2 mr-4 max-w-xs bg-white/95 text-gray-800 p-4 rounded-lg rounded-br-none shadow-xl transition-opacity animate-fade-in border border-green-300/40">
          <p className="text-sm leading-relaxed">{mascotMessage}</p>
          <div className="absolute right-0 bottom-0 w-4 h-4 bg-white border-r border-b border-green-300/40 transform translate-x-1/2 rotate-45"></div>
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
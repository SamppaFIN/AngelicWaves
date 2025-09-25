import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PlayCircle } from 'lucide-react';
import { playBeep } from '../lib/soundEffects';

// Rock music references and their frequencies
const rockReferences = [
  { artist: 'The Beatles', song: 'A Day In The Life', frequency: 'A at 432Hz', notes: 'Used in final chord'},
  { artist: 'Led Zeppelin', song: 'Kashmir', frequency: '432Hz tuning', notes: 'Rumored to be recorded in this tuning'},
  { artist: 'Pink Floyd', song: 'Great Gig in the Sky', frequency: '432Hz resonance', notes: 'Vocal harmonics near this frequency'},
  { artist: 'Tool', song: 'Lateralus', frequency: '432Hz and Fibonacci', notes: 'Incorporated sacred geometry in music'},
  { artist: 'Jimi Hendrix', song: 'Various', frequency: '432Hz tuning', notes: 'Allegedly preferred this tuning'},
  { artist: 'Nirvana', song: 'Lithium', frequency: '528Hz elements', notes: 'Contains healing frequency components in distortion'},
  { artist: 'Bob Marley', song: 'Three Little Birds', frequency: '432Hz variants', notes: 'Some remasters use this frequency'},
  { artist: 'A Perfect Circle', song: 'The Noose', frequency: '528Hz themes', notes: 'Contains frequency healing concepts'}
];

// Sound healing projects
const soundHealingProjects = [
  { name: 'Solfeggio Frequencies Project', frequencies: '396Hz, 417Hz, 528Hz, 639Hz, 741Hz, 852Hz', description: 'Research on ancient Solfeggio frequencies and healing applications' },
  { name: 'Sound Healing Institute', frequencies: '432Hz, 528Hz', description: 'Studies on cymatics and vibrational medicine' },
  { name: 'Schumann Resonance Music', frequencies: '7.83Hz and harmonics', description: 'Earth\'s natural electromagnetic field frequency in music' },
  { name: 'Tibetan Singing Bowl Therapy', frequencies: '432Hz, 528Hz, 639Hz', description: 'Ancient sound therapy techniques with specific metal bowls' },
  { name: 'Binaural Beats Research', frequencies: 'Delta, Theta, Alpha, Beta, Gamma waves', description: 'Brain entrainment frequencies for meditation and focus' },
  { name: 'Finnish Fysioakustinen Tutkimus', frequencies: '27-113Hz', description: 'Research on vibroacoustic therapy developed in Finland' },
  { name: 'Cymatic Therapy Foundation', frequencies: 'Tissue-specific resonant frequencies', description: 'Research on frequencies that cause different tissues to vibrate' },
  { name: 'NASA Sound Healing Research', frequencies: '528Hz', description: 'Studies on frequency effects on DNA repair and cell growth' },
  { name: 'Royal Academy of Music Resonance Project', frequencies: '432Hz vs 440Hz', description: 'Comparative research on standard vs alternative tuning' },
  { name: 'HeartMath Institute', frequencies: 'Heart coherence frequencies', description: 'Research on frequencies that synchronize heart and brain activity' }
];

// Religious/spiritual references to frequencies
const religiousReferences = [
  { tradition: 'Christianity', reference: 'Gregorian Chants', frequency: '528Hz', description: 'Said to be used in early Christian music for spiritual connection' },
  { tradition: 'Hinduism', reference: 'Om Chanting', frequency: '432Hz', description: 'The sacred syllable "Om" vibrates at approximately this frequency' },
  { tradition: 'Buddhism', reference: 'Tibetan Bowls', frequency: '396Hz, 639Hz', description: 'Used in meditation practices to clear energy blockages' },
  { tradition: 'Judaism', reference: 'Shofar Horn', frequency: '~528Hz', description: 'The ancient horn produces tones near healing frequencies' },
  { tradition: 'Islam', reference: 'Adhan (Call to Prayer)', frequency: '~741Hz', description: 'Certain calls contain harmonic frequencies associated with awakening' },
  { tradition: 'Native American', reference: 'Shamanic Drums', frequency: '4-7Hz', description: 'Theta wave drumming induces trance states for healing' },
  { tradition: 'Ancient Egypt', reference: 'Isis Temple', frequency: '432Hz', description: 'Chambers designed with mathematical ratios supporting this resonance' },
  { tradition: 'Vedic Tradition', reference: 'Sanskrit Mantras', frequency: '432Hz cycle', description: 'Ancient chants often based on natural frequency cycles' },
  { tradition: 'Finnish Shamanism', reference: 'Jouhikko Playing', frequency: 'Natural harmonics', description: 'Ancient Finnish bowed lyre instrument used in spiritual rituals' },
  { tradition: 'Celtic Traditions', reference: 'Bardic Harps', frequency: '432Hz variants', description: 'Instruments tuned to natural harmonics to connect with nature spirits' },
  { tradition: 'Sufi Mysticism', reference: 'Whirling Dervish', frequency: '528Hz resonance', description: 'Spinning meditation practice creating frequency alignment' },
  { tradition: 'Taoist Practices', reference: 'Qigong Toning', frequency: 'Five Element frequencies', description: 'Specific tones assigned to organ systems for healing' },
  { tradition: 'Siberian Shamanism', reference: 'Jaw Harp', frequency: 'Overtone series', description: 'Instrument creating harmonic series to communicate with spirits' }
];

// Content for the history tab
const frequencyHistory = `
The concept of special or "angelic" frequencies has a rich history dating back thousands of years:

- Ancient Sumerians used a 6-tone scale based on 432Hz and believed certain tones could contact divine forces
- Pythagoras (570-495 BCE) identified mathematical ratios in music as healing and created the "music of the spheres" theory
- Ancient Egyptian instruments were tuned to 432Hz according to some researchers, possibly used in ceremonial healing
- The "Schumann Resonance" (7.83Hz) is Earth's natural electromagnetic frequency, discovered in 1952
- Gregorian chants often utilized frequencies in the 396-963Hz range for heightened spiritual communion
- In 1939, Nazi propaganda minister Joseph Goebbels standardized A=440Hz tuning (replacing A=432Hz), with some theorists claiming it was to create societal tension
- Nikola Tesla emphasized 3-6-9 as key vibrational numbers, stated "If you only knew the magnificence of the 3, 6 and 9, then you would have a key to the universe"
- John Lennon and other artists experimented with alternative tunings in the 1960s-70s to induce specific emotional states
- The modern sound healing movement emerged in the 1970s with frequencies like 528Hz (the "love frequency") and 639Hz (connection)
- Dr. Leonard Horowitz popularized the "Solfeggio frequencies" in the 1990s, claiming they were ancient healing tones
- Research at Karolinska Institutet (Sweden) showed specific frequencies can affect cellular regeneration and nervous system function
- Modern music industry primarily uses 440Hz standard tuning, though some artists choose 432Hz for perceived harmonic quality
- The 2019 Nobel Prize in Physiology recognized how cells sense oxygen via specific frequency vibrations
`;

// Intertextual and literary references
const literaryReferences = [
  { source: "Bible - Book of Joshua", reference: "Walls of Jericho fell to trumpet sounds", frequency: "Unknown resonant frequency", notes: "Sound waves causing physical destruction" },
  { source: "Greek Mythology", reference: "Orpheus' Lyre", frequency: "432Hz correspondence", notes: "Music so perfect it affected the physical world" },
  { source: "Shakespeare - The Tempest", reference: "The isle is full of noises, sounds, and sweet airs", frequency: "Ethereal frequencies", notes: "Divine musical harmony causing transformation" },
  { source: "Vedic Texts", reference: "OM - The primordial sound", frequency: "432Hz", notes: "The first vibration from which universe manifested" },
  { source: "Norse Mythology", reference: "Heimdall's Gjallarhorn", frequency: "Cosmic resonance", notes: "Horn that signals Ragnarök with specific vibration" },
  { source: "Chinese Literature", reference: "The Yellow Bell", frequency: "Cosmic tone of 432Hz", notes: "Perfect pitch from which all music derives" },
  { source: "Finnegans Wake - James Joyce", reference: "The fall of language", frequency: "Vibrational language", notes: "Words as frequency vibrations creating reality" },
  { source: "Kalevala - Finnish Epic", reference: "Väinämöinen's Kantele", frequency: "Natural harmonics", notes: "Instrument created from pike jawbone that controls natural elements" },
  { source: "Hans Christian Andersen", reference: "The Bell", frequency: "Divine frequency", notes: "Mysterious bell sound in the forest representing spiritual enlightenment" },
  { source: "Dante's Divine Comedy", reference: "Music of the Spheres", frequency: "Planetary vibrations", notes: "Each celestial sphere produces unique vibrational tone" },
  { source: "Ancient Karelian Runes", reference: "Singing competitions", frequency: "Voice frequencies", notes: "Magic through precise vibrational sounds in song duels" }
];

  // Additional external references (condensed summaries)
  const externalReferences = [
    { title: 'Cymatics (Hans Jenny)', note: 'Visual patterns formed by vibrating media across frequencies.' },
    { title: 'Schumann Resonances', note: 'Earth-ionosphere cavity standing waves, fundamental ~7.83Hz.' },
    { title: 'Binaural Beats', note: 'Perceived beats from two tones; explored for entrainment effects.' },
    { title: 'Vibroacoustic Therapy', note: 'Low-frequency sound applied to the body; clinical relaxation outcomes.' },
    { title: '432Hz vs 440Hz Tuning', note: 'Alternate tuning claims; evidence mixed, cultural preference notable.' }
  ];

// Physical Acoustic Therapy information (Fysioakustinen hoito)
// Based on information from https://www.terapiapalvelutuuli.com/fysioakustinen-hoito
const acousticTherapyInfo = {
  title: "Fysioakustinen hoito (Physical Acoustic Therapy)",
  description: `
    Physical Acoustic Therapy (FAT) is a Finnish innovation developed by researchers in the 1980s.
    It uses precisely calibrated sound vibrations to positively affect the body's cells and functions.
    The therapy utilizes a special chair or bed that transmits low-frequency sound waves (27-113 Hz)
    directly to the body's tissues, muscles and circulatory system.
  `,
  benefits: [
    "Relieves muscle tension and pain",
    "Improves circulation and metabolism",
    "Accelerates recovery from physical exertion",
    "Reduces stress and anxiety",
    "Improves sleep quality",
    "Supports physical and mental rehabilitation"
  ],
  frequencies: [
    { hz: 27, purpose: "Deep relaxation, stress reduction" },
    { hz: 40, purpose: "Pain relief, tissue relaxation" },
    { hz: 52, purpose: "Muscle recovery, improved circulation" },
    { hz: 68, purpose: "Metabolism stimulation" },
    { hz: 86, purpose: "Circulation enhancement" },
    { hz: 98, purpose: "Tissue oxygenation" },
    { hz: 113, purpose: "Energy and vitality" }
  ]
};

export function FrequencyHistory() {
  const [activeTab, setActiveTab] = useState('history');
  
  // Function to play a specific frequency
  const playFrequency = (frequency: number) => {
    playBeep(frequency, 1.5, 0.5);
  };
  
  return (
    <div className="bg-gray-800/70 p-4 rounded-lg mb-6">
      <h3 className="text-green-400 font-medium mb-3">Music Frequency History & References</h3>
      <div className="border border-green-900/30 rounded-md p-3 bg-gray-900/40 mb-4">
        <p className="text-sm text-gray-300">A curated timeline and cross-cultural references for frequency theories. Visual breaks highlight eras and domains.</p>
      </div>
      
      <Tabs defaultValue="history" onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 md:grid-cols-6 mb-4">
          <TabsTrigger value="history">History</TabsTrigger>
          <TabsTrigger value="religious">Religious</TabsTrigger>
          <TabsTrigger value="literary">Literary</TabsTrigger>
          <TabsTrigger value="acoustic">Therapy</TabsTrigger>
          <TabsTrigger value="rock">Rock</TabsTrigger>
          <TabsTrigger value="projects">Projects</TabsTrigger>
        </TabsList>
        
        <TabsContent value="history" className="space-y-4">
          <div className="space-y-4">
            <div className="bg-gray-900/60 border border-gray-700 rounded-md p-3">
              <div className="text-xs uppercase tracking-wide text-gray-400 mb-1">Ancient to Classical</div>
              <div className="text-sm text-gray-300 whitespace-pre-line">{frequencyHistory.split('\n').slice(0,7).join('\n')}</div>
            </div>
            <div className="flex items-center justify-center">
              <div className="h-px w-24 bg-gradient-to-r from-transparent via-green-500 to-transparent opacity-50" />
            </div>
            <div className="bg-gray-900/60 border border-gray-700 rounded-md p-3">
              <div className="text-xs uppercase tracking-wide text-gray-400 mb-1">Modern Era</div>
              <div className="text-sm text-gray-300 whitespace-pre-line">{frequencyHistory.split('\n').slice(7,14).join('\n')}</div>
            </div>
            <div className="flex items-center justify-center">
              <div className="h-px w-24 bg-gradient-to-r from-transparent via-purple-500 to-transparent opacity-50" />
            </div>
            <div className="bg-gray-900/60 border border-gray-700 rounded-md p-3">
              <div className="text-xs uppercase tracking-wide text-gray-400 mb-1">Contemporary Research</div>
              <div className="text-sm text-gray-300 whitespace-pre-line">{frequencyHistory.split('\n').slice(14).join('\n')}</div>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="rock">
          <div className="text-sm text-gray-300">
            <p className="mb-3">Many rock musicians have explored alternative frequencies in their music:</p>
            
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-gray-600">
                    <th className="text-left py-2 px-2 text-green-400">Artist</th>
                    <th className="text-left py-2 px-2 text-green-400">Song</th>
                    <th className="text-left py-2 px-2 text-green-400">Frequency</th>
                    <th className="text-left py-2 px-2 text-green-400">Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {rockReferences.map((ref, index) => (
                    <tr key={index} className="border-b border-gray-700">
                      <td className="py-2 px-2 font-medium">{ref.artist}</td>
                      <td className="py-2 px-2 italic">{ref.song}</td>
                      <td className="py-2 px-2">{ref.frequency}</td>
                      <td className="py-2 px-2 text-gray-400">{ref.notes}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-3 text-xs text-gray-400">
              Note: Some frequency claims are debated among musicologists and sound engineers.
            </p>
          </div>
        </TabsContent>
        
        <TabsContent value="religious">
          <div className="text-sm text-gray-300">
            <p className="mb-3">Various religious and spiritual traditions have incorporated specific frequencies:</p>
            
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-gray-600">
                    <th className="text-left py-2 px-2 text-green-400">Tradition</th>
                    <th className="text-left py-2 px-2 text-green-400">Practice/Reference</th>
                    <th className="text-left py-2 px-2 text-green-400">Frequency</th>
                    <th className="text-left py-2 px-2 text-green-400">Description</th>
                  </tr>
                </thead>
                <tbody>
                  {religiousReferences.map((ref, index) => (
                    <tr key={index} className="border-b border-gray-700">
                      <td className="py-2 px-2 font-medium">{ref.tradition}</td>
                      <td className="py-2 px-2 italic">{ref.reference}</td>
                      <td className="py-2 px-2">{ref.frequency}</td>
                      <td className="py-2 px-2 text-gray-400">{ref.description}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-3 text-xs text-gray-400">
              Note: These associations between spiritual practices and specific frequencies are often based on modern interpretations and explorations.
            </p>
          </div>
        </TabsContent>

        <TabsContent value="literary">
          <div className="text-sm text-gray-300">
            <p className="mb-3">References to the power of sound frequencies in mythology and literature:</p>
            
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-gray-600">
                    <th className="text-left py-2 px-2 text-green-400">Source</th>
                    <th className="text-left py-2 px-2 text-green-400">Reference</th>
                    <th className="text-left py-2 px-2 text-green-400">Frequency</th>
                    <th className="text-left py-2 px-2 text-green-400">Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {literaryReferences.map((ref, index) => (
                    <tr key={index} className="border-b border-gray-700">
                      <td className="py-2 px-2 font-medium">{ref.source}</td>
                      <td className="py-2 px-2 italic">{ref.reference}</td>
                      <td className="py-2 px-2">{ref.frequency}</td>
                      <td className="py-2 px-2 text-gray-400">{ref.notes}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-3 text-xs text-gray-400">
              These literary and mythological references demonstrate humanity's long-standing belief in the transformative power of sound.
            </p>
          </div>
        </TabsContent>
        
        <TabsContent value="acoustic">
          <div className="text-sm text-gray-300">
            <div className="mb-4">
              <h4 className="text-green-400 font-medium text-lg">{acousticTherapyInfo.title}</h4>
              <p className="mt-1 whitespace-pre-line">{acousticTherapyInfo.description}</p>
              
              <div className="mt-4">
                <h5 className="text-green-300 font-medium">Benefits:</h5>
                <ul className="list-disc pl-5 mt-2 space-y-1">
                  {acousticTherapyInfo.benefits.map((benefit, index) => (
                    <li key={index}>{benefit}</li>
                  ))}
                </ul>
              </div>
              
              <div className="mt-6">
                <h5 className="text-green-300 font-medium">Therapeutic Frequencies:</h5>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                  {acousticTherapyInfo.frequencies.map((item, index) => (
                    <div key={index} className="border border-gray-700 bg-gray-800 rounded-md p-3 flex items-center justify-between">
                      <div>
                        <div className="text-purple-300 font-medium">{item.hz} Hz</div>
                        <div className="text-gray-400 text-sm mt-1">{item.purpose}</div>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="ml-2 text-green-400 border-green-400 hover:bg-green-400/10"
                        onClick={() => playFrequency(item.hz)}
                      >
                        <PlayCircle size={16} className="mr-1" />
                        Play
                      </Button>
                    </div>
                  ))}
                </div>
                
                <div className="mt-4 bg-green-900/30 border border-green-800/50 rounded-md p-3">
                  <h5 className="text-green-300 font-medium">Experience All Therapeutic Frequencies</h5>
                  <p className="text-gray-300 text-sm mt-1">
                    Listen to each frequency for 20-30 seconds while focusing on the specific body area you wish to address.
                  </p>
                  <div className="mt-3 flex flex-col sm:flex-row justify-end">
                    <Button 
                      variant="default" 
                      className="bg-green-600 hover:bg-green-700 text-white text-sm sm:text-base"
                      onClick={() => {
                        // Play each frequency in sequence with short delays between
                        acousticTherapyInfo.frequencies.forEach((freq, index) => {
                          setTimeout(() => {
                            playFrequency(freq.hz);
                          }, index * 2000); // 2 second delay between each frequency
                        });
                      }}
                    >
                      <PlayCircle size={16} className="mr-2" />
                      Play All Frequencies
                    </Button>
                  </div>
                </div>
                
                <div className="mt-6 text-xs text-gray-400">
                  <p>Source: <a href="https://www.terapiapalvelutuuli.com/fysioakustinen-hoito" target="_blank" rel="noopener noreferrer" className="text-green-400 hover:underline">Terapiapalvelutuuli.com - Fysioakustinen hoito</a></p>
                  <p className="mt-1">Note: This is a simplified simulation. Actual Physical Acoustic Therapy (FAT) requires specialized equipment and professional guidance.</p>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="projects">
          <div className="text-sm text-gray-300">
            <p className="mb-3">Research and projects focused on beneficial sound frequencies:</p>
            
            <div className="space-y-3">
              {soundHealingProjects.map((project, index) => (
                <div key={index} className="border border-gray-700 rounded p-3">
                  <h4 className="text-green-400 font-medium">{project.name}</h4>
                  <div className="mt-1 text-purple-300 text-xs">{project.frequencies}</div>
                  <p className="mt-1 text-gray-300">{project.description}</p>
                </div>
              ))}
            </div>

            <div className="mt-6">
              <h4 className="text-green-400 font-medium mb-2">External References</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {externalReferences.map((ref, i) => (
                  <div key={i} className="border border-gray-700 rounded p-3 bg-gray-900/50">
                    <div className="text-purple-300 font-medium">{ref.title}</div>
                    <div className="text-gray-300 text-sm mt-1">{ref.note}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
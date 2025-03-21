import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

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
  { name: 'Binaural Beats Research', frequencies: 'Delta, Theta, Alpha, Beta, Gamma waves', description: 'Brain entrainment frequencies for meditation and focus' }
];

// Content for the history tab
const frequencyHistory = `
The concept of special or "angelic" frequencies has a rich history dating back thousands of years:

- Ancient Sumerians used a 6-tone scale based on 432Hz
- Pythagoras (570-495 BCE) identified mathematical ratios in music as healing
- Ancient Egyptian instruments were tuned to 432Hz according to some researchers
- Gregorian chants often utilized frequencies in the 396-963Hz range
- In 1939, Nazi propaganda minister Joseph Goebbels standardized A=440Hz tuning (replacing A=432Hz)
- John Lennon and other artists experimented with alternative tunings in the 1960s-70s
- The modern sound healing movement emerged in the 1970s with frequencies like 528Hz (the "love frequency")
- Dr. Leonard Horowitz popularized the "Solfeggio frequencies" in the 1990s
- Modern music industry primarily uses 440Hz standard tuning, though some artists choose 432Hz
`;

export function FrequencyHistory() {
  const [activeTab, setActiveTab] = useState('history');
  
  return (
    <div className="bg-gray-800/70 p-4 rounded-lg mb-6">
      <h3 className="text-green-400 font-medium mb-3">Music Frequency History & References</h3>
      
      <Tabs defaultValue="history" onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-4">
          <TabsTrigger value="history">Frequency History</TabsTrigger>
          <TabsTrigger value="rock">Rock Music References</TabsTrigger>
          <TabsTrigger value="projects">Sound Healing Projects</TabsTrigger>
        </TabsList>
        
        <TabsContent value="history" className="space-y-4">
          <div className="text-sm text-gray-300 whitespace-pre-line">
            {frequencyHistory}
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
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
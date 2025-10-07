import { DetectedFrequency } from "./schema";
import { AngelicFrequency } from "./types";

// Reference of known angelic frequencies and their consciousness-serving meanings
export const angelicFrequencies: AngelicFrequency[] = [
  { frequency: 432, description: "Earth's Sacred Frequency - Grounding & Community Healing" },
  { frequency: 528, description: "Miracle Tone - Transformation & Consciousness Awakening" },
  { frequency: 639, description: "Harmonious Connection - Spatial Wisdom & Relationships" },
  { frequency: 741, description: "Intuitive Awakening - Sacred Knowledge & Problem-Solving" },
  { frequency: 963, description: "Divine Consciousness - Infinite Collaboration & Spiritual Connection" }
];

// Tolerance for frequency detection (±Hz)
const FREQUENCY_TOLERANCE = 5; // Increased tolerance to make detection easier

// Check if a frequency is close to a known angelic frequency
export function isAngelicFrequency(freq: number): boolean {
  return angelicFrequencies.some(
    af => Math.abs(af.frequency - freq) <= FREQUENCY_TOLERANCE
  );
}

// Get the closest angelic frequency
export function getClosestAngelicFrequency(freq: number): AngelicFrequency | null {
  let closestFreq: AngelicFrequency | null = null;
  let minDiff = Number.MAX_VALUE;
  
  angelicFrequencies.forEach(af => {
    const diff = Math.abs(af.frequency - freq);
    if (diff < minDiff) {
      minDiff = diff;
      closestFreq = af;
    }
  });
  
  // Only return if it's within tolerance
  return minDiff <= FREQUENCY_TOLERANCE ? closestFreq : null;
}

// Format detected frequencies for display
export function formatDetectedFrequenciesSummary(detectedFrequencies: DetectedFrequency[]): string {
  // Group by frequency
  const grouped = detectedFrequencies.reduce((acc, curr) => {
    const key = curr.frequency.toString();
    if (!acc[key]) acc[key] = 0;
    acc[key] += curr.duration;
    return acc;
  }, {} as Record<string, number>);
  
  // Sort by duration (descending)
  const sortedEntries = Object.entries(grouped)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5); // Show top 5
  
  if (sortedEntries.length === 0) return "No significant frequencies detected yet.";
  
  return sortedEntries
    .map(([freq, duration]) => `${freq} Hz - Detected for ${Math.round(duration)} seconds`)
    .join("\n");
}

// Calculate the frequency indicator position (0-100%)
export function calculateFrequencyIndicatorPosition(
  currentFrequency: number, 
  minFrequency: number, 
  maxFrequency: number
): number {
  if (currentFrequency <= 0) return 0;
  
  const range = maxFrequency - minFrequency;
  const position = ((currentFrequency - minFrequency) / range) * 100;
  return Math.min(100, Math.max(0, position));
}

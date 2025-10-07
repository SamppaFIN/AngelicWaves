import { DetectedFrequency, FrequencyReport } from "./schema";

// Mock data for GitHub Pages static deployment
const mockFrequencyReports: FrequencyReport[] = [
  {
    id: 1,
    detectedFrequencies: [
      { frequency: 432, duration: 2.5, timestamp: Date.now() - 10000 },
      { frequency: 528, duration: 1.8, timestamp: Date.now() - 8000 },
    ],
    analysis: "Detected angelic frequencies 432Hz (Earth's frequency) and 528Hz (Miracle tone) indicating a harmonious and healing environment.",
    userNotes: "Beautiful meditation session",
    createdAt: new Date().toISOString(),
    shareId: "demo-share-1",
    isPublic: 1,
  },
  {
    id: 2,
    detectedFrequencies: [
      { frequency: 639, duration: 3.2, timestamp: Date.now() - 5000 },
      { frequency: 741, duration: 2.1, timestamp: Date.now() - 3000 },
    ],
    analysis: "Detected frequencies 639Hz (harmonious relationships) and 741Hz (awakening intuition) suggesting enhanced spiritual connection.",
    userNotes: "Group healing session",
    createdAt: new Date().toISOString(),
    shareId: "demo-share-2",
    isPublic: 1,
  },
];

// Local storage key for user's frequency reports
const LOCAL_STORAGE_KEY = "angelic-voices-reports";

export class LocalStorageService {
  static getFrequencyReports(): FrequencyReport[] {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.error("Error loading frequency reports from localStorage:", error);
    }
    return mockFrequencyReports;
  }

  static saveFrequencyReport(report: Omit<FrequencyReport, "id" | "createdAt">): FrequencyReport {
    const reports = this.getFrequencyReports();
    const newReport: FrequencyReport = {
      ...report,
      id: Math.max(...reports.map(r => r.id), 0) + 1,
      createdAt: new Date().toISOString(),
    };
    
    const updatedReports = [...reports, newReport];
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updatedReports));
    return newReport;
  }

  static getFrequencyReportByShareId(shareId: string): FrequencyReport | null {
    const reports = this.getFrequencyReports();
    return reports.find(report => report.shareId === shareId && report.isPublic === 1) || null;
  }

  static generateAnalysis(detectedFrequencies: DetectedFrequency[]): string {
    if (detectedFrequencies.length === 0) {
      return "No frequencies detected. Try adjusting your microphone sensitivity or check your audio input.";
    }

    // Group frequencies by their value
    const frequencyCounts = detectedFrequencies.reduce((acc, curr) => {
      const frequency = curr.frequency;
      if (!acc[frequency]) {
        acc[frequency] = { count: 0, totalDuration: 0 };
      }
      acc[frequency].count++;
      acc[frequency].totalDuration += curr.duration;
      return acc;
    }, {} as Record<number, { count: number, totalDuration: number }>);

    // Find the predominant frequency
    let predominantFreq = 0;
    let maxDuration = 0;
    
    Object.entries(frequencyCounts).forEach(([freq, data]) => {
      if (data.totalDuration > maxDuration) {
        maxDuration = data.totalDuration;
        predominantFreq = parseInt(freq);
      }
    });

    // Generate analysis based on predominant frequency
    let analysis = "";
    if (predominantFreq >= 430 && predominantFreq <= 434) {
      analysis = "The predominant frequency detected (432 Hz) corresponds to Earth's natural frequency and is associated with healing and grounding.";
    } else if (predominantFreq >= 526 && predominantFreq <= 530) {
      analysis = "The predominant frequency detected (528 Hz) is known as the 'Miracle Tone' associated with transformation and DNA repair.";
    } else if (predominantFreq >= 637 && predominantFreq <= 641) {
      analysis = "The predominant frequency detected (639 Hz) is associated with harmonious connection and balanced relationships.";
    } else if (predominantFreq >= 739 && predominantFreq <= 743) {
      analysis = "The predominant frequency detected (741 Hz) corresponds to awakening intuition and problem-solving.";
    } else if (predominantFreq >= 961 && predominantFreq <= 965) {
      analysis = "The predominant frequency detected (963 Hz) is associated with spiritual connection and awakening to divine consciousness.";
    } else {
      analysis = `The predominant frequency detected (${predominantFreq} Hz) is not a recognized angelic frequency, but may still have beneficial properties.`;
    }

    // Add additional analysis for secondary frequencies
    const secondaryFrequencies = Object.entries(frequencyCounts)
      .filter(([freq, data]) => parseInt(freq) !== predominantFreq && data.count > 1)
      .map(([freq]) => parseInt(freq));

    if (secondaryFrequencies.length > 0) {
      analysis += " Additional frequencies detected suggest a complex harmonic pattern.";
    }

    analysis += " Overall, the frequency pattern indicates a balanced energetic field with healing potential.";

    return analysis;
  }
}


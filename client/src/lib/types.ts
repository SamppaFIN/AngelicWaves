import { DetectedFrequency } from "@shared/schema";

export interface FrequencySettings {
  minFrequency: number;
  maxFrequency: number;
  sensitivity: 'Low' | 'Medium' | 'High';
}

export interface AngelicFrequency {
  frequency: number;
  description: string;
}

export interface AnalysisReportData {
  detectedFrequencies: DetectedFrequency[];
  analysis: string;
  userNotes?: string;
}

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
  isPublic?: number; // 0 = private (default), 1 = public
  shareId?: string;  // Optional, will be generated on the server if not provided
}

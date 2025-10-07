import { z } from "zod";

export interface DetectedFrequency {
  frequency: number;
  duration: number;
  timestamp: number;
}

export interface FrequencyAnalysis {
  detectedFrequencies: DetectedFrequency[];
  analysis: string;
  userNotes?: string;
}

export const insertFrequencyReportSchema = z.object({
  detectedFrequencies: z.array(z.object({
    frequency: z.number(),
    duration: z.number(),
    timestamp: z.number(),
  })),
  analysis: z.string(),
  userNotes: z.string().optional(),
  shareId: z.string().optional(),
  isPublic: z.number().optional(),
});

export interface FrequencyReport {
  id: number;
  detectedFrequencies: DetectedFrequency[];
  analysis: string;
  userNotes?: string;
  createdAt: string;
  shareId?: string;
  isPublic?: number;
}

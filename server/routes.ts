import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import { insertFrequencyReportSchema, type DetectedFrequency } from "@shared/schema";

function generateAnalysis(detectedFrequencies: DetectedFrequency[]): string {
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

export async function registerRoutes(app: Express): Promise<Server> {
  // API routes
  app.post("/api/frequency-reports", async (req, res) => {
    try {
      const validatedData = insertFrequencyReportSchema.parse(req.body);
      
      // Generate AI analysis if not provided
      if (!validatedData.analysis || validatedData.analysis.trim() === "") {
        validatedData.analysis = generateAnalysis(validatedData.detectedFrequencies);
      }
      
      const report = await storage.saveFrequencyReport(validatedData);
      res.status(201).json(report);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to save frequency report" });
      }
    }
  });

  app.get("/api/frequency-reports", async (req, res) => {
    try {
      const reports = await storage.getFrequencyReports();
      res.json(reports);
    } catch (error) {
      res.status(500).json({ message: "Failed to retrieve frequency reports" });
    }
  });

  app.get("/api/analyze", async (req, res) => {
    try {
      const freqData = req.query.frequencies;
      if (!freqData) {
        return res.status(400).json({ message: "No frequency data provided" });
      }
      
      const frequencies = JSON.parse(String(freqData)) as DetectedFrequency[];
      const analysis = generateAnalysis(frequencies);
      
      res.json({ analysis });
    } catch (error) {
      res.status(500).json({ message: "Failed to analyze frequencies" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

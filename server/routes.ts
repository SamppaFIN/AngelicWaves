import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import { insertFrequencyReportSchema, type DetectedFrequency } from "@shared/schema";
import fetch from 'node-fetch';

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
        // Ensure detectedFrequencies is the correct type
        const typedFrequencies = Array.isArray(validatedData.detectedFrequencies) 
          ? validatedData.detectedFrequencies as DetectedFrequency[]
          : [];
          
        validatedData.analysis = generateAnalysis(typedFrequencies);
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

  // New route for AI-powered frequency analysis using Perplexity API
  app.post("/api/analyze-frequencies", async (req, res) => {
    try {
      const { detectedFrequencies, dominantFrequencies, userNotes } = req.body;
      
      if (!detectedFrequencies && !dominantFrequencies) {
        return res.status(400).json({ message: "No frequency data provided" });
      }
      
      // Check if the PERPLEXITY_API_KEY is available
      const apiKey = process.env.PERPLEXITY_API_KEY;
      if (!apiKey) {
        // Fall back to the built-in analysis method if no API key
        const fallbackAnalysis = "Our AI analysis service is currently unavailable. Please try again later or ensure the PERPLEXITY_API_KEY environment variable is set.";
        return res.json({ analysis: fallbackAnalysis });
      }
      
      // Create prompt for the Perplexity API
      const prompt = `
      I'm analyzing sound frequencies detected in a real-time audio stream.
      
      Here are the detected stable frequencies over time:
      ${detectedFrequencies || "None detected"}
      
      Here are the current dominant frequencies in the spectrum:
      ${dominantFrequencies || "None detected"}
      
      ${userNotes ? `Additional context: ${userNotes}` : ""}
      
      Please provide an expert analysis that includes:
      1. The significance of these frequencies in terms of sound healing and therapeutic applications
      2. Potential resonance with "angelic frequencies" (432Hz, 528Hz, 639Hz, 741Hz, 963Hz) and their effects
      3. Possible emotional and physical responses to these frequencies
      4. Any interesting patterns or relationships between the detected frequencies
      5. Historical and cultural contexts where these frequencies might have been used
      
      Format the response as a well-structured, informative analysis with clear sections.
      `;
      
      // Call the Perplexity API
      const response = await fetch("https://api.perplexity.ai/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "llama-3.1-sonar-small-128k-online",
          messages: [
            {
              role: "system",
              content: "You are an expert in sound therapy, frequency analysis, and the historical significance of sound healing across various cultures. Provide detailed, scientifically-grounded analysis while acknowledging traditional and spiritual perspectives."
            },
            {
              role: "user",
              content: prompt
            }
          ],
          temperature: 0.2,
          max_tokens: 2000,
          stream: false
        })
      });
      
      if (!response.ok) {
        throw new Error(`Perplexity API returned ${response.status}: ${await response.text()}`);
      }
      
      const data = await response.json();
      
      // Type guard for the Perplexity API response
      interface PerplexityResponse {
        choices: Array<{
          message: {
            content: string;
          };
        }>;
      }
      
      // Check if the response has the expected structure
      const isValidResponse = (data: unknown): data is PerplexityResponse => {
        return (
          typeof data === 'object' && 
          data !== null && 
          'choices' in data && 
          Array.isArray((data as any).choices) && 
          (data as any).choices.length > 0 &&
          typeof (data as any).choices[0]?.message?.content === 'string'
        );
      };
      
      let analysis = "Could not generate analysis.";
      if (isValidResponse(data)) {
        analysis = data.choices[0].message.content;
      }
      
      // Save the report for future reference
      const report = {
        detectedFrequencies: [],
        analysis,
        userNotes: userNotes || ""
      };
      
      // Return the AI-generated analysis
      res.json({ analysis });
    } catch (error) {
      console.error("Perplexity API error:", error);
      // Fall back to the built-in analysis method
      res.status(500).json({ 
        message: "Failed to analyze frequencies with AI", 
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

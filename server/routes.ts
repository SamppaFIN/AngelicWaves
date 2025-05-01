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
      
      // Check if this report should be public and shareable
      if (validatedData.isPublic === 1) {
        // If no share ID is provided, one will be generated in the storage layer
        console.log("Creating shareable report");
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
  
  // Endpoint to get a specific shared report by shareId
  app.get("/api/frequency-reports/shared/:shareId", async (req, res) => {
    try {
      const { shareId } = req.params;
      
      if (!shareId) {
        return res.status(400).json({ message: "Share ID is required" });
      }
      
      const report = await storage.getFrequencyReportByShareId(shareId);
      
      if (!report) {
        return res.status(404).json({ message: "Shared report not found or not public" });
      }
      
      res.json(report);
    } catch (error) {
      res.status(500).json({ message: "Failed to retrieve shared report" });
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
      const { detectedFrequencies, dominantFrequencies, userContext } = req.body;
      
      if ((!detectedFrequencies || !detectedFrequencies.length) && 
          (!dominantFrequencies || !dominantFrequencies.length)) {
        return res.status(400).json({ message: "No frequency data provided" });
      }
      
      // Check if the PERPLEXITY_API_KEY is available
      const apiKey = process.env.PERPLEXITY_API_KEY;
      if (!apiKey) {
        // Fall back to the built-in analysis method if no API key
        const fallbackAnalysis = "Our AI analysis service is currently unavailable. Please try again later or ensure the PERPLEXITY_API_KEY environment variable is set.";
        return res.json({ analysis: fallbackAnalysis });
      }
      
      // Format detected frequencies for the prompt
      let detectedFreqText = "None detected";
      if (detectedFrequencies && detectedFrequencies.length > 0) {
        detectedFreqText = detectedFrequencies.map((freq: { frequency: number, duration: number, timestamp: number }) => 
          `- ${freq.frequency}Hz detected for ${freq.duration.toFixed(2)} seconds at ${new Date(freq.timestamp).toLocaleTimeString()}`
        ).join('\n');
      }
      
      // Format dominant frequencies for the prompt
      let dominantFreqText = "None detected";
      if (dominantFrequencies && dominantFrequencies.length > 0) {
        dominantFreqText = dominantFrequencies.map((freq: { frequency: number, amplitude: number, percentage: number }) => 
          `- ${freq.frequency}Hz with amplitude ${freq.amplitude} (${freq.percentage}% dominance)`
        ).join('\n');
      }
      
      // Create prompt for the Perplexity API
      const prompt = `
      I'm analyzing sound frequencies detected in a real-time audio stream.
      
      Here are the detected stable frequencies over time:
      ${detectedFreqText}
      
      Here are the current dominant frequencies in the spectrum:
      ${dominantFreqText}
      
      ${userContext ? `Additional context: ${userContext}` : ""}
      
      Please provide an expert analysis that includes:
      1. The significance of these frequencies in terms of sound healing and therapeutic applications
      2. Potential resonance with "angelic frequencies" (432Hz, 528Hz, 639Hz, 741Hz, 963Hz) and their effects
      3. Possible emotional and physical responses to these frequencies
      4. Any interesting patterns or relationships between the detected frequencies
      5. Historical and cultural contexts where these frequencies might have been used
      
      Format the response as a well-structured, informative analysis with clear sections.
      `;
      
      console.log("Sending to Perplexity API with valid key:", apiKey ? "API Key present" : "No API key");
      
      let response;
      try {
        console.log("Preparing API call to Perplexity...");
      
        // Call the Perplexity API with more debug logging
        const apiUrl = "https://api.perplexity.ai/chat/completions";
        console.log("API URL:", apiUrl);
        
        const requestBody = {
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
          temperature: 0.3,
          max_tokens: 2000,
          stream: false
        };
        
        console.log("Request headers:", {
          "Authorization": "Bearer <REDACTED>",
          "Content-Type": "application/json"
        });
        console.log("Request body:", JSON.stringify(requestBody).substring(0, 200) + "...");
        
        response = await fetch(apiUrl, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${apiKey}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify(requestBody)
        });
        
        console.log("Perplexity API response status:", response.status);
        
        // Create a safer way to log headers without using spread operator
        const headers: Record<string, string> = {};
        response.headers.forEach((value, key) => {
          headers[key] = value;
        });
        console.log("Perplexity API response headers:", headers);
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error("Perplexity API error response:", errorText);
          throw new Error(`Perplexity API returned ${response.status}: ${errorText}`);
        }
        
        console.log("Perplexity API response OK, processing JSON...");
      } catch (fetchError) {
        console.error("Error during Perplexity API fetch:", fetchError);
        throw new Error(`Fetch error with Perplexity API: ${fetchError instanceof Error ? fetchError.message : String(fetchError)}`);
      }
      
      // Process the response outside the try-catch to handle JSON parsing separately
      if (!response) {
        throw new Error("API response was undefined");
      }
      
      let data;
      try {
        data = await response.json();
        console.log("Successfully parsed API response to JSON");
      } catch (jsonError) {
        console.error("Error parsing JSON from API response:", jsonError);
        throw new Error("Failed to parse API response as JSON");
      }
      console.log("Perplexity API response:", JSON.stringify(data).substring(0, 300) + "...");
      
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
      } else {
        console.error("Invalid response structure from Perplexity API:", data);
      }
      
      // Return the AI-generated analysis
      res.json({ analysis });
    } catch (error) {
      console.error("Perplexity API error:", error);
      // Return a more user-friendly error
      res.status(500).json({ 
        message: "Failed to analyze frequencies with AI", 
        error: error instanceof Error ? error.message : String(error),
        analysis: "We encountered an issue while analyzing your frequencies. Please try again or check your connection."
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

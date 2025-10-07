import { useState, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { DominantFrequency } from '@/hooks/useAudioAnalyzer';
import { DetectedFrequency } from "@/lib/schema";
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Brain } from 'lucide-react';
import { formatDetectedFrequenciesSummary } from '@/lib/frequencyAnalysis';

interface AIFrequencyAnalysisProps {
  detectedFrequencies: DetectedFrequency[];
  dominantFrequencies: DominantFrequency[];
  onAiInsightGenerated: (insight: string) => void;
}

export function AIFrequencyAnalysis({ 
  detectedFrequencies,
  dominantFrequencies,
  onAiInsightGenerated
}: AIFrequencyAnalysisProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [aiInsight, setAiInsight] = useState<string | null>(null);
  const [context, setContext] = useState('');
  const { toast } = useToast();

  // Clear insights if frequencies are reset
  useEffect(() => {
    if (detectedFrequencies.length === 0) {
      setAiInsight(null);
    }
  }, [detectedFrequencies]);

  const generateAiInsight = useCallback(async () => {
    if (detectedFrequencies.length === 0 && dominantFrequencies.length === 0) {
      toast({
        title: "No frequencies detected",
        description: "Please detect some frequencies before generating AI insights.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    
    try {
      console.log("Preparing frequency data for AI analysis...");
      const frequencyData = {
        detectedFrequencies,
        dominantFrequencies,
        userContext: context
      };
      
      console.log(`Sending ${detectedFrequencies.length} detected frequencies and ${dominantFrequencies.length} dominant frequencies for analysis`);
      
      try {
        const result = await apiRequest('/api/analyze-frequencies', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(frequencyData)
        });
        
        console.log("AI analysis API response received:", result);
        
        if (result && result.analysis) {
          console.log("Analysis received successfully, length:", result.analysis.length);
          setAiInsight(result.analysis);
          onAiInsightGenerated(result.analysis);
          
          toast({
            title: "Analysis complete",
            description: "AI has analyzed your frequency patterns.",
          });
        } else {
          console.error("API responded but no analysis in response:", result);
          throw new Error("No analysis returned in API response");
        }
      } catch (apiError) {
        console.error("AI analysis API request failed:", apiError);
        throw new Error(`API request failed: ${apiError instanceof Error ? apiError.message : String(apiError)}`);
      }
    } catch (error) {
      console.error("Failed to get analysis:", error);
      
      // More specific error message based on the error
      const errorMessage = error instanceof Error 
        ? `Error: ${error.message}`
        : "Unknown error occurred";
      
      toast({
        title: "Analysis failed",
        description: "Unable to generate AI insight. " + errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  }, [detectedFrequencies, dominantFrequencies, context, toast, onAiInsightGenerated]);

  // Format the frequency data for display
  const getFrequencyDisplay = () => {
    if (detectedFrequencies.length === 0 && dominantFrequencies.length === 0) {
      return "No frequencies detected yet. Activate the detector to begin capturing frequencies.";
    }
    
    let display = "";
    
    if (detectedFrequencies.length > 0) {
      display += "Detected Frequencies:\n" + formatDetectedFrequenciesSummary(detectedFrequencies) + "\n\n";
    }
    
    if (dominantFrequencies.length > 0) {
      display += "Current Dominant Frequencies:\n";
      dominantFrequencies.forEach((freq, i) => {
        display += `${i+1}. ${freq.frequency}Hz (${freq.percentage}% dominance, amplitude: ${freq.amplitude})\n`;
      });
    }
    
    return display;
  };

  return (
    <div className="space-y-6">
      <Card className="p-6 bg-gray-800/70 border-green-900/50">
        <div className="flex flex-col space-y-4">
          <div className="flex items-center gap-2 text-green-400 mb-2">
            <Brain className="h-5 w-5" />
            <h3 className="text-lg font-medium">Frequency Analysis</h3>
          </div>
          
          <div className="rounded bg-gray-900/70 p-4 font-mono text-sm text-gray-300 whitespace-pre-wrap max-h-60 overflow-y-auto">
            {getFrequencyDisplay()}
          </div>
          
          <div>
            <label htmlFor="context" className="block text-sm font-medium text-gray-300 mb-2">
              Add Context (Optional)
            </label>
            <Textarea
              id="context"
              placeholder="Add any context about your environment, intentions, or what you'd like to know about these frequencies..."
              value={context}
              onChange={(e) => setContext(e.target.value)}
              className="bg-gray-900/70 border-gray-700 text-gray-200"
            />
          </div>
          
          <Button 
            onClick={generateAiInsight} 
            disabled={isLoading}
            className="bg-green-600 hover:bg-green-700 text-white self-start ai-analysis-generate-btn"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> 
                Analyzing...
              </>
            ) : (
              <>Generate AI Insight</>
            )}
          </Button>
        </div>
      </Card>
      
      {aiInsight && (
        <Card className="p-6 bg-gray-800/70 border-green-900/50">
          <div className="flex items-center gap-2 text-indigo-400 mb-4">
            <Brain className="h-5 w-5" />
            <h3 className="text-lg font-medium">AI Insight</h3>
          </div>
          <div className="text-gray-200 whitespace-pre-wrap">
            {aiInsight}
          </div>
        </Card>
      )}
    </div>
  );
}
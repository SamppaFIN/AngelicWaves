import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Brain, InfoIcon } from 'lucide-react';
import { DominantFrequency } from '@/hooks/useAudioAnalyzer';
import { DetectedFrequency } from '@shared/schema';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

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
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [userNotes, setUserNotes] = useState('');
  const { toast } = useToast();

  // Format the frequency data for AI analysis
  const formatFrequencyData = () => {
    const formattedFrequencies = detectedFrequencies.map(freq => (
      `${freq.frequency}Hz (duration: ${freq.duration.toFixed(1)}s, detected at: ${new Date(freq.timestamp).toLocaleTimeString()})`
    )).join('\n');

    const formattedDominantFreqs = dominantFrequencies.map(freq => (
      `${freq.frequency}Hz (amplitude: ${freq.amplitude}, dominance: ${freq.percentage}%)`
    )).join('\n');
    
    return {
      detectedFrequenciesList: formattedFrequencies,
      dominantFrequenciesList: formattedDominantFreqs
    };
  };

  // Generate AI insights via the Perplexity API
  const generateAiInsights = async () => {
    if (detectedFrequencies.length === 0 && dominantFrequencies.length === 0) {
      toast({
        title: "No frequencies detected",
        description: "Please activate the detector and detect some frequencies before requesting AI analysis.",
        variant: "destructive"
      });
      return;
    }

    setIsAnalyzing(true);
    setAiAnalysis(null);

    try {
      const { detectedFrequenciesList, dominantFrequenciesList } = formatFrequencyData();
      
      // Send request to our backend server route that will call the Perplexity API
      const response = await apiRequest('/api/analyze-frequencies', {
        method: 'POST',
        body: JSON.stringify({
          detectedFrequencies: detectedFrequenciesList,
          dominantFrequencies: dominantFrequenciesList,
          userNotes
        })
      }) as { analysis: string };

      if (response && response.analysis) {
        setAiAnalysis(response.analysis);
        onAiInsightGenerated(response.analysis);
      } else {
        throw new Error('No analysis returned from the API');
      }
    } catch (error) {
      console.error('Error generating AI insights:', error);
      toast({
        title: "Analysis failed",
        description: "Could not generate AI insights. Please try again later.",
        variant: "destructive"
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="h-5 w-5" />
          AI Frequency Analysis
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <InfoIcon className="h-4 w-4 ml-2 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent className="max-w-md">
                <p>Our AI will analyze your detected frequencies and provide insights about their significance, 
                potential patterns, and connections to angelic frequencies.</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </CardTitle>
        <CardDescription>
          Get AI-powered insights about your detected frequencies
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Optional notes from user */}
        <div>
          <label htmlFor="notes" className="text-sm font-medium mb-1 block">
            Additional Context (Optional)
          </label>
          <Textarea
            id="notes"
            placeholder="Add any observations, questions, or context about your frequency session..."
            value={userNotes}
            onChange={(e) => setUserNotes(e.target.value)}
            className="min-h-[80px]"
          />
        </div>

        {/* Analysis results display */}
        {aiAnalysis && (
          <div className="mt-4 p-4 bg-muted/50 rounded-lg">
            <h4 className="font-medium mb-2">AI Insights:</h4>
            <div className="whitespace-pre-line text-sm">
              {aiAnalysis}
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button 
          variant="outline" 
          onClick={() => {
            setAiAnalysis(null);
            setUserNotes('');
          }}
          disabled={isAnalyzing}
        >
          Clear
        </Button>
        <Button 
          onClick={generateAiInsights}
          disabled={isAnalyzing}
        >
          {isAnalyzing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Analyzing...
            </>
          ) : (
            <>Generate AI Insights</>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}
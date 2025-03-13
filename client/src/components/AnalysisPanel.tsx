import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { ChevronsUp, ChevronsDown } from "lucide-react";
import { formatDetectedFrequenciesSummary } from "@/lib/frequencyAnalysis";
import { apiRequest } from "@/lib/queryClient";
import { DetectedFrequency } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { AnalysisReportData } from "@/lib/types";

interface AnalysisPanelProps {
  detectedFrequencies: DetectedFrequency[];
  onSaveReport: (report: AnalysisReportData) => Promise<void>;
}

export function AnalysisPanel({ detectedFrequencies, onSaveReport }: AnalysisPanelProps) {
  const [expanded, setExpanded] = useState(false);
  const [userNotes, setUserNotes] = useState("");
  const [analysis, setAnalysis] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  // Fetch AI analysis when detected frequencies change
  useEffect(() => {
    if (detectedFrequencies.length > 0) {
      const fetchAnalysis = async () => {
        try {
          setLoading(true);
          const res = await apiRequest(
            "GET", 
            `/api/analyze?frequencies=${encodeURIComponent(JSON.stringify(detectedFrequencies))}`
          );
          const data = await res.json();
          setAnalysis(data.analysis);
        } catch (error) {
          console.error("Failed to get analysis:", error);
          setAnalysis("Analysis unavailable at this time.");
        } finally {
          setLoading(false);
        }
      };
      
      fetchAnalysis();
    } else {
      setAnalysis("");
    }
  }, [detectedFrequencies]);

  const handleSaveAnalysis = async () => {
    if (detectedFrequencies.length === 0) {
      toast({
        title: "No frequencies detected",
        description: "Please detect some frequencies before saving an analysis.",
        variant: "destructive"
      });
      return;
    }
    
    try {
      await onSaveReport({
        detectedFrequencies,
        analysis,
        userNotes: userNotes.trim() || undefined
      });
      
      toast({
        title: "Analysis saved",
        description: "Your frequency analysis report has been saved successfully."
      });
      
      setUserNotes("");
    } catch (error) {
      console.error("Failed to save analysis:", error);
      toast({
        title: "Failed to save",
        description: "There was an error saving your analysis report.",
        variant: "destructive"
      });
    }
  };

  const handleShareAnalysis = () => {
    if (navigator.share) {
      navigator.share({
        title: "Angelic Frequency Analysis",
        text: `Detected Frequencies:\n${formatDetectedFrequenciesSummary(detectedFrequencies)}\n\nAnalysis:\n${analysis}`
      }).catch(error => {
        console.error("Error sharing:", error);
      });
    } else {
      toast({
        title: "Sharing not supported",
        description: "Your browser doesn't support the Web Share API."
      });
    }
  };

  return (
    <motion.div
      className="fixed bottom-0 w-full bg-gray-800 rounded-t-xl shadow-lg z-10"
      initial={{ y: "calc(100% - 60px)" }}
      animate={{ y: expanded ? 0 : "calc(100% - 60px)" }}
      transition={{ duration: 0.3 }}
    >
      <div 
        className="py-3 px-4 border-b border-gray-700 flex justify-between items-center cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <h2 className="text-lg font-medium">AI Analysis Report</h2>
        <button className="text-gray-400">
          {expanded ? <ChevronsDown className="h-5 w-5" /> : <ChevronsUp className="h-5 w-5" />}
        </button>
      </div>
      
      <AnimatePresence>
        {expanded && (
          <motion.div
            className="p-4 max-h-[60vh] overflow-y-auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="mb-4">
              <h3 className="text-md font-medium mb-2">Detected Frequencies</h3>
              <div className="bg-gray-700 rounded-lg p-3 text-sm text-gray-300 whitespace-pre-line">
                {detectedFrequencies.length > 0 
                  ? formatDetectedFrequenciesSummary(detectedFrequencies)
                  : "No frequencies detected yet."}
              </div>
            </div>
            
            <div className="mb-4">
              <h3 className="text-md font-medium mb-2">Analysis</h3>
              <div className="bg-gray-700 rounded-lg p-3 text-sm text-gray-300 min-h-[60px]">
                {loading ? "Analyzing frequencies..." : analysis || "No analysis available yet."}
              </div>
            </div>
            
            <div className="mb-4">
              <h3 className="text-md font-medium mb-2">Your Notes</h3>
              <Textarea 
                value={userNotes}
                onChange={(e) => setUserNotes(e.target.value)}
                className="w-full h-24 bg-gray-700 text-white rounded-lg p-3 text-sm focus:ring-1 focus:ring-green-400 focus:border-green-400"
                placeholder="Add your observations here..."
              />
            </div>
            
            <div className="flex space-x-3">
              <Button 
                onClick={handleSaveAnalysis}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
              >
                Save Analysis
              </Button>
              <Button 
                onClick={handleShareAnalysis}
                variant="outline"
                className="flex-1 bg-gray-700 hover:bg-gray-600 text-white border-gray-600"
              >
                Share Results
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

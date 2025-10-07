import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { ChevronsUp, ChevronsDown, Link, Share2, Save, Copy } from "lucide-react";
import { formatDetectedFrequenciesSummary } from "@/lib/frequencyAnalysis";
import { apiRequest } from "@/lib/queryClient";
import { DetectedFrequency } from "@/lib/schema";
import { useToast } from "@/hooks/use-toast";
import { AnalysisReportData } from "@/lib/types";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

interface AnalysisPanelProps {
  detectedFrequencies: DetectedFrequency[];
  onSaveReport: (report: AnalysisReportData) => Promise<boolean | void>;
}

export function AnalysisPanel({ detectedFrequencies, onSaveReport }: AnalysisPanelProps) {
  const [expanded, setExpanded] = useState(false);
  const [userNotes, setUserNotes] = useState("");
  const [analysis, setAnalysis] = useState("");
  const [loading, setLoading] = useState(false);
  const [isPublic, setIsPublic] = useState(false);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [shareableLink, setShareableLink] = useState("");
  const [shareLoading, setShareLoading] = useState(false);
  const { toast } = useToast();

  // Fetch AI analysis when detected frequencies change
  useEffect(() => {
    if (detectedFrequencies.length > 0) {
      const fetchAnalysis = async () => {
        try {
          setLoading(true);
          const data = await apiRequest<{analysis: string}>(`/api/analyze?frequencies=${encodeURIComponent(JSON.stringify(detectedFrequencies))}`);
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

  // Create a shareable report
  const createShareableReport = async () => {
    if (detectedFrequencies.length === 0) {
      toast({
        title: "No frequencies detected",
        description: "Please detect some frequencies before creating a shareable report.",
        variant: "destructive"
      });
      return null;
    }
    
    try {
      setShareLoading(true);
      
      // Create a report with the isPublic flag set to 1
      const reportData = {
        detectedFrequencies,
        analysis,
        userNotes: userNotes.trim() || undefined,
        isPublic: 1 // Make the report public for sharing
      };
      
      // Send to the API
      const response = await apiRequest<{ shareId: string, id: number }>(
        "/api/frequency-reports", 
        { 
          method: "POST", 
          body: JSON.stringify(reportData) 
        }
      );
      
      if (response && response.shareId) {
        // Generate the shareable URL using the shareId
        const shareUrl = `${window.location.origin}/shared-report/${response.shareId}`;
        return shareUrl;
      }
      
      return null;
    } catch (error) {
      console.error("Failed to create shareable report:", error);
      toast({
        title: "Failed to create share link",
        description: "There was an error generating a shareable link.",
        variant: "destructive"
      });
      return null;
    } finally {
      setShareLoading(false);
    }
  };

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

  // Native share function using Web Share API
  const nativeShare = (shareText: string) => {
    if (navigator.share) {
      navigator.share({
        title: "Angelic Frequency Analysis",
        text: shareText
      }).catch(error => {
        console.error("Error sharing:", error);
      });
    } else {
      toast({
        title: "Native sharing not supported",
        description: "Your browser doesn't support the Web Share API."
      });
      return false;
    }
    return true;
  };

  // Copy to clipboard function
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast({
        title: "Copied to clipboard",
        description: "The shareable link has been copied to your clipboard."
      });
    }).catch(() => {
      toast({
        title: "Failed to copy",
        description: "Could not copy to clipboard. Please try again."
      });
    });
  };

  // Handle the share button click
  const handleShareAnalysis = async () => {
    // First try native sharing for simple text
    const shareText = `Detected Frequencies:\n${formatDetectedFrequenciesSummary(detectedFrequencies)}\n\nAnalysis:\n${analysis}`;
    
    // Check if we already have a shareable link
    if (shareableLink) {
      setShareDialogOpen(true);
      return;
    }

    // Try to create a shareable link
    const shareUrl = await createShareableReport();
    
    if (shareUrl) {
      setShareableLink(shareUrl);
      setShareDialogOpen(true);
    } else {
      // If the shareable link creation failed, just do native sharing if possible
      if (!nativeShare(shareText)) {
        toast({
          title: "Sharing options limited",
          description: "We couldn't create a shareable link and your browser doesn't support native sharing."
        });
      }
    }
  };

  return (
    <>
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
                  <Save className="mr-2 h-4 w-4" />
                  Save Analysis
                </Button>
                <Button 
                  onClick={handleShareAnalysis}
                  variant="outline"
                  className="flex-1 bg-gray-700 hover:bg-gray-600 text-white border-gray-600"
                  disabled={shareLoading}
                >
                  {shareLoading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Creating Link...
                    </>
                  ) : (
                    <>
                      <Share2 className="mr-2 h-4 w-4" />
                      Share Results
                    </>
                  )}
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Share Dialog */}
      <Dialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
        <DialogContent className="bg-gray-800 text-white border-gray-700 sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl flex items-center">
              <Link className="mr-2 h-5 w-5 text-green-400" />
              Share Your Frequency Analysis
            </DialogTitle>
            <DialogDescription className="text-gray-300">
              Copy the link below to share your frequency analysis with others.
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex items-center space-x-2 mt-2">
            <div className="rounded-md bg-gray-700 w-full p-3 text-sm text-gray-300 truncate">
              {shareableLink}
            </div>
            <Button 
              variant="outline" 
              size="icon"
              className="flex-shrink-0 bg-gray-700 hover:bg-gray-600 text-white border-gray-600"
              onClick={() => copyToClipboard(shareableLink)}
            >
              <Copy className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="flex justify-between mt-4">
            <div className="flex items-center space-x-2">
              <Switch id="public-share" checked={true} disabled />
              <label htmlFor="public-share" className="text-sm text-gray-300">Publicly accessible</label>
            </div>
            
            {navigator.share && (
              <Button
                onClick={() => {
                  navigator.share({
                    title: "Angelic Frequency Analysis",
                    text: "Check out my frequency analysis results!",
                    url: shareableLink
                  }).catch(error => {
                    console.error("Error sharing:", error);
                  });
                }}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                <Share2 className="mr-2 h-4 w-4" />
                Share
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

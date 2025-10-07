import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams, Link as WouterLink } from "wouter";
import { DetectedFrequency, FrequencyReport } from "@/lib/schema";
import { apiRequest } from "@/lib/queryClient";
import { formatDetectedFrequenciesSummary } from "@/lib/frequencyAnalysis";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link, Home, ArrowLeft, Share2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function SharedReport() {
  const { shareId } = useParams<{ shareId: string }>();
  const [shareUrl, setShareUrl] = useState<string>("");
  
  useEffect(() => {
    // Set the current URL for sharing
    setShareUrl(window.location.href);
  }, []);
  
  // Use a more relaxed type to avoid TypeScript errors
  interface SharedReportResponse {
    id: number;
    detectedFrequencies: any; // Using any to handle both string and array
    analysis: string;
    userNotes: string | null;
    createdAt: string | Date;
    shareId: string | null;
    isPublic: number | null;
  }
  
  const { data: report, isLoading, error } = useQuery<SharedReportResponse>({
    queryKey: [`/api/frequency-reports/shared/${shareId}`],
    enabled: !!shareId,
  });
  
  // Function to copy the current URL to clipboard
  const copyShareLink = () => {
    navigator.clipboard.writeText(shareUrl).then(() => {
      alert("Share link copied to clipboard!");
    });
  };
  
  // Function for native sharing
  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: "Angelic Frequency Analysis",
        text: "Check out this frequency analysis result!",
        url: shareUrl
      }).catch(error => {
        console.error("Error sharing:", error);
      });
    } else {
      copyShareLink();
    }
  };
  
  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="mb-6">
          <WouterLink href="/">
            <Button variant="outline" className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Frequency Explorer
            </Button>
          </WouterLink>
        </div>
        
        <Card className="bg-gray-800 text-white border-gray-700">
          <CardHeader>
            <Skeleton className="h-8 w-3/4 bg-gray-700" />
            <Skeleton className="h-4 w-1/2 bg-gray-700 mt-2" />
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Skeleton className="h-5 w-40 bg-gray-700 mb-2" />
              <Skeleton className="h-24 w-full bg-gray-700" />
            </div>
            <div>
              <Skeleton className="h-5 w-40 bg-gray-700 mb-2" />
              <Skeleton className="h-32 w-full bg-gray-700" />
            </div>
            {/* User notes skeleton (optional) */}
            <div>
              <Skeleton className="h-5 w-40 bg-gray-700 mb-2" />
              <Skeleton className="h-16 w-full bg-gray-700" />
            </div>
          </CardContent>
          <CardFooter>
            <Skeleton className="h-10 w-32 bg-gray-700" />
          </CardFooter>
        </Card>
      </div>
    );
  }
  
  if (error || !report) {
    return (
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="mb-6">
          <WouterLink href="/">
            <Button variant="outline" className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Frequency Explorer
            </Button>
          </WouterLink>
        </div>
        
        <Card className="bg-gray-800 text-white border-gray-700">
          <CardHeader>
            <CardTitle className="text-xl flex items-center">
              <Link className="mr-2 h-5 w-5 text-red-400" />
              Report Not Found
            </CardTitle>
            <CardDescription className="text-gray-300">
              The shared frequency analysis you're looking for doesn't exist or is no longer available.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-gray-300">
              The report may have been deleted or the share link might be incorrect. Please check the URL and try again.
            </p>
          </CardContent>
          <CardFooter>
            <WouterLink href="/">
              <Button className="flex items-center gap-2">
                <Home className="h-4 w-4" />
                Go to Frequency Explorer
              </Button>
            </WouterLink>
          </CardFooter>
        </Card>
      </div>
    );
  }
  
  // Parse the detected frequencies from the report
  // The server returns an array of DetectedFrequency objects, but it might be stringified
  let detectedFrequencies: DetectedFrequency[] = [];
  try {
    // Handle both cases: already parsed array or stringified JSON
    if (typeof report.detectedFrequencies === 'string') {
      detectedFrequencies = JSON.parse(report.detectedFrequencies);
    } else {
      // It's already an array of DetectedFrequency objects
      detectedFrequencies = report.detectedFrequencies as unknown as DetectedFrequency[];
    }
  } catch (e) {
    console.error("Error parsing detectedFrequencies:", e);
  }
  
  const analysis = report.analysis;
  const userNotes = report.userNotes;
  
  const formattedDate = new Date(report.createdAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
  
  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <div className="mb-6">
        <WouterLink href="/">
          <Button variant="outline" className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Frequency Explorer
          </Button>
        </WouterLink>
      </div>
      
      <Card className="bg-gray-800 text-white border-gray-700">
        <CardHeader>
          <CardTitle className="text-xl flex items-center">
            <Link className="mr-2 h-5 w-5 text-green-400" />
            Shared Frequency Analysis
          </CardTitle>
          <CardDescription className="text-gray-300">
            Analysis created on {formattedDate}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-medium mb-2">Detected Frequencies</h3>
            <div className="bg-gray-700 rounded-lg p-3 text-sm text-gray-300 whitespace-pre-line">
              {detectedFrequencies && detectedFrequencies.length > 0 
                ? formatDetectedFrequenciesSummary(detectedFrequencies)
                : "No frequency data available."}
            </div>
          </div>
          
          <div>
            <h3 className="font-medium mb-2">Analysis</h3>
            <div className="bg-gray-700 rounded-lg p-3 text-sm text-gray-300">
              {analysis || "No analysis data available."}
            </div>
          </div>
          
          {userNotes && (
            <div>
              <h3 className="font-medium mb-2">User Notes</h3>
              <div className="bg-gray-700 rounded-lg p-3 text-sm text-gray-300">
                {userNotes}
              </div>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-between">
          <WouterLink href="/">
            <Button variant="secondary" className="flex items-center gap-2">
              <Home className="h-4 w-4" />
              Try It Yourself
            </Button>
          </WouterLink>
          
          <Button 
            onClick={handleShare}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
          >
            <Share2 className="h-4 w-4" />
            Share This Report
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
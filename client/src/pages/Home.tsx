import { useState, useCallback } from "react";
import { FrequencyVisualizer } from "@/components/FrequencyVisualizer";
import { FrequencyThresholds } from "@/components/FrequencyThresholds";
import { AngelicFrequencies } from "@/components/AngelicFrequencies";
import { AnalysisPanel } from "@/components/AnalysisPanel";
import { MicrophonePermission } from "@/components/MicrophonePermission";
import { useAudioAnalyzer } from "@/hooks/useAudioAnalyzer";
import { Switch } from "@/components/ui/switch";
import { FrequencySettings, AnalysisReportData } from "@/lib/types";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function Home() {
  const [showPermissionModal, setShowPermissionModal] = useState(false);
  const [settings, setSettings] = useState<FrequencySettings>({
    minFrequency: 432,
    maxFrequency: 963,
    sensitivity: 'Medium'
  });
  
  const { toast } = useToast();
  
  const { 
    isActive,
    currentFrequency,
    detectionStatus,
    detectedFrequencies,
    hasAngelicFrequency,
    toggleDetector,
    resetDetectedFrequencies,
    microphoneAccess,
    requestMicrophoneAccess
  } = useAudioAnalyzer(settings);

  const handleToggleClick = useCallback(() => {
    if (!isActive && !microphoneAccess) {
      setShowPermissionModal(true);
    } else {
      toggleDetector();
    }
  }, [isActive, microphoneAccess, toggleDetector]);

  const handleAllowMicrophone = useCallback(async () => {
    const success = await requestMicrophoneAccess();
    setShowPermissionModal(false);
    
    if (success) {
      toggleDetector();
    } else {
      toast({
        title: "Microphone access denied",
        description: "This app requires microphone access to detect frequencies.",
        variant: "destructive"
      });
    }
  }, [requestMicrophoneAccess, toggleDetector, toast]);

  const handleCancelMicrophone = useCallback(() => {
    setShowPermissionModal(false);
  }, []);

  const handleSettingsChange = useCallback((newSettings: FrequencySettings) => {
    setSettings(newSettings);
  }, []);

  const handleSaveReport = async (report: AnalysisReportData) => {
    await apiRequest("POST", "/api/frequency-reports", report);
    resetDetectedFrequencies();
  };

  return (
    <div className="font-sans bg-gray-900 text-white min-h-screen pb-32">
      {/* Header */}
      <header className="fixed top-0 w-full bg-gray-800 shadow-md z-10">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <h1 className="text-xl font-semibold flex items-center">
            <span className="text-green-400 mr-2">✧</span>
            Angelic Frequency Detector
          </h1>
          
          <div className="flex items-center">
            <span className="mr-3 text-sm text-gray-300">
              {isActive ? 'Active' : 'Inactive'}
            </span>
            <Switch
              checked={isActive}
              onCheckedChange={handleToggleClick}
            />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 pt-20">
        <FrequencyVisualizer
          isActive={isActive}
          currentFrequency={currentFrequency}
          detectionStatus={detectionStatus}
          hasAngelicFrequency={hasAngelicFrequency}
          minFrequency={settings.minFrequency}
          maxFrequency={settings.maxFrequency}
        />
        
        <FrequencyThresholds
          settings={settings}
          onSettingsChange={handleSettingsChange}
        />
        
        <AngelicFrequencies />
      </main>

      <AnalysisPanel
        detectedFrequencies={detectedFrequencies}
        onSaveReport={handleSaveReport}
      />

      <MicrophonePermission
        open={showPermissionModal}
        onAllow={handleAllowMicrophone}
        onCancel={handleCancelMicrophone}
      />
    </div>
  );
}

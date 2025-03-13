import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface MicrophonePermissionProps {
  open: boolean;
  onAllow: () => Promise<void>;
  onCancel: () => void;
}

export function MicrophonePermission({ open, onAllow, onCancel }: MicrophonePermissionProps) {
  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onCancel()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-green-400">Microphone Access Required</DialogTitle>
          <DialogDescription>
            This app needs access to your device's microphone to detect and analyze frequencies. 
            Your audio will not be recorded or stored.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col space-y-3 mt-4">
          <Button 
            onClick={onAllow}
            className="bg-green-500 hover:bg-green-600 text-gray-900 py-3 font-medium"
          >
            Allow Microphone Access
          </Button>
          <Button 
            onClick={onCancel}
            variant="outline" 
            className="bg-gray-700 hover:bg-gray-600 text-white border-gray-600"
          >
            Not Now
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

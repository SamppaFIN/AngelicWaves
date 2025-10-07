import React from "react";
import { Button } from "@/components/ui/button";
import { History, Sigma } from "lucide-react";

interface BottomDockProps {
  onToggleHistory: () => void;
  onToggleCalculations: () => void;
}

export function BottomDock({ onToggleHistory, onToggleCalculations }: BottomDockProps) {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-20">
      <div className="mx-auto max-w-6xl px-4 pb-3">
        <div className="bg-gray-800/95 border border-gray-700 rounded-xl shadow-2xl">
          <div className="flex items-center justify-around p-2">
            <Button
              variant="ghost"
              onClick={onToggleHistory}
              className="text-purple-300 hover:text-purple-200 hover:bg-purple-900/20"
            >
              <History className="mr-2 h-5 w-5" />
              History
            </Button>
            <div className="h-6 w-px bg-gray-700" />
            <Button
              variant="ghost"
              onClick={onToggleCalculations}
              className="text-green-300 hover:text-green-200 hover:bg-green-900/20"
            >
              <Sigma className="mr-2 h-5 w-5" />
              Calculations
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}



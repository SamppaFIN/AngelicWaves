import React, { useState } from 'react';
import { 
  AlertCircle, 
  CheckCircle2, 
  Shield, 
  Lock, 
  Info, 
  X,
  Database,
  Code
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

// Mock test results, in a real app this would come from the API
const mockTestResults = {
  timestamp: new Date().toISOString(),
  summary: {
    total: 8,
    passed: 6,
    failed: 1,
    skipped: 1
  },
  tests: [
    { 
      category: 'api-fuzzing', 
      name: 'API endpoints should be protected against path traversal', 
      status: 'passed',
      duration: 243
    },
    { 
      category: 'api-fuzzing', 
      name: 'POST /api/frequency-reports should handle malformed JSON', 
      status: 'passed',
      duration: 189
    },
    { 
      category: 'api-fuzzing', 
      name: 'POST /api/frequency-reports should validate input payload', 
      status: 'passed',
      duration: 201
    },
    { 
      category: 'privacy-gdpr', 
      name: 'Frequency reports should not contain personally identifiable information', 
      status: 'passed',
      duration: 132
    },
    { 
      category: 'privacy-gdpr', 
      name: 'User data should have the right to be forgotten', 
      status: 'skipped',
      duration: 5
    },
    { 
      category: 'ui-security', 
      name: 'AnalysisPanel should safely handle untrusted user input', 
      status: 'passed',
      duration: 167
    },
    { 
      category: 'ui-security', 
      name: 'UI components should not allow script injection', 
      status: 'passed',
      duration: 188
    },
    { 
      category: 'db-security', 
      name: 'Database queries should be protected against SQL injection', 
      status: 'failed', 
      duration: 120 
    }
  ]
};

// Icons for test categories
const categoryIcons: Record<string, React.ReactNode> = {
  'api-fuzzing': <Code size={16} />,
  'privacy-gdpr': <Lock size={16} />,
  'ui-security': <Shield size={16} />,
  'db-security': <Database size={16} />
};

// Icons for test statuses
const statusIcons: Record<string, React.ReactNode> = {
  'passed': <CheckCircle2 className="text-green-500" size={16} />,
  'failed': <AlertCircle className="text-red-500" size={16} />,
  'skipped': <Info className="text-yellow-500" size={16} />
};

export function TestStatus() {
  const [isOpen, setIsOpen] = useState(false);
  const { summary } = mockTestResults;
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'passed': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100';
      case 'failed': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100';
      case 'skipped': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100';
      default: return '';
    }
  };
  
  // Calculate the overall security score (simple algorithm, can be improved)
  const securityScore = Math.round((summary.passed / summary.total) * 100);
  
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          size="sm"
          className="flex items-center gap-2 fixed bottom-4 right-4 z-50 shadow-lg"
        >
          <Shield size={16} />
          <span>Security Status</span>
          <Badge 
            variant={securityScore >= 80 ? "default" : securityScore >= 60 ? "outline" : "destructive"}
            className="ml-1"
          >
            {securityScore}%
          </Badge>
        </Button>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-[500px] max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield size={18} />
            Application Security Status
          </DialogTitle>
          <DialogDescription>
            Security and privacy test results from our continuous testing process.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid grid-cols-4 gap-2 my-3">
          <div className="bg-gray-100 dark:bg-gray-800 rounded p-2 text-center">
            <div className="text-gray-500 text-xs">Total</div>
            <div className="font-bold">{summary.total}</div>
          </div>
          <div className="bg-green-50 dark:bg-green-900 rounded p-2 text-center">
            <div className="text-green-500 text-xs">Passed</div>
            <div className="font-bold text-green-600 dark:text-green-400">{summary.passed}</div>
          </div>
          <div className="bg-red-50 dark:bg-red-900 rounded p-2 text-center">
            <div className="text-red-500 text-xs">Failed</div>
            <div className="font-bold text-red-600 dark:text-red-400">{summary.failed}</div>
          </div>
          <div className="bg-yellow-50 dark:bg-yellow-900 rounded p-2 text-center">
            <div className="text-yellow-500 text-xs">Skipped</div>
            <div className="font-bold text-yellow-600 dark:text-yellow-400">{summary.skipped}</div>
          </div>
        </div>
        
        <Separator />
        
        <div className="text-sm font-medium mb-2">Test Details</div>
        <ScrollArea className="h-[300px] rounded-md border">
          <div className="p-4 space-y-4">
            {mockTestResults.tests.map((test, index) => (
              <div 
                key={index} 
                className={`p-3 rounded-md ${getStatusColor(test.status)}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          {categoryIcons[test.category] || <Shield size={16} />}
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{test.category}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    
                    <span className="font-medium">{test.name}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-xs">{test.duration}ms</span>
                    {statusIcons[test.status]}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
        
        <div className="text-xs text-gray-500 text-center mt-2">
          Last updated: {new Date(mockTestResults.timestamp).toLocaleString()}
        </div>
      </DialogContent>
    </Dialog>
  );
}
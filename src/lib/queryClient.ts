import { QueryClient, QueryFunction } from "@tanstack/react-query";
import { LocalStorageService } from "./localStorageService";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest<T = any>(
  url: string,
  options?: RequestInit,
): Promise<T> {
  // For GitHub Pages static deployment, we'll use local storage instead of server API
  if (url.includes('/api/frequency-reports')) {
    if (options?.method === 'POST') {
      // Save frequency report to local storage
      const body = options.body ? JSON.parse(options.body as string) : {};
      const report = LocalStorageService.saveFrequencyReport(body);
      return report as T;
    } else {
      // Get frequency reports from local storage
      const reports = LocalStorageService.getFrequencyReports();
      return reports as T;
    }
  }
  
  if (url.includes('/api/frequency-reports/shared/')) {
    // Get shared report by shareId
    const shareId = url.split('/').pop();
    if (shareId) {
      const report = LocalStorageService.getFrequencyReportByShareId(shareId);
      if (!report) {
        throw new Error("404: Shared report not found");
      }
      return report as T;
    }
  }
  
  if (url.includes('/api/analyze-frequencies')) {
    // Generate analysis using local service
    const body = options?.body ? JSON.parse(options.body as string) : {};
    const analysis = LocalStorageService.generateAnalysis(body.detectedFrequencies || []);
    return { analysis } as T;
  }

  // Fallback to original fetch for other requests
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    ...options
  });

  await throwIfResNotOk(res);
  return await res.json();
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const res = await fetch(queryKey[0] as string, {
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});

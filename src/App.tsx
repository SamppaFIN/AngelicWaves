import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import Home from "@/pages/Home";
import SharedReport from "@/pages/SharedReport";
import NotFound from "@/pages/not-found";
import { useState } from "react";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/shared-report/:shareId" component={SharedReport} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router />
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;

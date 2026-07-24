import { useState, useEffect } from "react";
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider, useQuery } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { LanguageProvider } from "@/contexts/language-context";
import LayoutShell from "@/components/layout-shell";
import Dashboard from "@/pages/dashboard";
import NewInspection from "@/pages/new-inspection";
import InspectionDetails from "@/pages/inspection-details";
import FaultLibrary from "@/pages/fault-library";
import VehicleData from "@/pages/vehicle-data";
import Settings from "@/pages/settings";
import ApiKeys from "@/pages/api-keys";
import NotFound from "@/pages/not-found";
import Login from "@/pages/login";

import InteractiveReport from "@/pages/interactive-report";
import PublicReport from "@/pages/public-report";

function ProtectedRoutes({ onLogout }: { onLogout: () => void }) {
  return (
    <LayoutShell onLogout={onLogout}>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/inspections" component={Dashboard} />
        <Route path="/inspections/new" component={NewInspection} />
        <Route path="/inspections/:id" component={InspectionDetails} />
        <Route path="/fault-library" component={FaultLibrary} />
        <Route path="/vehicle-data" component={VehicleData} />
        <Route path="/settings" component={Settings} />
        <Route path="/api-keys" component={ApiKeys} />
        <Route component={NotFound} />
      </Switch>
    </LayoutShell>
  );
}

function AppContent() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  const { data: authData, isLoading } = useQuery({
    queryKey: ["/api/auth/check"],
    queryFn: async () => {
      const res = await fetch("/api/auth/check");
      return res.json();
    },
    staleTime: 1000 * 60 * 5,
  });

  useEffect(() => {
    if (authData !== undefined) {
      setIsAuthenticated(authData.isAuthenticated);
    }
  }, [authData]);

  const handleLoginSuccess = () => {
    setIsAuthenticated(true);
    queryClient.invalidateQueries({ queryKey: ["/api/auth/check"] });
  };

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setIsAuthenticated(false);
    queryClient.invalidateQueries({ queryKey: ["/api/auth/check"] });
  };

  if (isLoading || isAuthenticated === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0C1A28]">
        <div className="w-12 h-12 border-4 border-[#C5852C]/30 border-t-[#C5852C] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <Switch>
      <Route path="/view/:token">
        {() => <PublicReport />}
      </Route>
      <Route path="/report/:id">
        {() => <InteractiveReport />}
      </Route>
      <Route path="/reports/:id">
        {() => <InteractiveReport />}
      </Route>
      <Route path="*">
        {isAuthenticated ? (
          <ProtectedRoutes onLogout={handleLogout} />
        ) : (
          <Login onLoginSuccess={handleLoginSuccess} />
        )}
      </Route>
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        <Toaster />
        <AppContent />
      </LanguageProvider>
    </QueryClientProvider>
  );
}

export default App;

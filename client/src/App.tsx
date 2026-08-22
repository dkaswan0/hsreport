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
        <Route path="/new-inspection" component={NewInspection} />
        <Route path="/inspection/new" component={NewInspection} />
        <Route path="/inspections/:id" component={InspectionDetails} />
        <Route path="/inspection/:id" component={InspectionDetails} />
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
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(() => {
    try {
      return localStorage.getItem("hs_auth") === "true";
    } catch {
      return null;
    }
  });

  const { data: authData, isLoading } = useQuery({
    queryKey: ["/api/auth/check"],
    queryFn: async () => {
      try {
        const res = await fetch("/api/auth/check");
        if (!res.ok) return { isAuthenticated: localStorage.getItem("hs_auth") === "true" };
        return res.json();
      } catch {
        return { isAuthenticated: localStorage.getItem("hs_auth") === "true" };
      }
    },
    staleTime: 10000,
    refetchOnWindowFocus: true,
  });

  useEffect(() => {
    if (authData !== undefined && authData.isAuthenticated !== undefined) {
      setIsAuthenticated(!!authData.isAuthenticated);
      if (authData.isAuthenticated) {
        try { localStorage.setItem("hs_auth", "true"); } catch {}
      }
    }
  }, [authData]);

  const handleLoginSuccess = () => {
    try { localStorage.setItem("hs_auth", "true"); } catch {}
    setIsAuthenticated(true);
    queryClient.invalidateQueries({ queryKey: ["/api/auth/check"] });
  };

  const handleLogout = async () => {
    try { localStorage.removeItem("hs_auth"); } catch {}
    await fetch("/api/auth/logout", { method: "POST" }).catch(() => {});
    setIsAuthenticated(false);
    queryClient.invalidateQueries({ queryKey: ["/api/auth/check"] });
  };

  if (isLoading || isAuthenticated === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-950">
        <div className="w-12 h-12 border-4 border-zinc-800 border-t-white rounded-full animate-spin" />
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

import { OfflineStatusBanner } from "@/components/offline-status-banner";

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        <Toaster />
        <OfflineStatusBanner />
        <AppContent />
      </LanguageProvider>
    </QueryClientProvider>
  );
}

export default App;

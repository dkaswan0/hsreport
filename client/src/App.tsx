import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import LayoutShell from "@/components/layout-shell";
import Dashboard from "@/pages/dashboard";
import NewInspection from "@/pages/new-inspection";
import InspectionDetails from "@/pages/inspection-details";
import FaultLibrary from "@/pages/fault-library";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <LayoutShell>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/inspections" component={Dashboard} />
        <Route path="/inspections/new" component={NewInspection} />
        <Route path="/inspections/:id" component={InspectionDetails} />
        <Route path="/fault-library" component={FaultLibrary} />
        <Route component={NotFound} />
      </Switch>
    </LayoutShell>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Toaster />
      <Router />
    </QueryClientProvider>
  );
}

export default App;

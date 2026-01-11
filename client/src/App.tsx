import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import LayoutShell from "@/components/layout-shell";
import Dashboard from "@/pages/dashboard";
import NewInspection from "@/pages/new-inspection";
import InspectionDetails from "@/pages/inspection-details";
import FaultLibrary from "@/pages/fault-library";
import VehicleData from "@/pages/vehicle-data";
import Settings from "@/pages/settings";
import NotFound from "@/pages/not-found";

import InteractiveReport from "@/pages/interactive-report";
import PublicReport from "@/pages/public-report";
import HandoffPage from "@/pages/handoff";

function Router() {
  return (
    <Switch>
      <Route path="/handoff/:token">
        {(params) => <HandoffPage />}
      </Route>
      <Route path="/view/:token">
        {(params) => <PublicReport />}
      </Route>
      <Route path="/reports/:id">
        {(params) => <InteractiveReport />}
      </Route>
      <Route path="*">
        <LayoutShell>
          <Switch>
            <Route path="/" component={Dashboard} />
            <Route path="/inspections" component={Dashboard} />
            <Route path="/inspections/new" component={NewInspection} />
            <Route path="/inspections/:id" component={InspectionDetails} />
            <Route path="/fault-library" component={FaultLibrary} />
            <Route path="/vehicle-data" component={VehicleData} />
            <Route path="/settings" component={Settings} />
            <Route component={NotFound} />
          </Switch>
        </LayoutShell>
      </Route>
    </Switch>
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

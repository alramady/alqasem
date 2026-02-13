import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import NeighborhoodDetail from "./pages/NeighborhoodDetail";
import Competitors from "./pages/Competitors";
import Listings from "./pages/Listings";
import Seasonal from "./pages/Seasonal";
import ExportPage from "./pages/ExportPage";
import AdminPanel from "./pages/AdminPanel";
import DashboardLayout from "./components/DashboardLayout";

function Router() {
  return (
    <DashboardLayout>
      <Switch>
        <Route path={"/"} component={Home} />
        <Route path={"/neighborhood/:slug"} component={NeighborhoodDetail} />
        <Route path={"/competitors"} component={Competitors} />
        <Route path={"/listings"} component={Listings} />
        <Route path={"/seasonal"} component={Seasonal} />
        <Route path={"/export"} component={ExportPage} />
        <Route path={"/admin"} component={AdminPanel} />
        <Route path={"/404"} component={NotFound} />
        <Route component={NotFound} />
      </Switch>
    </DashboardLayout>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;

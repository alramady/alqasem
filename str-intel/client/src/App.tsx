import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch, Redirect } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Login from "./pages/Login";
import AccessDenied from "./pages/AccessDenied";
import NeighborhoodDetail from "./pages/NeighborhoodDetail";
import Competitors from "./pages/Competitors";
import Listings from "./pages/Listings";
import Seasonal from "./pages/Seasonal";
import ExportPage from "./pages/ExportPage";
import AdminPanel from "./pages/AdminPanel";
import DashboardLayout from "./components/DashboardLayout";
import { useAuth } from "@/_core/hooks/useAuth";
import { Loader2 } from "lucide-react";

/** Auth guard: requires login, redirects to /login if not authenticated */
function RequireAuth({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Redirect to="/login" />;
  }

  return <>{children}</>;
}

/** Route guard: redirects non-admins away from /admin */
function AdminRoute() {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user || user.role !== "admin") {
    return <Redirect to="/access-denied" />;
  }
  return <AdminPanel />;
}

/** Route guard: blocks viewers from export page */
function ExportRoute() {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user || user.role === "viewer") {
    return <Redirect to="/access-denied" />;
  }
  return <ExportPage />;
}

function AuthenticatedRoutes() {
  return (
    <RequireAuth>
      <DashboardLayout>
        <Switch>
          <Route path={"/"} component={Home} />
          <Route path={"/neighborhood/:slug"} component={NeighborhoodDetail} />
          <Route path={"/competitors"} component={Competitors} />
          <Route path={"/listings"} component={Listings} />
          <Route path={"/seasonal"} component={Seasonal} />
          <Route path={"/export"} component={ExportRoute} />
          <Route path={"/admin"} component={AdminRoute} />
          <Route path={"/404"} component={NotFound} />
          <Route component={NotFound} />
        </Switch>
      </DashboardLayout>
    </RequireAuth>
  );
}

function Router() {
  return (
    <Switch>
      <Route path={"/login"} component={Login} />
      <Route path={"/access-denied"} component={AccessDenied} />
      <Route>{() => <AuthenticatedRoutes />}</Route>
    </Switch>
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

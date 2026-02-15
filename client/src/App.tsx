import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { LanguageProvider } from "./contexts/LanguageContext";
import { SiteConfigProvider } from "./contexts/SiteConfigContext";
import { CustomerAuthProvider } from "./contexts/CustomerAuthContext";
import Home from "./pages/Home";
import { lazy, Suspense } from "react";
import CookieConsent from "./components/CookieConsent";
import SEO from "./components/SEO";
import GoogleAnalytics from "./components/GoogleAnalytics";

// Lazy load public pages
const AboutPage = lazy(() => import("./pages/About"));
const ServicesPage = lazy(() => import("./pages/Services"));
const PropertiesPage = lazy(() => import("./pages/Properties"));
const PropertyDetailPage = lazy(() => import("./pages/PropertyDetail"));
const ProjectsPage = lazy(() => import("./pages/Projects"));
const ProjectDetailPage = lazy(() => import("./pages/ProjectDetail"));
const ContactPage = lazy(() => import("./pages/Contact"));
const AddPropertyPage = lazy(() => import("./pages/AddProperty"));
const RequestPropertyPage = lazy(() => import("./pages/RequestProperty"));
const CMSPage = lazy(() => import("./pages/CMSPage"));
const FavoritesPage = lazy(() => import("./pages/Favorites"));
const ComparePage = lazy(() => import("./pages/Compare"));
const PrivacyPolicyPage = lazy(() => import("./pages/PrivacyPolicy"));
const IqarLicensePage = lazy(() => import("./pages/IqarLicense"));
const CustomerLoginPage = lazy(() => import("./pages/CustomerLogin"));
const CustomerRegisterPage = lazy(() => import("./pages/CustomerRegister"));
const CustomerAccountPage = lazy(() => import("./pages/CustomerAccount"));

// Lazy load admin pages
const AdminLogin = lazy(() => import("./pages/admin/Login"));
const AdminDashboard = lazy(() => import("./pages/admin/Dashboard"));
const AdminUsers = lazy(() => import("./pages/admin/Users"));
const AdminProperties = lazy(() => import("./pages/admin/Properties"));
const AdminProjects = lazy(() => import("./pages/admin/Projects"));
const AdminInquiries = lazy(() => import("./pages/admin/Inquiries"));
const AdminCMS = lazy(() => import("./pages/admin/CMS"));
const AdminMedia = lazy(() => import("./pages/admin/Media"));
const AdminReports = lazy(() => import("./pages/admin/Reports"));
const AdminSettings = lazy(() => import("./pages/admin/Settings"));
const AdminAuditLog = lazy(() => import("./pages/admin/AuditLog"));
const AdminNotifications = lazy(() => import("./pages/admin/Notifications"));
const AdminMessages = lazy(() => import("./pages/admin/Messages"));
const AdminGuides = lazy(() => import("./pages/admin/Guides"));
const AdminPermissions = lazy(() => import("./pages/admin/Permissions"));
const AdminProfile = lazy(() => import("./pages/admin/Profile"));
const AdminForgotPassword = lazy(() => import("./pages/admin/ForgotPassword"));
const AdminResetPassword = lazy(() => import("./pages/admin/ResetPassword"));
const AdminSessions = lazy(() => import("./pages/admin/Sessions"));
const AdminActivityDashboard = lazy(() => import("./pages/admin/ActivityDashboard"));
const AdminCitiesDistricts = lazy(() => import("./pages/admin/CitiesDistricts"));
const AdminAgencies = lazy(() => import("./pages/admin/Agencies"));
const AdminAgents = lazy(() => import("./pages/admin/Agents"));
const AdminFinancingRequests = lazy(() => import("./pages/admin/FinancingRequests"));
const AgenciesPage = lazy(() => import("./pages/Agencies"));
const AgencyProfilePage = lazy(() => import("./pages/AgencyProfile"));
const AgentProfilePage = lazy(() => import("./pages/AgentProfile"));

function PageFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-[#c8a45e] border-t-transparent rounded-full animate-spin" />
        <div className="text-[#0f1b33] text-lg font-semibold">
          جاري التحميل...
        </div>
      </div>
    </div>
  );
}

function AdminFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f8f6f3]">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-[#1a2b4a] border-t-transparent rounded-full animate-spin" />
        <div className="text-[#1a2b4a] text-lg font-semibold">
          جاري التحميل...
        </div>
      </div>
    </div>
  );
}

function Router() {
  return (
    <Switch>
      {/* Public website pages */}
      <Route path="/" component={Home} />
      <Route path="/about">
        <Suspense fallback={<PageFallback />}><AboutPage /></Suspense>
      </Route>
      <Route path="/services">
        <Suspense fallback={<PageFallback />}><ServicesPage /></Suspense>
      </Route>
      <Route path="/properties">
        <Suspense fallback={<PageFallback />}><PropertiesPage /></Suspense>
      </Route>
      <Route path="/properties/:id">
        {(params) => <Suspense fallback={<PageFallback />}><ErrorBoundary fallbackMode="inline"><PropertyDetailPage id={params.id} /></ErrorBoundary></Suspense>}
      </Route>
      <Route path="/projects">
        <Suspense fallback={<PageFallback />}><ProjectsPage /></Suspense>
      </Route>
      <Route path="/projects/:id">
        {(params) => <Suspense fallback={<PageFallback />}><ErrorBoundary fallbackMode="inline"><ProjectDetailPage id={params.id} /></ErrorBoundary></Suspense>}
      </Route>
      <Route path="/contact">
        <Suspense fallback={<PageFallback />}><ErrorBoundary fallbackMode="inline"><ContactPage /></ErrorBoundary></Suspense>
      </Route>
      <Route path="/add-property">
        <Suspense fallback={<PageFallback />}><AddPropertyPage /></Suspense>
      </Route>
      <Route path="/request-property">
        <Suspense fallback={<PageFallback />}><RequestPropertyPage /></Suspense>
      </Route>

      <Route path="/favorites">
        <Suspense fallback={<PageFallback />}><FavoritesPage /></Suspense>
      </Route>
      <Route path="/compare">
        <Suspense fallback={<PageFallback />}><ComparePage /></Suspense>
      </Route>
      <Route path="/privacy-policy">
        <Suspense fallback={<PageFallback />}><PrivacyPolicyPage /></Suspense>
      </Route>
      <Route path="/iqar-license">
        <Suspense fallback={<PageFallback />}><IqarLicensePage /></Suspense>
      </Route>

      {/* Customer account routes */}
      <Route path="/login">
        <Suspense fallback={<PageFallback />}><CustomerLoginPage /></Suspense>
      </Route>
      <Route path="/register">
        <Suspense fallback={<PageFallback />}><CustomerRegisterPage /></Suspense>
      </Route>
      <Route path="/account">
        <Suspense fallback={<PageFallback />}><CustomerAccountPage /></Suspense>
      </Route>

      {/* Dynamic CMS pages - catch-all for /page/:slug */}
      <Route path="/page/:slug">
        {(params) => <Suspense fallback={<PageFallback />}><CMSPage slug={params.slug} /></Suspense>}
      </Route>

      {/* Admin routes */}
      <Route path="/admin/login">
        <Suspense fallback={<AdminFallback />}><AdminLogin /></Suspense>
      </Route>
      <Route path="/admin/forgot-password">
        <Suspense fallback={<AdminFallback />}><AdminForgotPassword /></Suspense>
      </Route>
      <Route path="/admin/reset-password">
        <Suspense fallback={<AdminFallback />}><AdminResetPassword /></Suspense>
      </Route>
      <Route path="/admin/sessions">
        <Suspense fallback={<AdminFallback />}><AdminSessions /></Suspense>
      </Route>
      <Route path="/admin/activity">
        <Suspense fallback={<AdminFallback />}><AdminActivityDashboard /></Suspense>
      </Route>
      <Route path="/admin/cities-districts">
        <Suspense fallback={<AdminFallback />}><AdminCitiesDistricts /></Suspense>
      </Route>
      <Route path="/admin/agencies">
        <Suspense fallback={<AdminFallback />}><AdminAgencies /></Suspense>
      </Route>
      <Route path="/admin/agents">
        <Suspense fallback={<AdminFallback />}><AdminAgents /></Suspense>
      </Route>
      <Route path="/admin/financing-requests">
        <Suspense fallback={<AdminFallback />}><AdminFinancingRequests /></Suspense>
      </Route>
      <Route path="/admin">
        <Suspense fallback={<AdminFallback />}><AdminDashboard /></Suspense>
      </Route>
      <Route path="/admin/dashboard">
        <Suspense fallback={<AdminFallback />}><AdminDashboard /></Suspense>
      </Route>
      <Route path="/admin/users">
        <Suspense fallback={<AdminFallback />}><AdminUsers /></Suspense>
      </Route>
      <Route path="/admin/permissions">
        <Suspense fallback={<AdminFallback />}><AdminPermissions /></Suspense>
      </Route>
      <Route path="/admin/properties">
        <Suspense fallback={<AdminFallback />}><AdminProperties /></Suspense>
      </Route>
      <Route path="/admin/projects">
        <Suspense fallback={<AdminFallback />}><AdminProjects /></Suspense>
      </Route>
      <Route path="/admin/inquiries">
        <Suspense fallback={<AdminFallback />}><AdminInquiries /></Suspense>
      </Route>
      <Route path="/admin/cms">
        <Suspense fallback={<AdminFallback />}><AdminCMS /></Suspense>
      </Route>
      <Route path="/admin/media">
        <Suspense fallback={<AdminFallback />}><AdminMedia /></Suspense>
      </Route>
      <Route path="/admin/reports">
        <Suspense fallback={<AdminFallback />}><AdminReports /></Suspense>
      </Route>
      <Route path="/admin/settings">
        <Suspense fallback={<AdminFallback />}><AdminSettings /></Suspense>
      </Route>
      <Route path="/admin/audit-log">
        <Suspense fallback={<AdminFallback />}><AdminAuditLog /></Suspense>
      </Route>
      <Route path="/admin/notifications">
        <Suspense fallback={<AdminFallback />}><AdminNotifications /></Suspense>
      </Route>
      <Route path="/admin/messages">
        <Suspense fallback={<AdminFallback />}><AdminMessages /></Suspense>
      </Route>
      <Route path="/admin/guides">
        <Suspense fallback={<AdminFallback />}><AdminGuides /></Suspense>
      </Route>
      <Route path="/admin/profile">
        <Suspense fallback={<AdminFallback />}><AdminProfile /></Suspense>
      </Route>

      <Route path="/agencies">
        <Suspense fallback={<PageFallback />}><AgenciesPage /></Suspense>
      </Route>
      <Route path="/agency/:slug">
        <Suspense fallback={<PageFallback />}><AgencyProfilePage /></Suspense>
      </Route>
      <Route path="/agent/:slug">
        <Suspense fallback={<PageFallback />}><AgentProfilePage /></Suspense>
      </Route>
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <LanguageProvider>
        <SiteConfigProvider>
          <ThemeProvider defaultTheme="light">
            <TooltipProvider>
              <CustomerAuthProvider>
                <a href="#main-content" className="skip-to-content">Skip to content</a>
                <Toaster position="top-center" richColors />
                <SEO />
                <GoogleAnalytics />
                <div id="main-content">
                  <Router />
                </div>
                <CookieConsent />
              </CustomerAuthProvider>
            </TooltipProvider>
          </ThemeProvider>
        </SiteConfigProvider>
      </LanguageProvider>
    </ErrorBoundary>
  );
}

export default App;

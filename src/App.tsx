import { MotionConfig } from "framer-motion";
import {
  Component,
  lazy,
  Suspense,
  type ErrorInfo,
  type ReactNode,
} from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  Outlet,
  useLocation,
} from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import AppLayout from "@/components/layout/AppLayout";
import Index from "@/pages/Index";

const Calendar = lazy(() => import("@/pages/Calendar"));
const Admin = lazy(() => import("@/pages/Admin"));
const Developers = lazy(() => import("@/pages/Developers"));
const Support = lazy(() => import("@/pages/Support"));
const OAuthConsent = lazy(() => import("@/pages/OAuthConsent"));
const Privacy = lazy(() => import("@/pages/legal/Privacy"));
const Terms = lazy(() => import("@/pages/legal/Terms"));
const Cookies = lazy(() => import("@/pages/legal/Cookies"));
const Login = lazy(() => import("@/pages/Login"));
const Register = lazy(() => import("@/pages/Register"));
const Dashboard = lazy(() => import("@/pages/Dashboard"));
const Tasks = lazy(() => import("@/pages/Tasks"));
const Habits = lazy(() => import("@/pages/Habits"));
const Focus = lazy(() => import("@/pages/Focus"));
const Journal = lazy(() => import("@/pages/Journal"));
const Goals = lazy(() => import("@/pages/Goals"));

const Analysis = lazy(() => import("@/pages/Analysis"));
const AIAssistant = lazy(() => import("@/pages/AIAssistant"));

const Settings = lazy(() => import("@/pages/Settings"));
const Profile = lazy(() => import("@/pages/Profile"));
const Student = lazy(() => import("@/pages/Student"));
const Connections = lazy(() => import("@/pages/Connections"));
const Credits = lazy(() => import("@/pages/Credits"));
const UpdatePassword = lazy(() => import("@/pages/UpdatePassword"));
const Preview = lazy(() => import("@/pages/Preview"));
const NotFound = lazy(() => import("@/pages/NotFound"));
const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 30_000, retry: 1, refetchOnWindowFocus: true },
  },
});

function Loading() {
  return (
    <div role="status" className="grid min-h-[50dvh] place-items-center">
      <span className="text-sm text-muted-foreground">
        Chargement de votre espace…
      </span>
    </div>
  );
}
function ProtectedLayout() {
  const { user, isLoading } = useAuth();
  const location = useLocation();
  if (isLoading) return <Loading />;
  if (!user)
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  return (
    <AppLayout key={user.id}>
      <Outlet />
    </AppLayout>
  );
}
class ErrorBoundary extends Component<
  { children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch(_error: Error, _info: ErrorInfo) {
    /* Never log user content. */
  }
  render() {
    if (this.state.failed)
      return (
        <div role="alert" className="mx-auto max-w-md p-10">
          <h1 className="text-2xl font-semibold">
            Cet écran n’a pas pu s’afficher.
          </h1>
          <p className="my-4 text-muted-foreground">
            Rechargez la page pour réessayer. Vos données enregistrées sont
            conservées.
          </p>
          <button
            className="rounded-xl bg-primary px-4 py-3 text-primary-foreground"
            onClick={() => window.location.reload()}
          >
            Recharger
          </button>
        </div>
      );
    return this.props.children;
  }
}
export default function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <MotionConfig reducedMotion="user">
          <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
            <TooltipProvider>
              <Toaster />
              <Sonner />
              <BrowserRouter>
                <AuthProvider>
                  <Suspense fallback={<Loading />}>
                    <Routes>
                      <Route path="/" element={<Index />} />
                      <Route path="/login" element={<Login />} />
                      <Route path="/register" element={<Register />} />
                      <Route path="/forgot-password" element={<Login />} />
                      <Route
                        path="/reset-password"
                        element={<UpdatePassword />}
                      />
                      <Route path="/legal/privacy" element={<Privacy />} />
                      <Route path="/legal/terms" element={<Terms />} />
                      <Route path="/legal/cookies" element={<Cookies />} />
                      <Route path="/oauth/consent" element={<OAuthConsent />} />
                      <Route
                        path="/update-password"
                        element={<UpdatePassword />}
                      />
                      <Route
                        path="/preview"
                        element={
                          <AppLayout>
                            <Preview />
                          </AppLayout>
                        }
                      />
                      <Route element={<ProtectedLayout />}>
                        <Route path="/dashboard" element={<Dashboard />} />
                        <Route path="/calendar" element={<Calendar />} />
                        <Route
                          path="/studies"
                          element={<Navigate to="/student" replace />}
                        />
                        <Route
                          path="/autopilot"
                          element={<Navigate to="/ai-assistant" replace />}
                        />
                        <Route
                          path="/auto-pilot"
                          element={<Navigate to="/ai-assistant" replace />}
                        />
                        <Route path="/admin" element={<Admin />} />
                        <Route path="/developers" element={<Developers />} />
                        <Route path="/support" element={<Support />} />
                        <Route path="/tasks" element={<Tasks />} />
                        <Route path="/student" element={<Student />} />
                        <Route path="/connections" element={<Connections />} />
                        <Route path="/credits" element={<Credits />} />
                        <Route path="/habits" element={<Habits />} />
                        <Route path="/goals" element={<Goals />} />
                        <Route path="/focus" element={<Focus />} />
                        <Route path="/journal" element={<Journal />} />
                        <Route
                          path="/reflection"
                          element={<Navigate to="/journal" replace />}
                        />
                        <Route path="/analysis" element={<Analysis />} />
                        <Route path="/ai-assistant" element={<AIAssistant />} />
                        <Route path="/profile" element={<Profile />} />
                        <Route
                          path="/badges"
                          element={<Navigate to="/goals" replace />}
                        />
                        <Route path="/settings" element={<Settings />} />
                      </Route>
                      <Route path="*" element={<NotFound />} />
                    </Routes>
                  </Suspense>
                </AuthProvider>
              </BrowserRouter>
            </TooltipProvider>
          </ThemeProvider>
        </MotionConfig>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

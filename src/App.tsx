import { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { DesignModeProvider } from "./contexts/DesignModeContext";
import { AuthProvider, useAuth } from "./hooks/useAuth";
import { XPNotificationProvider } from "./components/gamification/XPNotification";
import AppLayout from "./components/layout/AppLayout";

// Lazy loaded pages for better performance
const Index = lazy(() => import("./pages/Index"));
const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Tasks = lazy(() => import("./pages/Tasks"));
const Habits = lazy(() => import("./pages/Habits"));
const Focus = lazy(() => import("./pages/Focus"));
const Journal = lazy(() => import("./pages/Journal"));
const Goals = lazy(() => import("./pages/Goals"));
const AIAssistant = lazy(() => import("./pages/AIAssistant"));
const Reflection = lazy(() => import("./pages/Reflection"));
const Settings = lazy(() => import("./pages/Settings"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Calendar = lazy(() => import("./pages/Calendar"));
const Gamification = lazy(() => import("./pages/Gamification"));
const Admin = lazy(() => import("./pages/Admin"));

// Legal pages
const Privacy = lazy(() => import("./pages/legal/Privacy"));
const Terms = lazy(() => import("./pages/legal/Terms"));
const Cookies = lazy(() => import("./pages/legal/Cookies"));

const queryClient = new QueryClient();

interface ProtectedRouteProps {
  children: React.ReactNode;
}

function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, isLoading } = useAuth();
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
}

// Loading fallback component
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
  </div>
);

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <DesignModeProvider>
          <TooltipProvider>
            <XPNotificationProvider>
              <Toaster />
              <Sonner />
              <BrowserRouter>
                <AuthProvider>
                  <Suspense fallback={<PageLoader />}>
                    <Routes>
                      <Route path="/" element={<Index />} />
                      <Route path="/index" element={<Index />} />
                      <Route path="/login" element={<Login />} />
                      <Route path="/register" element={<Register />} />
                      <Route path="/forgot-password" element={<ForgotPassword />} />
                      <Route path="/reset-password" element={<ResetPassword />} />
                      
                      {/* Legal pages */}
                      <Route path="/legal/privacy" element={<Privacy />} />
                      <Route path="/legal/terms" element={<Terms />} />
                      <Route path="/legal/cookies" element={<Cookies />} />
                      
                      {/* Protected routes */}
                      <Route path="/dashboard" element={
                        <ProtectedRoute>
                          <AppLayout>
                            <Dashboard />
                          </AppLayout>
                        </ProtectedRoute>
                      } />
                      <Route path="/tasks" element={
                        <ProtectedRoute>
                          <AppLayout>
                            <Tasks />
                          </AppLayout>
                        </ProtectedRoute>
                      } />
                      <Route path="/habits" element={
                        <ProtectedRoute>
                          <AppLayout>
                            <Habits />
                          </AppLayout>
                        </ProtectedRoute>
                      } />
                      <Route path="/focus" element={
                        <ProtectedRoute>
                          <AppLayout>
                            <Focus />
                          </AppLayout>
                        </ProtectedRoute>
                      } />
                      <Route path="/journal" element={
                        <ProtectedRoute>
                          <AppLayout>
                            <Journal />
                          </AppLayout>
                        </ProtectedRoute>
                      } />
                      <Route path="/goals" element={
                        <ProtectedRoute>
                          <AppLayout>
                            <Goals />
                          </AppLayout>
                        </ProtectedRoute>
                      } />
                      <Route path="/ai-assistant" element={
                        <ProtectedRoute>
                          <AppLayout>
                            <AIAssistant />
                          </AppLayout>
                        </ProtectedRoute>
                      } />
                      <Route path="/reflection" element={
                        <ProtectedRoute>
                          <AppLayout>
                            <Reflection />
                          </AppLayout>
                        </ProtectedRoute>
                      } />
                      <Route path="/settings" element={
                        <ProtectedRoute>
                          <AppLayout>
                            <Settings />
                          </AppLayout>
                        </ProtectedRoute>
                      } />
                      <Route path="/calendar" element={
                        <ProtectedRoute>
                          <AppLayout>
                            <Calendar />
                          </AppLayout>
                        </ProtectedRoute>
                      } />
                      <Route path="/gamification" element={
                        <ProtectedRoute>
                          <AppLayout>
                            <Gamification />
                          </AppLayout>
                        </ProtectedRoute>
                      } />
                      <Route path="/admin" element={
                        <ProtectedRoute>
                          <AppLayout>
                            <Admin />
                          </AppLayout>
                        </ProtectedRoute>
                      } />
                      
                      {/* Redirects */}
                      <Route path="/badges" element={<Navigate to="/gamification" replace />} />
                      <Route path="/profile" element={<Navigate to="/ai-assistant" replace />} />
                      <Route path="/analysis" element={<Navigate to="/ai-assistant" replace />} />
                      
                      {/* 404 */}
                      <Route path="*" element={<NotFound />} />
                    </Routes>
                  </Suspense>
                </AuthProvider>
              </BrowserRouter>
            </XPNotificationProvider>
          </TooltipProvider>
        </DesignModeProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;

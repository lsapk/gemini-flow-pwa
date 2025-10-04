
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Tasks from "./pages/Tasks";
import Habits from "./pages/Habits";
import Focus from "./pages/Focus";
import Journal from "./pages/Journal";
import Goals from "./pages/Goals";
import Badges from "./pages/Badges";
import Analysis from "./pages/Analysis";
import AIAssistant from "./pages/AIAssistant";
import Reflection from "./pages/Reflection";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";
import Profile from "./pages/Profile";
import Calendar from "./pages/Calendar";
import AppLayout from "./components/layout/AppLayout";
import { AuthProvider, useAuth } from "./hooks/useAuth";

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

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <AuthProvider>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/index" element={<Index />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
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
                <Route path="/badges" element={
                  <ProtectedRoute>
                    <AppLayout>
                      <Badges />
                    </AppLayout>
                  </ProtectedRoute>
                } />
                <Route path="/analysis" element={
                  <ProtectedRoute>
                    <AppLayout>
                      <Analysis />
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
                <Route path="/profile" element={
                  <ProtectedRoute>
                    <AppLayout>
                      <Profile />
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
                <Route path="*" element={<NotFound />} />
              </Routes>
            </AuthProvider>
          </BrowserRouter>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;

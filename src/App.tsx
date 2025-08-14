
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { AuthProvider } from "@/hooks/useAuth";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Tasks from "./pages/Tasks";
import Habits from "./pages/Habits";
import Goals from "./pages/Goals";
import Focus from "./pages/Focus";
import Journal from "./pages/Journal";
import Analysis from "./pages/Analysis";
import Settings from "./pages/Settings";
import AIAssistant from "./pages/AIAssistant";
import Badges from "./pages/Badges";
import Reflection from "./pages/Reflection";
import PersonalityProfile from "./pages/PersonalityProfile";
import NotFound from "./pages/NotFound";
import AppLayout from "./components/layout/AppLayout";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error: any) => {
        // Don't retry on auth errors
        if (error?.status === 401 || error?.code === 'PGRST301') {
          return false;
        }
        return failureCount < 3;
      },
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
        <TooltipProvider>
          <Toaster />
          <AuthProvider>
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/dashboard" element={<AppLayout><Dashboard /></AppLayout>} />
                <Route path="/tasks" element={<AppLayout><Tasks /></AppLayout>} />
                <Route path="/habits" element={<AppLayout><Habits /></AppLayout>} />
                <Route path="/goals" element={<AppLayout><Goals /></AppLayout>} />
                <Route path="/focus" element={<AppLayout><Focus /></AppLayout>} />
                <Route path="/journal" element={<AppLayout><Journal /></AppLayout>} />
                <Route path="/analysis" element={<AppLayout><Analysis /></AppLayout>} />
                <Route path="/settings" element={<AppLayout><Settings /></AppLayout>} />
                <Route path="/ai-assistant" element={<AppLayout><AIAssistant /></AppLayout>} />
                <Route path="/badges" element={<AppLayout><Badges /></AppLayout>} />
                <Route path="/reflection" element={<AppLayout><Reflection /></AppLayout>} />
                <Route path="/personality-profile" element={<AppLayout><PersonalityProfile /></AppLayout>} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </AuthProvider>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;


import { useAuth } from "@/hooks/useAuth";
import { Navigate, useLocation } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAIActions } from "@/hooks/useAIActions";
import AIActionConfirmation from "@/components/AIActionConfirmation";
import Sidebar from "./Sidebar";
import MobileHeader from "./MobileHeader";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { useState } from "react";

interface AppLayoutProps {
  children: React.ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  const { user, isLoading } = useAuth();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const {
    pendingActions,
    showConfirmation,
    confirmActions,
    cancelActions
  } = useAIActions();

  useEffect(() => {
    if (user) {
      console.log("Auth state changed:", user ? "SIGNED_IN" : "SIGNED_OUT");
    }
  }, [user]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log("App is visible, refreshing data");
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  const isAIAssistantPage = location.pathname === '/ai-assistant';

  if (isAIAssistantPage) {
    return (
      <>
        {children}
        <Toaster />
        {showConfirmation && pendingActions.length > 0 && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <AIActionConfirmation
              actions={pendingActions}
              onConfirm={confirmActions}
              onCancel={cancelActions}
            />
          </div>
        )}
      </>
    );
  }

  return (
    <div className="flex min-h-screen bg-background">
      {/* Mobile Header */}
      <div className="md:hidden">
        <MobileHeader onMenuClick={() => setIsMobileMenuOpen(true)} />
        <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
          <SheetContent side="left" className="p-0 w-64">
            <Sidebar className="border-0 static" onItemClick={() => setIsMobileMenuOpen(false)} />
          </SheetContent>
        </Sheet>
      </div>

      {/* Desktop Sidebar */}
      <div className="hidden md:block">
        <Sidebar />
      </div>

      {/* Main Content */}
      <main className="flex-1 pt-16 md:pt-0 overflow-x-hidden">
        {children}
      </main>

      <Toaster />
      
      {/* AI Action Confirmation Modal */}
      {showConfirmation && pendingActions.length > 0 && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <AIActionConfirmation
            actions={pendingActions}
            onConfirm={confirmActions}
            onCancel={cancelActions}
          />
        </div>
      )}
    </div>
  );
}

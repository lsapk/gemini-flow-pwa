
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Navigate } from "react-router-dom";
import Sidebar from "./Sidebar";
import MobileHeader from "./MobileHeader";
import { Sheet, SheetContent } from "@/components/ui/sheet";

interface AppLayoutProps {
  children: React.ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  const { user, isLoading } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  return (
    <div className="min-h-screen bg-background">
      {/* Prevent zoom on mobile */}
      <style>
        {`
          html {
            touch-action: manipulation;
          }
          input, textarea, select {
            font-size: 16px !important;
          }
          @media screen and (max-width: 768px) {
            body {
              overflow-x: hidden;
            }
          }
        `}
      </style>
      
      {/* Mobile Header */}
      <MobileHeader onMenuClick={() => setIsMobileMenuOpen(true)} />
      
      {/* Mobile Navigation Sheet */}
      <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
        <SheetContent side="left" className="p-0 w-64">
          <Sidebar className="border-0 static" onItemClick={closeMobileMenu} />
        </SheetContent>
      </Sheet>

      <div className="flex">
        {/* Desktop Sidebar - Fixed position */}
        <div className="hidden md:block">
          <Sidebar className="fixed top-0 left-0 h-full z-40" />
        </div>

        {/* Main Content - Prevent horizontal overflow on mobile */}
        <main className="flex-1 pt-14 md:pt-0 md:ml-64 md:pl-4 w-full min-w-0 overflow-x-hidden">
          <div className="w-full max-w-full px-3 sm:px-4 md:px-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

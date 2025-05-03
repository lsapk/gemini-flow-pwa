
import { useState, useEffect } from "react";
import { Outlet, Navigate, useLocation } from "react-router-dom";
import Sidebar from "./Sidebar";
import MobileHeader from "./MobileHeader";
import { useIsMobile } from "@/hooks/use-mobile";

// Placeholder authentication check - will be replaced with Supabase auth
const useAuth = () => {
  // This is temporary and will be replaced with actual Supabase auth
  const isAuthenticated = localStorage.getItem("isAuthenticated") === "true";
  return { isAuthenticated };
};

const AppLayout = () => {
  const { isAuthenticated } = useAuth();
  const isMobile = useIsMobile();
  const [sidebarOpen, setSidebarOpen] = useState(!isMobile);
  const location = useLocation();

  useEffect(() => {
    if (isMobile) {
      setSidebarOpen(false);
    } else {
      setSidebarOpen(true);
    }
  }, [isMobile]);

  // If not authenticated, redirect to login
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />
      
      <div className="flex flex-col flex-1 w-0 overflow-hidden">
        {isMobile && (
          <MobileHeader sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
        )}
        
        <main className="relative flex-1 overflow-y-auto focus:outline-none">
          <div className="py-6 px-4 sm:px-6 md:px-8">
            <div className="animate-fade-in">
              <Outlet />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default AppLayout;

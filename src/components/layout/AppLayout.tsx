
import { useState, useEffect } from "react";
import { Outlet, Navigate, useLocation } from "react-router-dom";
import Sidebar from "./Sidebar";
import MobileHeader from "./MobileHeader";
import { useMediaQuery } from "@/hooks/use-mobile";
import { useAuth } from "@/hooks/useAuth";
import { AnimatePresence, motion } from "framer-motion";

interface AppLayoutProps {
  children: React.ReactNode;
}

const AppLayout = ({ children }: AppLayoutProps) => {
  const { user } = useAuth();
  const isMobile = useMediaQuery("(max-width: 768px)");
  const orientation = useMediaQuery("(orientation: portrait)") ? "portrait" : "landscape";
  const [sidebarOpen, setSidebarOpen] = useState(!isMobile);
  const [isLoading, setIsLoading] = useState(true);
  const location = useLocation();

  // Check if user data is loaded
  useEffect(() => {
    if (user !== undefined) {
      setIsLoading(false);
    }
  }, [user]);

  // Adjust sidebar visibility based on screen size
  useEffect(() => {
    if (isMobile) {
      setSidebarOpen(false);
    } else {
      setSidebarOpen(true);
    }
  }, [isMobile]);

  // Open/close sidebar on orientation change on mobile
  useEffect(() => {
    if (isMobile && orientation === "landscape") {
      setSidebarOpen(true);
    } else if (isMobile && orientation === "portrait") {
      setSidebarOpen(false);
    }
  }, [orientation, isMobile]);

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          <p className="text-muted-foreground animate-pulse">Chargement...</p>
        </div>
      </div>
    );
  }

  // If not authenticated, redirect to login
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <AnimatePresence mode="wait">
        {sidebarOpen && (
          <motion.div
            key="sidebar"
            initial={{ x: isMobile ? -280 : 0, opacity: isMobile ? 0 : 1 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -280, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className={isMobile ? "fixed z-30 h-full" : "relative"}
          >
            <Sidebar />
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Overlay for mobile sidebar */}
      {isMobile && sidebarOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 bg-black/50 z-20 backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      
      <div className="flex flex-col flex-1 w-0 overflow-hidden">
        {isMobile && (
          <MobileHeader sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
        )}
        
        <motion.main 
          className="relative flex-1 overflow-y-auto focus:outline-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          <div className={`py-4 px-3 sm:px-6 md:px-8 ${isMobile && orientation === 'portrait' ? 'pb-20' : ''}`}>
            <motion.div 
              key={location.pathname}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="animate-fade-in"
            >
              {children}
            </motion.div>
          </div>
        </motion.main>
      </div>
    </div>
  );
};

export default AppLayout;

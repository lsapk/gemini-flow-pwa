
import { useState, useEffect } from "react";
import MobileHeader from "./MobileHeader";
import Sidebar from "./Sidebar";
import { FocusTimer } from "./FocusTimer";

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    // Close sidebar on route change (example using the 'hashchange' event)
    const handleRouteChange = () => {
      setSidebarOpen(false);
    };

    window.addEventListener('hashchange', handleRouteChange);

    return () => {
      window.removeEventListener('hashchange', handleRouteChange);
    };
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <div className="flex">
        {/* Sidebar Desktop - Always visible on desktop */}
        <div className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0">
          <Sidebar />
        </div>

        {/* Mobile Sidebar Overlay */}
        {sidebarOpen && (
          <div 
            className="fixed inset-0 z-40 lg:hidden bg-black/50"
            onClick={() => setSidebarOpen(false)}
          >
            <div className="w-64 h-full bg-background" onClick={(e) => e.stopPropagation()}>
              <Sidebar />
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="flex-1 lg:ml-64">
          {/* Mobile Header */}
          <div className="lg:hidden">
            <MobileHeader onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
          </div>

          {/* Page Content */}
          <main className="min-h-screen lg:min-h-0">
            {children}
          </main>
        </div>
      </div>

      {/* Focus Timer - persiste pendant la navigation */}
      <FocusTimer />
    </div>
  );
}

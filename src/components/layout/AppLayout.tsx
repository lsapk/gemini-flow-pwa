
import { useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import Sidebar from "./Sidebar";
import MobileHeader from "./MobileHeader";
import { Sheet, SheetContent } from "@/components/ui/sheet";

interface AppLayoutProps {
  children?: React.ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();

  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Header */}
      <MobileHeader onMenuClick={() => setIsMobileMenuOpen(true)} />
      
      {/* Mobile Navigation Sheet */}
      <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
        <SheetContent side="left" className="p-0 w-72 border-border/30">
          <Sidebar className="border-0 static bg-transparent" onItemClick={closeMobileMenu} />
        </SheetContent>
      </Sheet>

      <div className="flex">
        {/* Desktop Sidebar - Fixed position */}
        <div className="hidden md:block">
          <Sidebar className="fixed top-0 left-0 h-full z-40" />
        </div>

        {/* Main Content */}
        <main className="flex-1 pt-16 md:pt-0 md:ml-64 min-h-screen">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25, ease: [0.2, 0.8, 0.2, 1] }}
              className="px-4 py-6 sm:p-6 md:p-8 lg:p-8 max-w-[1400px] mx-auto"
            >
              {children || <Outlet />}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}

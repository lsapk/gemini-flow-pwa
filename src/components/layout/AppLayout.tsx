import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useTheme } from "next-themes";
import { Moon, Sun, ArrowUpRight, ChevronRight, WifiOff } from "lucide-react";
import Sidebar, { Brand } from "./Sidebar";
import MobileDock from "./MobileDock";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";

const titles: Record<string, string> = {
  "/dashboard": "Vue d’ensemble",
  "/preview": "Vue d’ensemble",
  "/student": "Espace étudiant",
  "/connections": "Connexions",
  "/tasks": "Mes tâches",
  "/credits": "Crédits IA",
  "/focus": "Concentration",
  "/journal": "Journal",
  "/settings": "Paramètres",
  "/calendar": "Calendrier",
  "/goals": "Objectifs",
  "/habits": "Habitudes",
  "/ai-assistant": "Assistant IA",
  "/analysis": "Analyse",
  "/profile": "Profil IA",
  "/support": "Aide et support",
  "/developers": "API développeurs",
  "/admin": "Administration",
};
export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [online, setOnline] = useState(navigator.onLine);
  const { user } = useAuth();
  const { resolvedTheme, setTheme } = useTheme();
  const location = useLocation();
  useEffect(() => {
    const update = () => setOnline(navigator.onLine);
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);
  const name =
    user?.user_metadata?.display_name ||
    user?.email?.split("@")[0] ||
    "Visiteur";
  return (
    <div className="app-shell min-h-dvh" data-area={location.pathname.slice(1)}>
      <a className="skip-link" href="#main-content">
        Aller au contenu
      </a>
      <div className="workspace-rail fixed inset-y-0 left-0 z-30 hidden md:block">
        <Sidebar />
      </div>
      <div className="workspace-column min-w-0">
        <header className="workspace-header glass-material flex items-center justify-between gap-3 px-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <Link
              to={location.pathname === "/preview" ? "/preview" : "/dashboard"}
              className="md:hidden"
              aria-label="Vue d’ensemble Deepflow"
            >
              <Brand small />
            </Link>
            <span className="hidden items-center gap-3 text-sm text-muted-foreground md:flex">
              <Link
                to={
                  location.pathname === "/preview" ? "/preview" : "/dashboard"
                }
              >
                Mon espace
              </Link>
              <ChevronRight size={14} aria-hidden="true" />
              <span className="text-foreground">
                {titles[location.pathname] || "Développement personnel"}
              </span>
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              aria-label={
                resolvedTheme === "dark"
                  ? "Activer le thème clair"
                  : "Activer le thème sombre"
              }
              onClick={() =>
                setTheme(resolvedTheme === "dark" ? "light" : "dark")
              }
            >
              {resolvedTheme === "dark" ? (
                <Sun size={17} />
              ) : (
                <Moon size={17} />
              )}
            </Button>
            {user ? (
              <Link
                to="/settings"
                className="flex items-center gap-2"
                aria-label="Paramètres du compte"
              >
                <span className="avatar-dot">
                  {String(name).slice(0, 1).toLocaleUpperCase("fr")}
                </span>
                <span className="hidden max-w-32 truncate text-xs font-medium lg:block">
                  {name}
                </span>
              </Link>
            ) : (
              <Link
                to="/register"
                className="inline-flex items-center gap-1.5 text-xs font-medium"
              >
                Créer mon espace
                <ArrowUpRight size={14} />
              </Link>
            )}
          </div>
        </header>
        {!online && (
          <div role="status" className="offline-banner">
            <WifiOff size={16} className="shrink-0" aria-hidden="true" />
            Vous êtes hors ligne. Les modifications et connexions nécessitent
            Internet.
          </div>
        )}
        <main
          id="main-content"
          tabIndex={-1}
          className="workspace-content mx-auto w-full max-w-[1440px] p-4 sm:p-6 xl:p-9"
        >
          {children}
        </main>
      </div>
      <MobileDock />
    </div>
  );
}

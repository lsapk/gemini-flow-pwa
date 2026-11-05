import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useTheme } from "next-themes";
import { Menu, Moon, Sun, ArrowUpRight } from "lucide-react";
import Sidebar, { Brand } from "./Sidebar";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
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
};
export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [online, setOnline] = useState(navigator.onLine);
  const { user } = useAuth();
  const { resolvedTheme, setTheme } = useTheme();
  const location = useLocation();
  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);
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
    <div className="app-shell min-h-dvh">
      <a className="skip-link" href="#main-content">
        Aller au contenu
      </a>
      <div className="fixed inset-y-0 left-0 z-30 hidden md:block">
        <Sidebar />
      </div>
      <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
        <SheetContent side="left" className="w-[280px] p-0">
          <SheetTitle className="sr-only">Navigation Deepflow</SheetTitle>
          <SheetDescription className="sr-only">
            Accéder aux espaces de l’application
          </SheetDescription>
          <Sidebar onItemClick={() => setMenuOpen(false)} />
        </SheetContent>
      </Sheet>
      <div className="min-w-0 md:pl-[244px]">
        <header className="workspace-header flex items-center justify-between gap-3 px-5 md:px-9">
          <div className="flex min-w-0 items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              aria-label="Ouvrir le menu"
              onClick={() => setMenuOpen(true)}
            >
              <Menu size={20} />
            </Button>
            <span className="md:hidden">
              <Brand small />
            </span>
            <span className="hidden items-center gap-3 text-sm text-muted-foreground md:flex">
              Mon espace <span className="text-border">/</span>
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
          <div
            role="status"
            className="border-b bg-amber-50 px-6 py-3 text-sm text-amber-900"
          >
            Vous êtes hors ligne. Les modifications et connexions nécessitent
            Internet.
          </div>
        )}
        <main
          id="main-content"
          tabIndex={-1}
          className="workspace-content mx-auto w-full max-w-[1500px] p-5 md:p-9"
        >
          {children}
        </main>
      </div>
    </div>
  );
}

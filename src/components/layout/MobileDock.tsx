import { type CSSProperties } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import {
  ArrowUpRight,
  BookOpen,
  CalendarDays,
  ChartNoAxesCombined,
  CircleCheck,
  ClipboardList,
  Coins,
  Ellipsis,
  GraduationCap,
  House,
  Link2,
  Plus,
  Settings2,
  Sparkles,
  Target,
  Timer,
} from "lucide-react";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

const moreLinks = [
  [CalendarDays, "Calendrier", "/calendar"],
  [Target, "Objectifs", "/goals"],
  [CircleCheck, "Habitudes", "/habits"],
  [Timer, "Concentration", "/focus"],
  [BookOpen, "Journal", "/journal"],
  [Sparkles, "Assistant IA", "/ai-assistant"],
  [ChartNoAxesCombined, "Analyse", "/analysis"],
  [Sparkles, "Profil IA", "/profile"],
  [Coins, "Crédits IA", "/credits"],
  [Link2, "Connexions", "/connections"],
  [Settings2, "Paramètres", "/settings"],
] as const;

const createLinks = [
  [ClipboardList, "Nouvelle tâche", "/tasks?new=1"],
  [Timer, "Lancer une concentration", "/focus"],
  [BookOpen, "Écrire dans le journal", "/journal"],
] as const;

export default function MobileDock() {
  const { pathname } = useLocation();
  const preview = pathname === "/preview";
  const home = preview ? "/preview" : "/dashboard";
  const activeSlot =
    pathname === home
      ? 0
      : pathname === "/tasks"
        ? 1
        : pathname === "/student"
          ? 3
          : 4;

  return (
    <nav
      className="mobile-dock glass-material md:hidden"
      aria-label="Navigation rapide"
    >
      <span
        className="dock-lens"
        style={{ "--dock-slot": activeSlot } as CSSProperties}
        aria-hidden="true"
      />
      <NavLink end to={home} className="dock-item">
        <House size={19} aria-hidden="true" />
        <span>Accueil</span>
      </NavLink>
      <NavLink to="/tasks" className="dock-item">
        <ClipboardList size={19} aria-hidden="true" />
        <span>Tâches</span>
      </NavLink>
      <Sheet>
        <SheetTrigger className="dock-item dock-create">
          <span className="dock-create-icon">
            <Plus size={19} aria-hidden="true" />
          </span>
          <span>Créer</span>
        </SheetTrigger>
        <SheetContent side="bottom" className="dock-sheet">
          <SheetTitle className="sheet-heading">Créer</SheetTitle>
          <SheetDescription className="mb-5 text-sm text-muted-foreground">
            Choisissez votre prochaine action.
          </SheetDescription>
          <div className="grid gap-2">
            {createLinks.map(([Icon, label, path]) => (
              <SheetClose asChild key={path}>
                <Link className="sheet-link" to={path}>
                  <Icon size={19} aria-hidden="true" />
                  {label}
                  <ArrowUpRight
                    size={15}
                    className="ml-auto"
                    aria-hidden="true"
                  />
                </Link>
              </SheetClose>
            ))}
          </div>
        </SheetContent>
      </Sheet>
      <NavLink to="/student" className="dock-item">
        <GraduationCap size={20} aria-hidden="true" />
        <span>Études</span>
      </NavLink>
      <Sheet>
        <SheetTrigger
          className="dock-item"
          data-selected={activeSlot === 4 ? "true" : undefined}
        >
          <Ellipsis size={20} aria-hidden="true" />
          <span>Plus</span>
        </SheetTrigger>
        <SheetContent side="bottom" className="dock-sheet">
          <SheetTitle className="sheet-heading">Tout Deepflow</SheetTitle>
          <SheetDescription className="mb-5 text-sm text-muted-foreground">
            Retrouvez vos autres espaces.
          </SheetDescription>
          <div className="grid grid-cols-2 gap-2">
            {moreLinks.map(([Icon, label, path]) => (
              <SheetClose asChild key={path}>
                <NavLink className="sheet-link" to={path}>
                  <Icon size={18} aria-hidden="true" />
                  {label}
                </NavLink>
              </SheetClose>
            ))}
          </div>
        </SheetContent>
      </Sheet>
    </nav>
  );
}

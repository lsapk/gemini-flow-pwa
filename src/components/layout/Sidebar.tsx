import { useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  CalendarDays,
  CheckSquare2,
  GraduationCap,
  Timer,
  BookOpen,
  Sparkles,
  Settings2,
  Link2,
  ArrowUpRight,
  Target,
  Activity,
  ChevronDown,
  Coins,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SidebarProps {
  className?: string;
  onItemClick?: () => void;
}
const primary = [
  { icon: LayoutDashboard, label: "Vue d’ensemble", path: "/dashboard" },
  { icon: CheckSquare2, label: "Mes tâches", path: "/tasks" },
  { icon: GraduationCap, label: "Espace étudiant", path: "/student" },
  { icon: CalendarDays, label: "Calendrier", path: "/calendar" },
  { icon: Timer, label: "Concentration", path: "/focus" },
  { icon: BookOpen, label: "Journal", path: "/journal" },
];
const secondary = [
  { icon: Target, label: "Objectifs", path: "/goals" },
  { icon: Activity, label: "Habitudes", path: "/habits" },

  { icon: Activity, label: "Analyse", path: "/analysis" },

  { icon: Sparkles, label: "Profil IA", path: "/profile" },
];
export function Brand({ small = false }: { small?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2.5">
      <span className={cn("brand-mark", small && "h-7 w-7")} aria-hidden="true">
        <span />
        <span />
        <span />
      </span>
      <span
        className="brand-word text-[21px] font-semibold tracking-[-0.9px]"
        translate="no"
      >
        deepflow<span className="text-primary">.</span>
      </span>
    </span>
  );
}
export default function Sidebar({ className, onItemClick }: SidebarProps) {
  const [expanded, setExpanded] = useState(false);
  const location = useLocation();
  const renderLink = (item: (typeof primary)[number]) => (
    <NavLink
      key={item.path}
      to={item.path}
      title={item.label}
      onClick={onItemClick}
      className={({ isActive }) =>
        cn(
          "sidebar-link",
          (isActive ||
            (location.pathname === "/preview" && item.path === "/dashboard")) &&
            "sidebar-link-active",
        )
      }
    >
      <item.icon size={18} strokeWidth={1.65} aria-hidden="true" />
      <span className="sidebar-link-label">{item.label}</span>
    </NavLink>
  );
  return (
    <aside
      className={cn("deepflow-sidebar glass-material flex flex-col", className)}
    >
      <Link
        to="/"
        className="sidebar-brand px-7 pb-9 pt-8"
        aria-label="Deepflow, accueil"
        onClick={onItemClick}
      >
        <Brand />
      </Link>
      <div className="min-h-0 flex-1 overflow-y-auto px-4">
        <p className="nav-caption">VOTRE ESPACE</p>
        <nav aria-label="Navigation principale" className="space-y-1">
          {primary.map(renderLink)}
        </nav>
        <button
          className="sidebar-expand mt-5 flex min-h-11 w-full items-center justify-between px-3 text-xs font-medium text-muted-foreground"
          onClick={() => setExpanded(!expanded)}
          aria-expanded={expanded}
          title="Développement personnel"
        >
          <span className="sidebar-link-label">Développement personnel</span>
          <ChevronDown size={14} className={expanded ? "rotate-180" : ""} />
        </button>
        {expanded && (
          <nav aria-label="Développement personnel" className="space-y-1">
            {secondary.map(renderLink)}
          </nav>
        )}
        <p className="nav-caption sidebar-services-caption mt-7">
          AVEC DEEPFLOW
        </p>
        <nav aria-label="Services" className="space-y-1">
          {renderLink({
            icon: Sparkles,
            label: "Assistant IA",
            path: "/ai-assistant",
          })}
          {renderLink({
            icon: Link2,
            label: "Connexions",
            path: "/connections",
          })}
          {renderLink({ icon: Coins, label: "Crédits IA", path: "/credits" })}
        </nav>
      </div>
      <div className="sidebar-message m-4 rounded-2xl border border-primary/10 bg-primary/[0.04] p-4">
        <div className="mb-2 flex items-center gap-2 text-sm font-semibold">
          <span className="h-1.5 w-1.5 rounded-full bg-primary" />
          Un peu plus de clarté.
        </div>
        <p className="text-xs leading-relaxed text-muted-foreground">
          Une tâche à la fois, à votre rythme.
        </p>
        <Link
          to="/focus"
          onClick={onItemClick}
          className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-primary"
        >
          Entrer dans le flow <ArrowUpRight size={13} />
        </Link>
      </div>
      <div className="border-t border-border/70 p-4">
        {renderLink({
          icon: Settings2,
          label: "Paramètres",
          path: "/settings",
        })}
      </div>
    </aside>
  );
}

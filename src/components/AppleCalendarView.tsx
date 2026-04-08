import { useState, useEffect, useRef, useMemo } from "react";
import { format, addDays, startOfWeek, isSameDay, parseISO, subDays, addWeeks, subWeeks } from "date-fns";
import { fr } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Plus, ChevronLeft, ChevronRight, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CalendarItem } from "@/hooks/useCalendarData";
import { motion, AnimatePresence } from "framer-motion";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useIsMobile } from "@/hooks/use-mobile";

interface CalendarEvent {
  id: string;
  summary: string;
  description?: string;
  start: { dateTime?: string; date?: string };
  end: { dateTime?: string; date?: string };
}

interface AppleCalendarViewProps {
  currentDate: Date;
  onDateChange: (date: Date) => void;
  googleEvents: CalendarEvent[];
  localItems: CalendarItem[];
  onCreateEvent?: (date: Date, hour: number) => void;
  onAddClick?: () => void;
  isLoading?: boolean;
  // AI section
  aiContent?: React.ReactNode;
  showAI?: boolean;
}

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const CELL_HEIGHT = 56; // px per hour

const eventTypeColors: Record<string, { bg: string; text: string; darkBg: string; darkText: string }> = {
  task: { bg: "bg-blue-100", text: "text-blue-700", darkBg: "dark:bg-blue-500/20", darkText: "dark:text-blue-300" },
  habit: { bg: "bg-purple-100", text: "text-purple-700", darkBg: "dark:bg-purple-500/20", darkText: "dark:text-purple-300" },
  goal: { bg: "bg-amber-100", text: "text-amber-700", darkBg: "dark:bg-amber-500/20", darkText: "dark:text-amber-300" },
  google_event: { bg: "bg-green-100", text: "text-green-700", darkBg: "dark:bg-green-500/20", darkText: "dark:text-green-300" },
};

export function AppleCalendarView({
  currentDate,
  onDateChange,
  googleEvents,
  localItems,
  onCreateEvent,
  onAddClick,
  isLoading,
  aiContent,
  showAI = false,
}: AppleCalendarViewProps) {
  const isMobile = useIsMobile();
  const [viewMode, setViewMode] = useState<"day" | "week">(isMobile ? "day" : "week");
  const [aiOpen, setAiOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [hoveredCell, setHoveredCell] = useState<string | null>(null);

  // Auto-switch view on mobile
  useEffect(() => {
    setViewMode(isMobile ? "day" : "week");
  }, [isMobile]);

  // Auto-scroll to current time on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      if (scrollRef.current) {
        const now = new Date();
        const scrollTo = Math.max(0, (now.getHours() - 2) * CELL_HEIGHT);
        scrollRef.current.scrollTop = scrollTo;
      }
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const weekDays = viewMode === "week"
    ? Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))
    : [currentDate];

  const displayMonth = format(currentDate, "MMMM yyyy", { locale: fr });

  // Navigation
  const goNext = () => {
    onDateChange(viewMode === "week" ? addWeeks(currentDate, 1) : addDays(currentDate, 1));
  };
  const goPrev = () => {
    onDateChange(viewMode === "week" ? subWeeks(currentDate, 1) : subDays(currentDate, 1));
  };
  const goToday = () => onDateChange(new Date());

  // Current time indicator
  const now = new Date();
  const currentMinuteOfDay = now.getHours() * 60 + now.getMinutes();
  const timeIndicatorTop = (currentMinuteOfDay / (24 * 60)) * (24 * CELL_HEIGHT);

  // Merge google events into a unified format
  const allEvents = useMemo(() => {
    const items: Array<{
      id: string;
      title: string;
      type: string;
      date: Date;
      startHour: number;
      endHour: number;
      description?: string;
      allDay: boolean;
    }> = [];

    // Google events
    googleEvents.forEach((e) => {
      const startStr = e.start.dateTime || e.start.date;
      if (!startStr) return;
      const start = parseISO(startStr);
      const endStr = e.end?.dateTime || e.end?.date;
      const end = endStr ? parseISO(endStr) : addDays(start, 0);
      const allDay = !e.start.dateTime;
      items.push({
        id: e.id,
        title: e.summary,
        type: "google_event",
        date: start,
        startHour: allDay ? 0 : start.getHours() + start.getMinutes() / 60,
        endHour: allDay ? 24 : end.getHours() + end.getMinutes() / 60,
        description: e.description,
        allDay,
      });
    });

    // Local items (tasks, goals, habits)
    localItems.forEach((item) => {
      if (!item.date) return;
      const d = parseISO(item.date);
      const hasTime = item.date.includes("T");
      items.push({
        id: item.id,
        title: item.title,
        type: item.type,
        date: d,
        startHour: hasTime ? d.getHours() + d.getMinutes() / 60 : 9,
        endHour: hasTime ? d.getHours() + d.getMinutes() / 60 + 1 : 10,
        description: item.description,
        allDay: !hasTime,
      });
    });

    return items;
  }, [googleEvents, localItems]);

  const getEventsForDay = (day: Date, timed: boolean) => {
    return allEvents.filter((e) => isSameDay(e.date, day) && (timed ? !e.allDay : e.allDay));
  };

  return (
    <div className="flex flex-col h-full bg-background">
      {/* ===== HEADER ===== */}
      <header className="border-b px-4 py-3 flex items-center justify-between gap-3 liquid-glass sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <h2 className="text-xl md:text-2xl font-semibold capitalize tracking-tight" style={{ letterSpacing: "-0.025em" }}>
            {displayMonth}
          </h2>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={goPrev}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={goNext}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <Button variant="outline" size="sm" onClick={goToday} className="rounded-full text-xs px-4 h-8">
            Aujourd'hui
          </Button>
        </div>

        {/* Segmented control */}
        <div className="flex bg-muted rounded-xl p-0.5 gap-0.5">
          <button
            onClick={() => setViewMode("day")}
            className={cn(
              "px-4 py-1.5 text-xs font-medium rounded-lg transition-all",
              viewMode === "day" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
            )}
          >
            Jour
          </button>
          <button
            onClick={() => setViewMode("week")}
            className={cn(
              "px-4 py-1.5 text-xs font-medium rounded-lg transition-all",
              viewMode === "week" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
            )}
          >
            Semaine
          </button>
        </div>
      </header>

      {/* ===== DAY HEADERS ===== */}
      <div
        className={cn(
          "grid border-b bg-card/80 sticky top-[57px] z-20",
          viewMode === "week" ? "grid-cols-[48px_repeat(7,1fr)]" : "grid-cols-[48px_1fr]"
        )}
      >
        <div className="border-r" />
        {weekDays.map((day, i) => {
          const isToday = isSameDay(day, now);
          const allDayEvents = getEventsForDay(day, false);
          return (
            <div
              key={i}
              className={cn("text-center py-2 px-1 border-r", isToday && "bg-primary/5")}
              onClick={() => viewMode === "week" && onDateChange(day)}
            >
              <div className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                {format(day, "EEE", { locale: fr })}
              </div>
              <div
                className={cn(
                  "text-lg font-semibold mt-0.5 inline-flex items-center justify-center w-9 h-9 rounded-full transition-colors cursor-pointer",
                  isToday && "bg-primary text-primary-foreground"
                )}
              >
                {format(day, "d")}
              </div>
              {/* All-day events */}
              {allDayEvents.length > 0 && (
                <div className="mt-1 space-y-0.5 px-1">
                  {allDayEvents.slice(0, 2).map((evt) => {
                    const colors = eventTypeColors[evt.type] || eventTypeColors.google_event;
                    return (
                      <div
                        key={evt.id}
                        className={cn("text-[10px] px-1.5 py-0.5 rounded-lg truncate", colors.bg, colors.text, colors.darkBg, colors.darkText)}
                      >
                        {evt.title}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ===== TIME GRID ===== */}
      <div className="flex-1 overflow-y-auto" ref={scrollRef}>
        <div
          className={cn(
            "grid relative",
            viewMode === "week" ? "grid-cols-[48px_repeat(7,1fr)]" : "grid-cols-[48px_1fr]"
          )}
        >
          {/* Hours column */}
          <div className="border-r">
            {HOURS.map((hour) => (
              <div
                key={hour}
                className="text-[11px] text-muted-foreground pr-2 text-right flex items-start justify-end"
                style={{ height: `${CELL_HEIGHT}px` }}
              >
                <span className="-mt-2">{hour.toString().padStart(2, "0")}:00</span>
              </div>
            ))}
          </div>

          {/* Day columns */}
          {weekDays.map((day, dayIndex) => {
            const isToday = isSameDay(day, now);
            const timedEvents = getEventsForDay(day, true);

            return (
              <div key={dayIndex} className={cn("relative border-r", isToday && "bg-primary/[0.02]")}>
                {/* Hour cells */}
                {HOURS.map((hour) => {
                  const cellKey = `${dayIndex}-${hour}`;
                  return (
                    <div
                      key={hour}
                      className={cn(
                        "border-b border-border/20 relative group cursor-pointer transition-colors",
                        hoveredCell === cellKey && "bg-primary/5"
                      )}
                      style={{ height: `${CELL_HEIGHT}px` }}
                      onMouseEnter={() => setHoveredCell(cellKey)}
                      onMouseLeave={() => setHoveredCell(null)}
                      onClick={() => onCreateEvent(day, hour)}
                    >
                      {/* Half-hour dashed line */}
                      <div className="absolute left-0 right-0 top-1/2 border-t border-dashed border-border/10" />
                      {/* Hover + */}
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Plus className="h-3 w-3 text-muted-foreground/50" />
                      </div>
                    </div>
                  );
                })}

                {/* Current time indicator */}
                {isToday && (
                  <div className="absolute left-0 right-0 z-10 pointer-events-none" style={{ top: `${timeIndicatorTop}px` }}>
                    <div className="flex items-center">
                      <div className="w-2.5 h-2.5 rounded-full bg-red-500 -ml-1 shadow-md" />
                      <div className="flex-1 h-[1.5px] bg-red-500" />
                    </div>
                  </div>
                )}

                {/* Timed events */}
                {timedEvents.map((evt) => {
                  const top = (evt.startHour / 24) * (24 * CELL_HEIGHT);
                  const height = Math.max(((evt.endHour - evt.startHour) / 24) * (24 * CELL_HEIGHT), 24);
                  const colors = eventTypeColors[evt.type] || eventTypeColors.google_event;

                  return (
                    <motion.div
                      key={evt.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className={cn(
                        "absolute left-1 right-1 rounded-xl px-2 py-1 overflow-hidden cursor-pointer",
                        "transition-shadow hover:shadow-md hover:z-20",
                        colors.bg, colors.text, colors.darkBg, colors.darkText
                      )}
                      style={{ top: `${top}px`, height: `${height}px`, minHeight: "24px" }}
                    >
                      <div className="text-xs font-medium truncate">{evt.title}</div>
                      {height > 32 && (
                        <div className="text-[10px] opacity-70">
                          {Math.floor(evt.startHour).toString().padStart(2, "0")}:{Math.round((evt.startHour % 1) * 60).toString().padStart(2, "0")}
                          {" - "}
                          {Math.floor(evt.endHour).toString().padStart(2, "0")}:{Math.round((evt.endHour % 1) * 60).toString().padStart(2, "0")}
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>

      {/* ===== AI COLLAPSIBLE PANEL ===== */}
      {showAI && (
        <Collapsible open={aiOpen} onOpenChange={setAiOpen}>
          <CollapsibleTrigger asChild>
            <button className="w-full border-t px-4 py-2.5 flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors bg-card/50">
              <Sparkles className="h-4 w-4" />
              Suggestions IA
              <ChevronLeft className={cn("h-3 w-3 ml-auto transition-transform", aiOpen && "-rotate-90")} />
            </button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="border-t bg-background p-4 max-h-[300px] overflow-y-auto">
              {aiContent}
            </div>
          </CollapsibleContent>
        </Collapsible>
      )}

      {/* ===== FAB ===== */}
      <Button
        size="lg"
        className="fixed bottom-20 md:bottom-6 right-4 h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-all active:scale-[0.95] z-30"
        onClick={onAddClick}
      >
        <Plus className="h-6 w-6" />
      </Button>
    </div>
  );
}

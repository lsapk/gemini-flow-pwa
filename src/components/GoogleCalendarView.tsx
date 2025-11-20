import { useState } from "react";
import { format, addDays, startOfWeek, isSameDay, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";

interface CalendarEvent {
  id: string;
  summary: string;
  description?: string;
  start: { dateTime?: string; date?: string };
  end: { dateTime?: string; date?: string };
  colorId?: string;
}

interface GoogleCalendarViewProps {
  currentDate: Date;
  events: CalendarEvent[];
  onEventClick?: (event: CalendarEvent) => void;
  onCreateEvent?: (date: Date, hour: number) => void;
  onAddClick?: () => void;
}

const hours = Array.from({ length: 20 }, (_, i) => i + 4); // 04:00 to 23:00

const eventColors = [
  "bg-blue-500/90",
  "bg-orange-500/90",
  "bg-purple-500/90",
  "bg-cyan-500/90",
  "bg-green-500/90",
  "bg-pink-500/90",
];

export function GoogleCalendarView({
  currentDate,
  events,
  onEventClick,
  onCreateEvent,
  onAddClick
}: GoogleCalendarViewProps) {
  const [hoveredCell, setHoveredCell] = useState<string | null>(null);

  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const getEventsForDay = (day: Date) => {
    return events.filter(event => {
      const eventDate = event.start.dateTime 
        ? parseISO(event.start.dateTime)
        : event.start.date ? parseISO(event.start.date) : null;
      return eventDate && isSameDay(eventDate, day);
    });
  };

  const getEventPosition = (event: CalendarEvent) => {
    if (!event.start.dateTime || !event.end.dateTime) return null;

    const start = parseISO(event.start.dateTime);
    const end = parseISO(event.end.dateTime);
    
    const startHour = start.getHours() + start.getMinutes() / 60;
    const endHour = end.getHours() + end.getMinutes() / 60;
    
    const top = ((startHour - 4) / 20) * 100;
    const height = ((endHour - startHour) / 20) * 100;
    
    return { top: `${top}%`, height: `${height}%` };
  };

  const getEventColor = (index: number) => {
    return eventColors[index % eventColors.length];
  };

  const handleCellClick = (day: Date, hour: number) => {
    if (onCreateEvent) {
      onCreateEvent(day, hour);
    }
  };

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Week header */}
      <div className="grid grid-cols-[60px_repeat(7,1fr)] border-b sticky top-0 bg-background z-10">
        <div className="border-r"></div>
        {weekDays.map((day, i) => {
          const isToday = isSameDay(day, new Date());
          const dayEvents = getEventsForDay(day);
          
          return (
            <div
              key={i}
              className="text-center py-2 px-1 border-r"
            >
              <div className="text-xs text-muted-foreground">
                {format(day, 'EEE', { locale: fr })}
              </div>
              <div
                className={cn(
                  "text-lg font-semibold mt-0.5 inline-flex items-center justify-center w-8 h-8 rounded-full",
                  isToday && "bg-primary text-primary-foreground"
                )}
              >
                {format(day, 'd')}
              </div>
              {dayEvents.length > 0 && (
                <div className="text-xs text-primary mt-1 flex items-center justify-center gap-1">
                  <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-primary text-primary-foreground text-[10px]">
                    ✓
                  </span>
                  <span>{dayEvents.length} événement{dayEvents.length > 1 ? 's' : ''}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Calendar grid */}
      <div className="flex-1 overflow-y-auto">
        <div className="grid grid-cols-[60px_repeat(7,1fr)] min-h-full">
          {/* Hours column */}
          <div className="border-r">
            {hours.map(hour => (
              <div
                key={hour}
                className="h-16 border-b text-xs text-muted-foreground pr-2 text-right pt-1"
              >
                {hour.toString().padStart(2, '0')}:00
              </div>
            ))}
          </div>

          {/* Days columns */}
          {weekDays.map((day, dayIndex) => (
            <div key={dayIndex} className="relative border-r">
              {/* Grid cells */}
              {hours.map(hour => {
                const cellKey = `${dayIndex}-${hour}`;
                return (
                  <div
                    key={hour}
                    className={cn(
                      "h-16 border-b relative group cursor-pointer transition-colors",
                      hoveredCell === cellKey && "bg-accent/30"
                    )}
                    onMouseEnter={() => setHoveredCell(cellKey)}
                    onMouseLeave={() => setHoveredCell(null)}
                    onClick={() => handleCellClick(day, hour)}
                  >
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <Plus className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>
                );
              })}

              {/* Events */}
              {getEventsForDay(day).map((event, i) => {
                const position = getEventPosition(event);
                if (!position) return null;

                return (
                  <div
                    key={event.id}
                    className={cn(
                      "absolute left-1 right-1 rounded-md px-2 py-1 text-white text-xs overflow-hidden cursor-pointer hover:opacity-90 transition-opacity",
                      getEventColor(i)
                    )}
                    style={position}
                    onClick={(e) => {
                      e.stopPropagation();
                      onEventClick?.(event);
                    }}
                  >
                    <div className="font-medium truncate">{event.summary}</div>
                    {position.height && parseInt(position.height) > 5 && event.description && (
                      <div className="text-[10px] opacity-90 mt-0.5 line-clamp-2">
                        {event.description}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Floating action button */}
      <Button
        size="lg"
        className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 h-14 w-14 rounded-full shadow-lg"
        onClick={onAddClick}
      >
        <Plus className="h-6 w-6" />
      </Button>
    </div>
  );
}

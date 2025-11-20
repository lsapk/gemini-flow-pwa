import { useState } from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { X, Clock, Globe, Repeat, Users, Video, MapPin, List } from "lucide-react";
import { cn } from "@/lib/utils";

interface GoogleCalendarEventModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (eventData: EventFormData) => void;
  initialData?: {
    date: Date;
    startTime?: string;
    endTime?: string;
  };
}

export interface EventFormData {
  title: string;
  type: "event" | "task" | "birthday";
  description: string;
  calendar: string;
  allDay: boolean;
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
  timezone: string;
  repeat: string;
  guests: string[];
  location: string;
  videoConference: boolean;
}

const eventTypes = [
  { value: "event", label: "Événement" },
  { value: "task", label: "Tâche" },
  { value: "birthday", label: "Anniversaire" },
];

const calendars = [
  { value: "mon-agenda", label: "Mon agenda", color: "bg-blue-500" },
  { value: "family", label: "Family", color: "bg-gray-500" },
];

const repeatOptions = [
  { value: "none", label: "Une seule fois" },
  { value: "daily", label: "Tous les jours" },
  { value: "weekly", label: "Toutes les semaines" },
  { value: "monthly", label: "Tous les mois" },
  { value: "yearly", label: "Tous les ans" },
];

export function GoogleCalendarEventModal({
  open,
  onOpenChange,
  onSave,
  initialData,
}: GoogleCalendarEventModalProps) {
  const [formData, setFormData] = useState<EventFormData>({
    title: "",
    type: "event",
    description: "",
    calendar: "mon-agenda",
    allDay: false,
    startDate: initialData?.date ? format(initialData.date, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'),
    startTime: initialData?.startTime || "13:00",
    endDate: initialData?.date ? format(initialData.date, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'),
    endTime: initialData?.endTime || "14:00",
    timezone: "Europe/Paris",
    repeat: "none",
    guests: [],
    location: "",
    videoConference: false,
  });

  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleSave = () => {
    if (!formData.title.trim()) return;
    onSave(formData);
    onOpenChange(false);
  };

  const selectedCalendar = calendars.find(c => c.value === formData.calendar);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px] p-0 gap-0 max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <DialogHeader className="p-4 pb-3 border-b shrink-0">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-normal">Ajouter un titre</DialogTitle>
            <div className="flex items-center gap-2">
              <Button
                onClick={handleSave}
                disabled={!formData.title.trim()}
                className="bg-[#f0c0c0] hover:bg-[#e0b0b0] text-gray-900"
              >
                Enregistrer
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onOpenChange(false)}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Title */}
          <Input
            placeholder="Ajouter un titre"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            className="border-0 border-b rounded-none text-lg px-0 focus-visible:ring-0"
          />

          {/* Event type tabs */}
          <div className="flex gap-2">
            {eventTypes.map((type) => (
              <Button
                key={type.value}
                variant={formData.type === type.value ? "default" : "outline"}
                size="sm"
                onClick={() => setFormData({ ...formData, type: type.value as any })}
                className={cn(
                  "rounded-full",
                  formData.type === type.value
                    ? "bg-gray-700 hover:bg-gray-600"
                    : "bg-gray-200 text-gray-900 hover:bg-gray-300 border-0"
                )}
              >
                {type.label}
              </Button>
            ))}
          </div>

          {/* Calendar selection */}
          <div className="flex items-center gap-3 py-2">
            <div className="flex items-center gap-2 flex-1">
              <div className={cn("w-3 h-3 rounded-full", selectedCalendar?.color)} />
              <span className="text-sm font-medium">{selectedCalendar?.label}</span>
            </div>
            <Select
              value={formData.calendar}
              onValueChange={(value) => setFormData({ ...formData, calendar: value })}
            >
              <SelectTrigger className="w-[180px] border-0 bg-transparent">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {calendars.map((cal) => (
                  <SelectItem key={cal.value} value={cal.value}>
                    <div className="flex items-center gap-2">
                      <div className={cn("w-3 h-3 rounded-full", cal.color)} />
                      {cal.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* All day toggle */}
          <div className="flex items-center justify-between py-2">
            <div className="flex items-center gap-3">
              <Clock className="h-5 w-5 text-muted-foreground" />
              <span className="text-sm">Toute la journée</span>
            </div>
            <Switch
              checked={formData.allDay}
              onCheckedChange={(checked) => setFormData({ ...formData, allDay: checked })}
            />
          </div>

          {/* Date and time */}
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Input
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                className="flex-1"
              />
              {!formData.allDay && (
                <Input
                  type="time"
                  value={formData.startTime}
                  onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                  className="w-32"
                />
              )}
            </div>

            <div className="flex items-center gap-3">
              <Input
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                className="flex-1"
              />
              {!formData.allDay && (
                <Input
                  type="time"
                  value={formData.endTime}
                  onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                  className="w-32"
                />
              )}
            </div>
          </div>

          {/* Timezone */}
          <div className="flex items-center gap-3 py-2 text-sm text-muted-foreground">
            <Globe className="h-5 w-5" />
            <span>heure normale d'Europe centrale</span>
          </div>

          {/* Repeat */}
          <div className="flex items-center gap-3 py-2">
            <Repeat className="h-5 w-5 text-muted-foreground" />
            <Select
              value={formData.repeat}
              onValueChange={(value) => setFormData({ ...formData, repeat: value })}
            >
              <SelectTrigger className="flex-1 border-0 bg-transparent h-auto p-0">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {repeatOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Advanced options toggle */}
          {!showAdvanced && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowAdvanced(true)}
              className="w-full justify-start text-muted-foreground"
            >
              Ajouter une date limite
            </Button>
          )}

          {showAdvanced && (
            <>
              {/* Guests */}
              <div className="flex items-start gap-3 py-2">
                <Users className="h-5 w-5 text-muted-foreground mt-1" />
                <div className="flex-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start text-muted-foreground h-auto p-0"
                  >
                    Ajouter des contacts
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-2 text-xs"
                  >
                    Afficher les plannings
                  </Button>
                </div>
              </div>

              {/* Video conference */}
              <div className="flex items-center gap-3 py-2">
                <Video className="h-5 w-5 text-muted-foreground" />
                <Button
                  variant="ghost"
                  size="sm"
                  className="flex-1 justify-start text-muted-foreground h-auto p-0"
                >
                  Ajouter une visioconférence
                </Button>
              </div>

              {/* Location */}
              <div className="flex items-center gap-3 py-2">
                <MapPin className="h-5 w-5 text-muted-foreground" />
                <Button
                  variant="ghost"
                  size="sm"
                  className="flex-1 justify-start text-muted-foreground h-auto p-0"
                >
                  Ajouter un lieu
                </Button>
              </div>

              {/* Description */}
              <div className="flex items-start gap-3 py-2">
                <List className="h-5 w-5 text-muted-foreground mt-1" />
                <Button
                  variant="ghost"
                  size="sm"
                  className="flex-1 justify-start text-muted-foreground h-auto p-0"
                  onClick={() => {
                    const section = document.getElementById('description-section');
                    if (section) {
                      section.classList.toggle('hidden');
                    }
                  }}
                >
                  Ajouter des détails
                </Button>
              </div>

              <div id="description-section" className="hidden">
                <Textarea
                  placeholder="Description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="min-h-[80px]"
                />
              </div>
            </>
          )}

          {/* Task list section for tasks */}
          {formData.type === "task" && (
            <div className="flex items-center gap-3 py-2 border-t mt-4 pt-4">
              <List className="h-5 w-5 text-muted-foreground" />
              <span className="text-sm font-medium">Mes tâches</span>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

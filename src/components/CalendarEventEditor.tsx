import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  createGoogleEvent,
  updateGoogleEvent,
  type GoogleEvent,
  type GoogleEventInput,
} from "@/services/google";
import {
  inputDateTime,
  localDateTime,
  shiftCalendarDay,
} from "@/lib/calendar-form";

export function CalendarEventEditor({
  calendarId,
  calendarName,
  date,
  event,
  onClose,
  onSaved,
}: {
  calendarId: string;
  calendarName: string;
  date: string;
  event?: GoogleEvent;
  onClose: () => void;
  onSaved: () => Promise<void>;
}) {
  const [summary, setSummary] = useState(event?.summary || "");
  const [description, setDescription] = useState(event?.description || "");
  const [location, setLocation] = useState(event?.location || "");
  const [allDay, setAllDay] = useState(Boolean(event?.start.date));
  const [start, setStart] = useState(
    event?.start.date ||
      (event?.start.dateTime
        ? inputDateTime(new Date(event.start.dateTime))
        : `${date}T13:00`),
  );
  const [end, setEnd] = useState(
    event?.end.date
      ? shiftCalendarDay(event.end.date, -1)
      : event?.end.dateTime
        ? inputDateTime(new Date(event.end.dateTime))
        : `${date}T14:00`,
  );
  // Kept for the whole dialog lifetime, including retries after a lost response.
  const [requestId] = useState(() => crypto.randomUUID().replace(/-/g, ""));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const zone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  async function save(submit: FormEvent) {
    submit.preventDefault();
    setError("");
    setBusy(true);
    try {
      const fields: GoogleEventInput = {
        summary: summary.trim(),
        description,
        location,
        start: allDay ? { date: start } : { dateTime: localDateTime(start) },
        end: allDay
          ? { date: shiftCalendarDay(end, 1) }
          : { dateTime: localDateTime(end) },
      };
      if (!fields.summary) throw new Error("Renseignez un titre.");
      if (end < start || (!allDay && end === start))
        throw new Error("La fin doit suivre le début.");
      if (event) await updateGoogleEvent(calendarId, event, fields);
      else await createGoogleEvent(calendarId, fields, requestId);
      await onSaved();
    } catch (problem) {
      setError(
        problem instanceof Error
          ? problem.message
          : "L’événement n’a pas pu être enregistré.",
      );
    } finally {
      setBusy(false);
    }
  }
  function toggleAllDay(checked: boolean) {
    setAllDay(checked);
    setStart(checked ? start.slice(0, 10) : `${start.slice(0, 10)}T13:00`);
    setEnd(checked ? end.slice(0, 10) : `${end.slice(0, 10)}T14:00`);
  }
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open && !busy) onClose();
      }}
    >
      <DialogContent
        onEscapeKeyDown={(event) => {
          if (busy) event.preventDefault();
        }}
        onInteractOutside={(event) => {
          if (busy) event.preventDefault();
        }}
      >
        <DialogHeader>
          <DialogTitle>
            {event ? "Modifier l’événement" : "Nouvel événement"}
          </DialogTitle>
          <DialogDescription>
            Agenda : {calendarName}.{" "}
            {event?.recurring
              ? "Vous modifiez uniquement cette occurrence."
              : "Enregistrement dans votre agenda Google."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={save} className="space-y-4">
          <fieldset disabled={busy} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="event-title">Titre</Label>
              <Input
                id="event-title"
                required
                maxLength={200}
                value={summary}
                onChange={(event) => setSummary(event.target.value)}
                autoFocus
              />
            </div>
            <label className="flex items-center gap-3 text-sm">
              <input
                type="checkbox"
                checked={allDay}
                onChange={(event) => toggleAllDay(event.target.checked)}
                className="h-4 w-4 accent-primary"
              />
              Toute la journée
            </label>
            <p className="text-xs text-muted-foreground">
              {allDay
                ? "Le dernier jour choisi est inclus."
                : `Fuseau des horaires : ${zone}`}
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="event-start">Début</Label>
                <Input
                  id="event-start"
                  type={allDay ? "date" : "datetime-local"}
                  required
                  value={start}
                  onChange={(event) => setStart(event.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="event-end">
                  {allDay ? "Dernier jour" : "Fin"}
                </Label>
                <Input
                  id="event-end"
                  type={allDay ? "date" : "datetime-local"}
                  required
                  min={start}
                  value={end}
                  onChange={(event) => setEnd(event.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="event-location">Lieu (facultatif)</Label>
              <Input
                id="event-location"
                maxLength={200}
                value={location}
                onChange={(event) => setLocation(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="event-description">Notes (facultatives)</Label>
              <Textarea
                id="event-description"
                maxLength={2000}
                value={description}
                onChange={(event) => setDescription(event.target.value)}
              />
            </div>
          </fieldset>
          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={busy}
              onClick={onClose}
            >
              Annuler
            </Button>
            <Button type="submit" disabled={busy}>
              {busy ? "Enregistrement…" : "Enregistrer dans Google"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

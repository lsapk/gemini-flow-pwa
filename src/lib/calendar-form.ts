// Dates entered in the event editor follow the explicitly displayed device time zone.
export function localDateTime(value: string): string {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value))
    throw new Error("Renseignez une date et une heure valides.");
  const date = new Date(value);
  if (!Number.isFinite(date.getTime()) || inputDateTime(date) !== value)
    throw new Error(
      "Cet horaire n’existe pas dans votre fuseau. Choisissez un autre horaire.",
    );
  return date.toISOString();
}
export function inputDateTime(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}T${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}
export function shiftCalendarDay(value: string, delta: number): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value))
    throw new Error("Renseignez une date valide.");
  const date = new Date(`${value}T00:00:00Z`);
  if (
    !Number.isFinite(date.getTime()) ||
    date.toISOString().slice(0, 10) !== value
  )
    throw new Error("Renseignez une date valide.");
  date.setUTCDate(date.getUTCDate() + delta);
  return date.toISOString().slice(0, 10);
}

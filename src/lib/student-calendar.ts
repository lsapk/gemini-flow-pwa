import { parisWallTime, type StudentCalendarEvent } from "./student.ts";

export const MAX_ICS_BYTES = 2 * 1024 * 1024;
export const MAX_ICS_EVENTS = 2000;

/** The server also enforces the operator's exact university-host allowlist. */
export function studentFeedUrl(value: string): string {
  if (value.length > 4096)
    throw new Error("Ce lien est trop long. Utilisez un export de fichier.");
  let url: URL;
  try {
    url = new URL(value.trim());
  } catch {
    throw new Error("Saisissez un lien iCalendar HTTPS valide.");
  }
  if (
    url.protocol !== "https:" ||
    url.username ||
    url.password ||
    url.hash ||
    (url.port && url.port !== "443")
  )
    throw new Error(
      "Utilisez un lien HTTPS sans identifiants, fragment ni port personnalisé.",
    );
  return url.href;
}

export function studentFeedContent(value: unknown): string {
  if (
    !value ||
    typeof value !== "object" ||
    !("content" in value) ||
    typeof value.content !== "string"
  )
    throw new Error(
      "Le service n’a pas renvoyé de calendrier. Vous pouvez importer le fichier .ics.",
    );
  if (new TextEncoder().encode(value.content).byteLength > MAX_ICS_BYTES)
    throw new Error(
      "Le calendrier dépasse 2 Mo. Exportez une période plus courte.",
    );
  return value.content;
}
export interface CalendarPreview {
  events: StudentCalendarEvent[];
  warnings: string[];
  duplicateCount: number;
}
interface Property {
  name: string;
  params: Record<string, string>;
  value: string;
}

function splitOutsideQuotes(value: string, separator: string) {
  let quoted = false;
  let start = 0;
  const result: string[] = [];
  for (let index = 0; index < value.length; index++) {
    if (value[index] === '"') quoted = !quoted;
    if (value[index] === separator && !quoted) {
      result.push(value.slice(start, index));
      start = index + 1;
    }
  }
  if (quoted) throw new Error("Paramètre ICS mal formé : guillemet non fermé.");
  result.push(value.slice(start));
  return result;
}

function property(line: string): Property {
  let quoted = false;
  let separator = -1;
  for (let index = 0; index < line.length; index++) {
    if (line[index] === '"') quoted = !quoted;
    if (line[index] === ":" && !quoted) {
      separator = index;
      break;
    }
  }
  if (separator < 1)
    throw new Error("Ligne ICS invalide : séparateur « : » manquant.");
  const value = line.slice(separator + 1);
  const [name, ...parameters] = splitOutsideQuotes(
    line.slice(0, separator),
    ";",
  );
  const params: Record<string, string> = {};
  for (const parameter of parameters) {
    const equal = parameter.indexOf("=");
    if (equal < 1) throw new Error("Paramètre ICS invalide.");
    params[parameter.slice(0, equal).toUpperCase()] = parameter
      .slice(equal + 1)
      .replace(/^"|"$/g, "");
  }
  return { name: name.toUpperCase(), params, value };
}

function textValue(value: string, max: number) {
  const result = value
    .replace(/\\([nN,;\\])/g, (_, char: string) =>
      /n/i.test(char) ? "\n" : char,
    )
    .split("\0")
    .join("");
  if (result.length > max)
    throw new Error(`Champ ICS trop long (limite : ${max} caractères).`);
  return result;
}

function dateValue(prop: Property, warnings: Set<string>) {
  if (
    prop.params.VALUE &&
    !["DATE", "DATE-TIME"].includes(prop.params.VALUE.toUpperCase())
  )
    throw new Error("Type de date ICS non pris en charge.");
  const allDay =
    prop.params.VALUE?.toUpperCase() === "DATE" || /^\d{8}$/.test(prop.value);
  const match = /^(\d{4})(\d{2})(\d{2})(?:T(\d{2})(\d{2})(\d{2})(Z)?)?$/.exec(
    prop.value,
  );
  if (!match || (allDay && match[4]) || (!allDay && !match[4]))
    throw new Error(`Date ICS invalide : ${prop.value.slice(0, 25)}.`);
  const [, year, month, day, hour = "00", minute = "00", second = "00", utc] =
    match;
  if (+year < 1900 || +year > 2200)
    throw new Error("Les dates ICS doivent être comprises entre 1900 et 2200.");
  const tz = prop.params.TZID;
  if (tz && !["Europe/Paris", "UTC", "Etc/UTC", "GMT"].includes(tz))
    throw new Error(
      `Fuseau « ${tz.slice(0, 80)} » non pris en charge. Exportez en Europe/Paris ou UTC.`,
    );
  if (utc && tz)
    throw new Error(
      "Date ICS ambiguë : TZID et suffixe UTC présents ensemble.",
    );
  const isoWall = `${year}-${month}-${day}T${hour}:${minute}:${second}`;
  if (utc || (tz && tz !== "Europe/Paris")) {
    const instant = new Date(`${isoWall}Z`);
    if (
      !Number.isFinite(instant.getTime()) ||
      instant.toISOString().slice(0, 19) !== isoWall
    )
      throw new Error("Date ICS hors calendrier.");
    return { iso: instant.toISOString(), allDay };
  }
  if (!tz && !allDay)
    warnings.add("Les heures sans fuseau sont interprétées en Europe/Paris.");
  return { iso: parisWallTime(isoWall), allDay };
}

export const calendarEventKey = (
  event: Pick<StudentCalendarEvent, "uid" | "recurrence_id">,
) => JSON.stringify([event.uid, event.recurrence_id]);

/** Deliberately bounded subset. Unsupported recurrence aborts the whole preview. */
export function parseStudentCalendar(input: string): CalendarPreview {
  if (new TextEncoder().encode(input).byteLength > MAX_ICS_BYTES)
    throw new Error(
      "Fichier trop volumineux. Exportez une période plus courte (2 Mo maximum).",
    );
  const lines = input
    .replace(/^\uFEFF/, "")
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/\n[ \t]/g, "")
    .split("\n")
    .filter((line) => line.length > 0);
  if (lines.length > 50000 || lines.some((line) => line.length > 20000))
    throw new Error("Calendrier trop complexe. Réduisez la période exportée.");
  if (
    lines[0]?.toUpperCase() !== "BEGIN:VCALENDAR" ||
    lines[lines.length - 1]?.toUpperCase() !== "END:VCALENDAR"
  )
    throw new Error(
      "Ce fichier n’est pas un calendrier iCalendar complet (.ics). Téléchargez le fichier depuis votre emploi du temps.",
    );
  const warnings = new Set<string>();
  const records: Property[][] = [];
  const stack: string[] = [];
  let current: Property[] | null = null;
  let methodCancel = false;
  for (const line of lines) {
    const prop = property(line);
    if (prop.name === "BEGIN") {
      const component = prop.value.toUpperCase();
      const parent = stack[stack.length - 1];
      if (component === "VCALENDAR" && stack.length > 0)
        throw new Error("Calendriers imbriqués non pris en charge.");
      if (["VTODO", "VJOURNAL", "VFREEBUSY"].includes(component))
        throw new Error(
          `Composant ${component} non pris en charge. Exportez uniquement les événements de cours.`,
        );
      if (component === "VEVENT") {
        if (parent !== "VCALENDAR")
          throw new Error("Structure VEVENT invalide.");
        current = [];
      }
      stack.push(component);
    } else if (prop.name === "END") {
      if (stack.pop() !== prop.value.toUpperCase())
        throw new Error("Structure du calendrier invalide (BEGIN/END).");
      if (prop.value.toUpperCase() === "VEVENT") {
        records.push(current!);
        current = null;
        if (records.length > MAX_ICS_EVENTS)
          throw new Error(
            `Trop d’événements. Limite : ${MAX_ICS_EVENTS} par fichier.`,
          );
      }
    } else if (stack[stack.length - 1] === "VEVENT" && current)
      current.push(prop);
    else if (stack.length === 1 && prop.name === "METHOD")
      methodCancel = prop.value.toUpperCase() === "CANCEL";
  }
  if (stack.length) throw new Error("Calendrier incomplet.");
  if (!records.length)
    throw new Error("Aucun événement VEVENT trouvé dans ce fichier.");
  const events = new Map<string, StudentCalendarEvent>();
  let duplicateCount = 0;
  for (let index = 0; index < records.length; index++) {
    try {
      const props = records[index];
      if (
        props.some((prop) =>
          ["RRULE", "RDATE", "EXDATE", "EXRULE"].includes(prop.name),
        )
      )
        throw new Error(
          "Récurrence non prise en charge (RRULE/RDATE/EXDATE). Exportez des événements individuels sur une période fixe ; aucun événement n’a été importé.",
        );
      const get = (name: string) => {
        const found = props.filter((prop) => prop.name === name);
        if (found.length > 1) throw new Error(`Propriété ${name} répétée.`);
        return found[0];
      };
      const uid = textValue(get("UID")?.value || "", 500).trim();
      if (!uid)
        throw new Error(
          "UID manquant : impossible de prévenir les doublons. Réexportez le calendrier.",
        );
      if (new TextEncoder().encode(uid).byteLength > 1500)
        throw new Error(
          "UID trop long. Réexportez une période plus courte depuis l’outil officiel.",
        );
      const statusProp = get("STATUS")?.value.toUpperCase();
      if (
        statusProp &&
        !["CONFIRMED", "TENTATIVE", "CANCELLED"].includes(statusProp)
      )
        throw new Error("Statut ICS inconnu.");
      if (statusProp === "TENTATIVE")
        warnings.add(
          "Les événements provisoires (TENTATIVE) sont affichés comme des cours ; vérifiez leur confirmation sur le site officiel.",
        );
      const cancelled = methodCancel || statusProp === "CANCELLED";
      const startProp = get("DTSTART");
      const start = startProp ? dateValue(startProp, warnings) : null;
      if (!start && !cancelled) throw new Error("DTSTART manquant.");
      const endProp = get("DTEND");
      if (get("DURATION"))
        throw new Error(
          "DURATION non pris en charge. Exportez avec une heure de fin DTEND explicite.",
        );
      let end = endProp ? dateValue(endProp, warnings) : null;
      if (end && start && end.allDay !== start.allDay)
        throw new Error("DTSTART et DTEND utilisent des types différents.");
      if (!end && start) {
        if (start.allDay) {
          const wallDate = startProp!.value;
          const following = new Date(
            Date.UTC(
              +wallDate.slice(0, 4),
              +wallDate.slice(4, 6) - 1,
              +wallDate.slice(6, 8) + 1,
            ),
          );
          end = {
            iso: parisWallTime(
              `${following.toISOString().slice(0, 10)}T00:00:00`,
            ),
            allDay: true,
          };
        } else end = { ...start };
      }
      if (end && start && end.iso < start.iso)
        throw new Error("La fin de l’événement précède son début.");
      const recurrence = get("RECURRENCE-ID");
      if (recurrence?.params.RANGE)
        throw new Error(
          "Modification THISANDFUTURE non prise en charge. Exportez des occurrences individuelles.",
        );
      const recurrenceId = recurrence
        ? dateValue(recurrence, warnings).iso
        : "";
      const sequenceValue = get("SEQUENCE")?.value || "0";
      if (!/^\d{1,9}$/.test(sequenceValue))
        throw new Error("SEQUENCE invalide.");
      const versionProp = get("LAST-MODIFIED") || get("DTSTAMP");
      const version = versionProp
        ? dateValue(versionProp, warnings).iso
        : "1970-01-01T00:00:00.000Z";
      const event: StudentCalendarEvent = {
        uid,
        recurrence_id: recurrenceId,
        title: textValue(
          get("SUMMARY")?.value ||
            (cancelled ? "Événement annulé" : "Cours sans titre"),
          300,
        ),
        location: textValue(get("LOCATION")?.value || "", 500),
        description: textValue(get("DESCRIPTION")?.value || "", 10000),
        starts_at: start?.iso || null,
        ends_at: end?.iso || null,
        all_day: start?.allDay || false,
        status: cancelled ? "cancelled" : "confirmed",
        sequence: Number(sequenceValue),
        version_at: version,
      };
      const key = calendarEventKey(event);
      const old = events.get(key);
      if (old) duplicateCount++;
      if (
        !old ||
        event.sequence > old.sequence ||
        (event.sequence === old.sequence && event.version_at >= old.version_at)
      )
        events.set(key, event);
    } catch (error) {
      throw new Error(
        `Événement ${index + 1} : ${error instanceof Error ? error.message : "données invalides"}`,
      );
    }
  }
  if (duplicateCount)
    warnings.add(
      `${duplicateCount} doublon(s) UID / RECURRENCE-ID : la version la plus récente est conservée.`,
    );
  return {
    events: [...events.values()].sort((a, b) =>
      (a.starts_at || "").localeCompare(b.starts_at || ""),
    ),
    warnings: [...warnings],
    duplicateCount,
  };
}

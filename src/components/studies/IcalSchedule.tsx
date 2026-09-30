import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChevronLeft, ChevronRight, Link2, Loader2, RefreshCw, Unlink } from "lucide-react";
import { toast } from "sonner";
import { toLocalDateKey } from "@/utils/dateUtils";

type Ev = { start: Date; end: Date; title: string; location: string; teacher: string };

const DAYS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

function parseDate(v: string) {
  const m = v.match(/(\d{4})(\d{2})(\d{2})(?:T(\d{2})(\d{2})(\d{2})(Z)?)?/);
  if (!m) return new Date(NaN);
  const [, y, mo, d, h = "0", mi = "0", s = "0", z] = m;
  return z ? new Date(Date.UTC(+y, +mo - 1, +d, +h, +mi, +s)) : new Date(+y, +mo - 1, +d, +h, +mi, +s);
}

function parseIcs(text: string): Ev[] {
  const lines = text.replace(/\r?\n[ \t]/g, "").split(/\r?\n/);
  const out: Ev[] = [];
  let cur: Record<string, string> | null = null;
  for (const l of lines) {
    if (l === "BEGIN:VEVENT") cur = {};
    else if (l === "END:VEVENT" && cur) {
      const desc = (cur.DESCRIPTION || "").split("\\n").map(s => s.trim()).filter(Boolean);
      const teacher = desc.find(s => /^[A-ZÀ-Ü' -]+ [A-ZÀ-Ü' -]+$/.test(s) && !/^G\d/.test(s)) || "";
      out.push({ start: parseDate(cur.DTSTART), end: parseDate(cur.DTEND), title: (cur.SUMMARY || "Cours").replace(/\\,/g, ","), location: (cur.LOCATION || "").replace(/\\,/g, ","), teacher });
      cur = null;
    } else if (cur) {
      const i = l.indexOf(":");
      if (i > 0) cur[l.slice(0, i).split(";")[0]] = l.slice(i + 1);
    }
  }
  return out.sort((a, b) => a.start.getTime() - b.start.getTime());
}

function colorFor(title: string) {
  const code = title.match(/[RSP]\d\.\d+/)?.[0] || title;
  let h = 0;
  for (const c of code) h = (h * 31 + c.charCodeAt(0)) % 360;
  return `hsl(${h} 70% 50%)`;
}

function mondayOf(d: Date) {
  const x = new Date(d); x.setHours(0, 0, 0, 0);
  x.setDate(x.getDate() - ((x.getDay() + 6) % 7));
  return x;
}

export function IcalSchedule() {
  const { user } = useAuth();
  const [url, setUrl] = useState("");
  const [saved, setSaved] = useState<string | null>(null);
  const [events, setEvents] = useState<Ev[]>([]);
  const [loading, setLoading] = useState(false);
  const [week, setWeek] = useState(() => mondayOf(new Date()));

  const fetchCal = async (u: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("ical-proxy", { body: { url: u } });
      if (error) {
        let msg = "Impossible de charger l'emploi du temps.";
        try { const b = await (error as any).context?.json(); if (b?.error) msg = b.error; } catch { /* ignore */ }
        throw new Error(msg);
      }
      const text = typeof data === "string" ? data : await new Response(data as any).text();
      setEvents(parseIcs(text));
      return true;
    } catch (e) {
      toast.error((e as Error).message);
      return false;
    } finally { setLoading(false); }
  };

  useEffect(() => {
    if (!user) return;
    (supabase as any).from("user_settings").select("ical_url").eq("id", user.id).maybeSingle().then(({ data }: any) => {
      if (data?.ical_url) { setSaved(data.ical_url); setUrl(data.ical_url); fetchCal(data.ical_url); }
    });
  }, [user]);

  const connect = async () => {
    if (!user || !url.trim()) return;
    if (await fetchCal(url.trim())) {
      const { error } = await (supabase as any).from("user_settings").update({ ical_url: url.trim() }).eq("id", user.id);
      if (error) return toast.error("Enregistrement impossible");
      setSaved(url.trim()); toast.success("Emploi du temps connecté");
    }
  };

  const disconnect = async () => {
    if (!user) return;
    await (supabase as any).from("user_settings").update({ ical_url: null }).eq("id", user.id);
    setSaved(null); setEvents([]); setUrl("");
  };

  const weekEvents = useMemo(() => {
    const end = new Date(week); end.setDate(end.getDate() + 7);
    return events.filter(e => e.start >= week && e.start < end);
  }, [events, week]);

  const shift = (n: number) => { const d = new Date(week); d.setDate(d.getDate() + n * 7); setWeek(d); };
  const today = toLocalDateKey();
  const days = Array.from({ length: 7 }, (_, i) => { const d = new Date(week); d.setDate(d.getDate() + i); return d; })
    .filter((d, i) => i < 5 || weekEvents.some(e => toLocalDateKey(e.start) === toLocalDateKey(d)));
  const fmt = (d: Date) => d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2"><Link2 className="h-5 w-5 text-primary" />Emploi du temps de l'université</CardTitle>
          <CardDescription>Collez le lien iCal de votre emploi du temps (ADE, etc.). Il se met à jour automatiquement.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col md:flex-row gap-2">
          <Input className="h-11 flex-1" placeholder="https://edt.univ-lyon1.fr/...calType=ical..." value={url} onChange={e => setUrl(e.target.value)} />
          <Button className="h-11" onClick={connect} disabled={loading || !url.trim()}>{loading ? <Loader2 className="h-4 w-4 animate-spin" /> : saved ? "Mettre à jour" : "Connecter"}</Button>
          {saved && <>
            <Button className="h-11" variant="outline" onClick={() => fetchCal(saved)} disabled={loading}><RefreshCw className="h-4 w-4" /></Button>
            <Button className="h-11" variant="ghost" onClick={disconnect}><Unlink className="h-4 w-4" /></Button>
          </>}
        </CardContent>
      </Card>

      {saved && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Semaine du {week.toLocaleDateString("fr-FR", { day: "numeric", month: "long" })}</CardTitle>
            <div className="flex gap-1">
              <Button size="icon" variant="ghost" onClick={() => shift(-1)}><ChevronLeft className="h-4 w-4" /></Button>
              <Button size="sm" variant="ghost" onClick={() => setWeek(mondayOf(new Date()))}>Aujourd'hui</Button>
              <Button size="icon" variant="ghost" onClick={() => shift(1)}><ChevronRight className="h-4 w-4" /></Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(auto-fit, minmax(150px, 1fr))` }}>
              {days.map(d => {
                const key = toLocalDateKey(d);
                const list = weekEvents.filter(e => toLocalDateKey(e.start) === key);
                return (
                  <div key={key} className={`rounded-2xl p-2 space-y-2 ${key === today ? "bg-primary/10" : "bg-muted/30"}`}>
                    <p className="text-sm font-semibold">{DAYS[(d.getDay() + 6) % 7]} {d.getDate()}</p>
                    {list.map((e, i) => (
                      <div key={i} className="rounded-xl p-2 text-xs bg-background/60" style={{ borderLeft: `3px solid ${colorFor(e.title)}` }}>
                        <p className="font-medium leading-tight">{e.title}</p>
                        <p className="text-muted-foreground">{fmt(e.start)}–{fmt(e.end)}{e.location ? ` · ${e.location}` : ""}</p>
                        {e.teacher && <p className="text-muted-foreground truncate">{e.teacher}</p>}
                      </div>
                    ))}
                    {list.length === 0 && <p className="text-xs text-muted-foreground">Pas de cours</p>}
                  </div>
                );
              })}
            </div>
            <p className="text-xs text-muted-foreground mt-3">{weekEvents.length} cours cette semaine · {events.length} au total</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

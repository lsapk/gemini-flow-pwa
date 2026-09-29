import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { GraduationCap, Plus, Trash2, Wand2, CalendarClock, BookOpen, Loader2, Lightbulb } from "lucide-react";
import { toast } from "sonner";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { toLocalDateKey } from "@/lib/dateUtils";

type Subject = { id: string; name: string; color: string | null; teacher: string | null; coefficient: number; room: string | null };
type Assignment = { id: string; title: string; description: string | null; subject_id: string | null; kind: string; is_project: boolean; due_date: string | null; estimated_minutes: number | null; status: string };
type Milestone = { id: string; assignment_id: string; title: string; completed: boolean; estimated_minutes: number | null };
type Exam = { id: string; title: string; subject_id: string | null; exam_date: string; chapters: string | null };
type Slot = { id: string; subject_id: string | null; day_of_week: number; start_time: string; end_time: string; room: string | null };
type Grade = { id: string; subject_id: string | null; title: string | null; value: number; out_of: number; coefficient: number; graded_at: string };

const DAYS = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"];
const COLORS = ["#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#14B8A6", "#EC4899"];
const db = supabase as any;

async function callAI(action: string, payload: unknown) {
  const { data, error } = await supabase.functions.invoke("ai-student", { body: { action, payload } });
  if (error) {
    let msg = "L'IA n'a pas pu répondre.";
    try { const b = await (error as any).context?.json(); if (b?.error) msg = b.error; } catch { /* ignore */ }
    throw new Error(msg);
  }
  if (data?.error) throw new Error(data.error);
  return data.result;
}

export default function Studies() {
  const { user } = useAuth();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [studyMinutes, setStudyMinutes] = useState<Record<string, number>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const [coach, setCoach] = useState<{ summary: string; advices: { title: string; detail: string }[] } | null>(null);

  const load = async () => {
    if (!user) return;
    const [s, a, m, e, c, g, f] = await Promise.all([
      db.from("subjects").select("*").eq("user_id", user.id).order("name"),
      db.from("assignments").select("*").eq("user_id", user.id).order("due_date", { ascending: true, nullsFirst: false }),
      db.from("assignment_milestones").select("*").eq("user_id", user.id).order("sort_order"),
      db.from("exams").select("*").eq("user_id", user.id).order("exam_date"),
      db.from("class_schedule").select("*").eq("user_id", user.id).order("start_time"),
      db.from("grades").select("*").eq("user_id", user.id).order("graded_at"),
      db.from("focus_sessions").select("subject_id, duration").eq("user_id", user.id).not("subject_id", "is", null),
    ]);
    setSubjects(s.data || []); setAssignments(a.data || []); setMilestones(m.data || []);
    setExams(e.data || []); setSlots(c.data || []); setGrades(g.data || []);
    const mins: Record<string, number> = {};
    (f.data || []).forEach((r: any) => { mins[r.subject_id] = (mins[r.subject_id] || 0) + (r.duration || 0); });
    setStudyMinutes(mins);
  };
  useEffect(() => { load(); }, [user]);

  const subjectName = (id: string | null) => subjects.find(s => s.id === id)?.name ?? "Sans matière";
  const subjectColor = (id: string | null) => subjects.find(s => s.id === id)?.color ?? "hsl(var(--muted-foreground))";

  const insert = async (table: string, row: Record<string, unknown>) => {
    const { error } = await db.from(table).insert({ ...row, user_id: user!.id });
    if (error) { toast.error(error.message); return false; }
    await load(); return true;
  };
  const remove = async (table: string, id: string) => {
    const { error } = await db.from(table).delete().eq("id", id).eq("user_id", user!.id);
    if (error) toast.error(error.message); else load();
  };
  const update = async (table: string, id: string, patch: Record<string, unknown>) => {
    const { error } = await db.from(table).update(patch).eq("id", id).eq("user_id", user!.id);
    if (error) toast.error(error.message); else load();
  };

  // ---------- Forms state ----------
  const [subForm, setSubForm] = useState({ name: "", teacher: "", coefficient: "1", room: "" });
  const [asgForm, setAsgForm] = useState({ title: "", description: "", subject_id: "", kind: "exercice", is_project: false, due_date: "", estimated_minutes: "" });
  const [examForm, setExamForm] = useState({ title: "", subject_id: "", exam_date: "", chapters: "" });
  const [slotForm, setSlotForm] = useState({ subject_id: "", day_of_week: "0", start_time: "08:00", end_time: "09:00", room: "" });
  const [gradeForm, setGradeForm] = useState({ subject_id: "", title: "", value: "", out_of: "20", coefficient: "1" });

  const weekLimit = Date.now() + 7 * 86400000;
  const dueThisWeek = assignments.filter(a => a.status !== "done" && a.due_date && new Date(a.due_date).getTime() <= weekLimit);

  // ---------- Averages ----------
  const averages = useMemo(() => {
    const bySub: Record<string, { sum: number; w: number }> = {};
    grades.forEach(g => {
      const k = g.subject_id || "none";
      const v = (Number(g.value) / Number(g.out_of)) * 20;
      bySub[k] = bySub[k] || { sum: 0, w: 0 };
      bySub[k].sum += v * Number(g.coefficient); bySub[k].w += Number(g.coefficient);
    });
    let gs = 0, gw = 0;
    const list = Object.entries(bySub).map(([id, { sum, w }]) => {
      const avg = sum / w;
      const coef = Number(subjects.find(s => s.id === id)?.coefficient ?? 1);
      gs += avg * coef; gw += coef;
      return { id, avg };
    });
    return { list, general: gw ? gs / gw : null };
  }, [grades, subjects]);

  const gradeCurve = grades.map(g => ({ date: g.graded_at.slice(5), note: Math.round((Number(g.value) / Number(g.out_of)) * 200) / 10 }));

  // ---------- AI ----------
  const breakdown = async (a: Assignment) => {
    setBusy(a.id);
    try {
      const r = await callAI("breakdown", { titre: a.title, consigne: a.description, type: a.kind, matiere: subjectName(a.subject_id), date_rendu: a.due_date });
      const rows = (r.subtasks || []).slice(0, 8).map((s: any, i: number) => ({ assignment_id: a.id, user_id: user!.id, title: String(s.title), estimated_minutes: Number(s.minutes) || null, sort_order: i }));
      if (rows.length) await db.from("assignment_milestones").insert(rows);
      if (r.tip) toast.success(r.tip);
      load();
    } catch (e: any) { toast.error(e.message); } finally { setBusy(null); }
  };

  const revisionPlan = async (ex: Exam) => {
    setBusy(ex.id);
    try {
      const r = await callAI("revision_plan", { examen: ex.title, matiere: subjectName(ex.subject_id), date: ex.exam_date, chapitres: ex.chapters });
      const rows = (r.sessions || []).slice(0, 10).map((s: any) => ({
        user_id: user!.id, title: `Révision · ${s.title}`, description: `${subjectName(ex.subject_id)} — ${s.minutes || 45} min`,
        due_date: s.date, priority: "medium", completed: false, subject_id: ex.subject_id,
      }));
      if (rows.length) {
        const { error } = await db.from("tasks").insert(rows);
        if (error) throw error;
        toast.success(`${rows.length} sessions de révision ajoutées à vos tâches et au calendrier`);
      }
    } catch (e: any) { toast.error(e.message); } finally { setBusy(null); }
  };

  const runCoach = async () => {
    setBusy("coach");
    try {
      const r = await callAI("coach", {
        devoirs_en_retard: assignments.filter(a => a.status !== "done" && a.due_date && new Date(a.due_date) < new Date()).map(a => ({ titre: a.title, matiere: subjectName(a.subject_id) })),
        a_rendre_semaine: dueThisWeek.map(a => ({ titre: a.title, date: a.due_date })),
        examens: exams.filter(e => new Date(e.exam_date) > new Date()).map(e => ({ titre: e.title, date: e.exam_date, matiere: subjectName(e.subject_id) })),
        moyennes: averages.list.map(l => ({ matiere: subjectName(l.id === "none" ? null : l.id), moyenne: Math.round(l.avg * 10) / 10 })),
        minutes_etude_par_matiere: Object.entries(studyMinutes).map(([id, m]) => ({ matiere: subjectName(id), minutes: m })),
      });
      setCoach({ summary: String(r.summary || ""), advices: Array.isArray(r.advices) ? r.advices : [] });
    } catch (e: any) { toast.error(e.message); } finally { setBusy(null); }
  };

  const SubjectSelect = ({ value, onChange }: { value: string; onChange: (v: string) => void }) => (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="h-11"><SelectValue placeholder="Matière" /></SelectTrigger>
      <SelectContent>{subjects.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
    </Select>
  );

  return (
    <div className="space-y-6 p-4 md:p-6 max-w-6xl mx-auto">
      <div className="flex items-center gap-3">
        <div className="p-3 rounded-2xl bg-primary/10"><GraduationCap className="h-6 w-6 text-primary" /></div>
        <div>
          <h1 className="text-2xl font-bold">Études</h1>
          <p className="text-sm text-muted-foreground">Devoirs, examens, emploi du temps et notes au même endroit</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">À rendre (7 j)</p><p className="text-2xl font-bold">{dueThisWeek.length}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Prochain examen</p><p className="text-sm font-semibold truncate">{exams.find(e => new Date(e.exam_date) > new Date())?.title ?? "—"}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Moyenne générale</p><p className="text-2xl font-bold">{averages.general != null ? averages.general.toFixed(2) : "—"}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Heures d'étude</p><p className="text-2xl font-bold">{(Object.values(studyMinutes).reduce((a, b) => a + b, 0) / 60).toFixed(1)} h</p></CardContent></Card>
      </div>

      <Tabs defaultValue="devoirs">
        <TabsList className="flex flex-wrap h-auto">
          <TabsTrigger value="devoirs">Devoirs & projets</TabsTrigger>
          <TabsTrigger value="examens">Examens</TabsTrigger>
          <TabsTrigger value="edt">Emploi du temps</TabsTrigger>
          <TabsTrigger value="notes">Notes</TabsTrigger>
          <TabsTrigger value="matieres">Matières</TabsTrigger>
          <TabsTrigger value="coach">Coach IA</TabsTrigger>
        </TabsList>

        {/* DEVOIRS */}
        <TabsContent value="devoirs" className="space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-lg">Nouveau devoir ou projet</CardTitle></CardHeader>
            <CardContent className="grid gap-3 md:grid-cols-2">
              <Input className="h-11" placeholder="Titre" value={asgForm.title} onChange={e => setAsgForm({ ...asgForm, title: e.target.value })} />
              <SubjectSelect value={asgForm.subject_id} onChange={v => setAsgForm({ ...asgForm, subject_id: v })} />
              <Select value={asgForm.kind} onValueChange={v => setAsgForm({ ...asgForm, kind: v })}>
                <SelectTrigger className="h-11"><SelectValue /></SelectTrigger>
                <SelectContent>{["exercice", "dissertation", "exposé", "lecture", "projet"].map(k => <SelectItem key={k} value={k}>{k}</SelectItem>)}</SelectContent>
              </Select>
              <Input className="h-11" type="datetime-local" value={asgForm.due_date} onChange={e => setAsgForm({ ...asgForm, due_date: e.target.value })} />
              <Input className="h-11" type="number" placeholder="Charge estimée (min)" value={asgForm.estimated_minutes} onChange={e => setAsgForm({ ...asgForm, estimated_minutes: e.target.value })} />
              <label className="flex items-center gap-2 text-sm"><Checkbox checked={asgForm.is_project} onCheckedChange={v => setAsgForm({ ...asgForm, is_project: !!v })} />Projet long (avec étapes)</label>
              <Textarea className="md:col-span-2" placeholder="Consigne (utile pour le découpage IA)" value={asgForm.description} onChange={e => setAsgForm({ ...asgForm, description: e.target.value })} />
              <Button className="md:col-span-2 h-11" disabled={!asgForm.title} onClick={async () => {
                const ok = await insert("assignments", {
                  title: asgForm.title, description: asgForm.description || null, subject_id: asgForm.subject_id || null, kind: asgForm.kind,
                  is_project: asgForm.is_project, due_date: asgForm.due_date ? new Date(asgForm.due_date).toISOString() : null,
                  estimated_minutes: asgForm.estimated_minutes ? Number(asgForm.estimated_minutes) : null,
                });
                if (ok) setAsgForm({ title: "", description: "", subject_id: "", kind: "exercice", is_project: false, due_date: "", estimated_minutes: "" });
              }}><Plus className="h-4 w-4 mr-2" />Ajouter</Button>
            </CardContent>
          </Card>

          {assignments.length === 0 && <p className="text-sm text-muted-foreground text-center py-6">Aucun devoir pour l'instant.</p>}
          {assignments.map(a => {
            const ms = milestones.filter(m => m.assignment_id === a.id);
            const pct = ms.length ? Math.round((ms.filter(m => m.completed).length / ms.length) * 100) : a.status === "done" ? 100 : 0;
            const late = a.status !== "done" && a.due_date && new Date(a.due_date) < new Date();
            return (
              <Card key={a.id} className={a.status === "done" ? "opacity-60" : ""}>
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start gap-3">
                    <Checkbox className="mt-1" checked={a.status === "done"} onCheckedChange={v => update("assignments", a.id, { status: v ? "done" : "todo" })} />
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-medium">{a.title}</span>
                        <Badge variant="outline" style={{ borderColor: subjectColor(a.subject_id), color: subjectColor(a.subject_id) }}>{subjectName(a.subject_id)}</Badge>
                        <Badge variant="secondary">{a.is_project ? "projet" : a.kind}</Badge>
                        {late && <Badge variant="destructive">En retard</Badge>}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {a.due_date ? `À rendre le ${new Date(a.due_date).toLocaleString("fr-FR", { dateStyle: "medium", timeStyle: "short" })}` : "Sans date"}
                        {a.estimated_minutes ? ` · ~${a.estimated_minutes} min` : ""}
                      </p>
                    </div>
                    <Button size="sm" variant="outline" disabled={busy === a.id} onClick={() => breakdown(a)}>
                      {busy === a.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}<span className="ml-1 hidden sm:inline">Découper (IA)</span>
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => remove("assignments", a.id)}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                  {ms.length > 0 && (
                    <div className="pl-7 space-y-2">
                      <div className="h-1.5 rounded-full bg-muted overflow-hidden"><div className="h-full bg-primary transition-all" style={{ width: `${pct}%` }} /></div>
                      {ms.map(m => (
                        <label key={m.id} className="flex items-center gap-2 text-sm">
                          <Checkbox checked={m.completed} onCheckedChange={v => update("assignment_milestones", m.id, { completed: !!v })} />
                          <span className={m.completed ? "line-through text-muted-foreground" : ""}>{m.title}</span>
                          {m.estimated_minutes ? <span className="text-xs text-muted-foreground">{m.estimated_minutes} min</span> : null}
                        </label>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </TabsContent>

        {/* EXAMENS */}
        <TabsContent value="examens" className="space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-lg">Nouvel examen</CardTitle></CardHeader>
            <CardContent className="grid gap-3 md:grid-cols-2">
              <Input className="h-11" placeholder="Intitulé" value={examForm.title} onChange={e => setExamForm({ ...examForm, title: e.target.value })} />
              <SubjectSelect value={examForm.subject_id} onChange={v => setExamForm({ ...examForm, subject_id: v })} />
              <Input className="h-11" type="datetime-local" value={examForm.exam_date} onChange={e => setExamForm({ ...examForm, exam_date: e.target.value })} />
              <Input className="h-11" placeholder="Chapitres" value={examForm.chapters} onChange={e => setExamForm({ ...examForm, chapters: e.target.value })} />
              <Button className="md:col-span-2 h-11" disabled={!examForm.title || !examForm.exam_date} onClick={async () => {
                const ok = await insert("exams", { title: examForm.title, subject_id: examForm.subject_id || null, exam_date: new Date(examForm.exam_date).toISOString(), chapters: examForm.chapters || null });
                if (ok) setExamForm({ title: "", subject_id: "", exam_date: "", chapters: "" });
              }}><Plus className="h-4 w-4 mr-2" />Ajouter</Button>
            </CardContent>
          </Card>
          {exams.map(ex => {
            const days = Math.ceil((new Date(ex.exam_date).getTime() - Date.now()) / 86400000);
            return (
              <Card key={ex.id}>
                <CardContent className="p-4 flex items-center gap-3">
                  <CalendarClock className="h-5 w-5" style={{ color: subjectColor(ex.subject_id) }} />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium">{ex.title} <span className="text-xs text-muted-foreground">· {subjectName(ex.subject_id)}</span></p>
                    <p className="text-xs text-muted-foreground">{new Date(ex.exam_date).toLocaleDateString("fr-FR", { dateStyle: "full" })}{ex.chapters ? ` · ${ex.chapters}` : ""}</p>
                  </div>
                  <Badge variant={days <= 3 && days >= 0 ? "destructive" : "secondary"}>{days < 0 ? "Passé" : `J-${days}`}</Badge>
                  {days >= 0 && (
                    <Button size="sm" variant="outline" disabled={busy === ex.id} onClick={() => revisionPlan(ex)}>
                      {busy === ex.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}<span className="ml-1 hidden sm:inline">Planning de révision</span>
                    </Button>
                  )}
                  <Button size="icon" variant="ghost" onClick={() => remove("exams", ex.id)}><Trash2 className="h-4 w-4" /></Button>
                </CardContent>
              </Card>
            );
          })}
        </TabsContent>

        {/* EMPLOI DU TEMPS */}
        <TabsContent value="edt" className="space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-lg">Ajouter un cours</CardTitle></CardHeader>
            <CardContent className="grid gap-3 md:grid-cols-5">
              <SubjectSelect value={slotForm.subject_id} onChange={v => setSlotForm({ ...slotForm, subject_id: v })} />
              <Select value={slotForm.day_of_week} onValueChange={v => setSlotForm({ ...slotForm, day_of_week: v })}>
                <SelectTrigger className="h-11"><SelectValue /></SelectTrigger>
                <SelectContent>{DAYS.map((d, i) => <SelectItem key={d} value={String(i)}>{d}</SelectItem>)}</SelectContent>
              </Select>
              <Input className="h-11" type="time" value={slotForm.start_time} onChange={e => setSlotForm({ ...slotForm, start_time: e.target.value })} />
              <Input className="h-11" type="time" value={slotForm.end_time} onChange={e => setSlotForm({ ...slotForm, end_time: e.target.value })} />
              <Button className="h-11" disabled={!slotForm.subject_id} onClick={() => insert("class_schedule", { subject_id: slotForm.subject_id, day_of_week: Number(slotForm.day_of_week), start_time: slotForm.start_time, end_time: slotForm.end_time, room: subjects.find(s => s.id === slotForm.subject_id)?.room ?? null })}><Plus className="h-4 w-4" /></Button>
            </CardContent>
          </Card>
          <div className="grid gap-3 md:grid-cols-3 lg:grid-cols-7">
            {DAYS.map((d, i) => (
              <Card key={d}>
                <CardHeader className="p-3 pb-1"><CardTitle className="text-sm">{d}</CardTitle></CardHeader>
                <CardContent className="p-3 space-y-2">
                  {slots.filter(s => s.day_of_week === i).map(s => (
                    <div key={s.id} className="rounded-xl p-2 text-xs group relative" style={{ background: `${subjectColor(s.subject_id)}22`, borderLeft: `3px solid ${subjectColor(s.subject_id)}` }}>
                      <p className="font-medium">{subjectName(s.subject_id)}</p>
                      <p className="text-muted-foreground">{s.start_time.slice(0, 5)}–{s.end_time.slice(0, 5)}{s.room ? ` · ${s.room}` : ""}</p>
                      <button className="absolute top-1 right-1 opacity-0 group-hover:opacity-100" onClick={() => remove("class_schedule", s.id)}><Trash2 className="h-3 w-3" /></button>
                    </div>
                  ))}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* NOTES */}
        <TabsContent value="notes" className="space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-lg">Ajouter une note</CardTitle></CardHeader>
            <CardContent className="grid gap-3 md:grid-cols-6">
              <SubjectSelect value={gradeForm.subject_id} onChange={v => setGradeForm({ ...gradeForm, subject_id: v })} />
              <Input className="h-11 md:col-span-2" placeholder="Intitulé (ex: DS 2)" value={gradeForm.title} onChange={e => setGradeForm({ ...gradeForm, title: e.target.value })} />
              <Input className="h-11" type="number" placeholder="Note" value={gradeForm.value} onChange={e => setGradeForm({ ...gradeForm, value: e.target.value })} />
              <Input className="h-11" type="number" placeholder="Sur" value={gradeForm.out_of} onChange={e => setGradeForm({ ...gradeForm, out_of: e.target.value })} />
              <Input className="h-11" type="number" placeholder="Coef" value={gradeForm.coefficient} onChange={e => setGradeForm({ ...gradeForm, coefficient: e.target.value })} />
              <Button className="md:col-span-6 h-11" disabled={!gradeForm.subject_id || gradeForm.value === ""} onClick={async () => {
                const ok = await insert("grades", { subject_id: gradeForm.subject_id, title: gradeForm.title || null, value: Number(gradeForm.value), out_of: Number(gradeForm.out_of) || 20, coefficient: Number(gradeForm.coefficient) || 1, graded_at: toLocalDateKey(new Date()) });
                if (ok) setGradeForm({ ...gradeForm, title: "", value: "" });
              }}><Plus className="h-4 w-4 mr-2" />Ajouter</Button>
            </CardContent>
          </Card>
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader><CardTitle className="text-lg">Moyennes /20</CardTitle><CardDescription>Pondérées par coefficient</CardDescription></CardHeader>
              <CardContent className="space-y-2">
                {averages.list.map(l => (
                  <div key={l.id} className="flex items-center gap-3">
                    <span className="w-32 truncate text-sm">{subjectName(l.id === "none" ? null : l.id)}</span>
                    <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden"><div className="h-full" style={{ width: `${(l.avg / 20) * 100}%`, background: subjectColor(l.id) }} /></div>
                    <span className="text-sm font-semibold w-12 text-right">{l.avg.toFixed(1)}</span>
                  </div>
                ))}
                {averages.list.length === 0 && <p className="text-sm text-muted-foreground">Aucune note.</p>}
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-lg">Évolution</CardTitle></CardHeader>
              <CardContent className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={gradeCurve}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="date" fontSize={11} />
                    <YAxis domain={[0, 20]} fontSize={11} />
                    <Tooltip />
                    <Line type="monotone" dataKey="note" stroke="hsl(var(--primary))" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
          {grades.slice().reverse().map(g => (
            <div key={g.id} className="flex items-center gap-3 text-sm p-2 rounded-xl bg-muted/30">
              <span className="flex-1">{subjectName(g.subject_id)} · {g.title || "Note"}</span>
              <span className="font-semibold">{g.value}/{g.out_of}</span>
              <span className="text-xs text-muted-foreground">coef {g.coefficient}</span>
              <Button size="icon" variant="ghost" onClick={() => remove("grades", g.id)}><Trash2 className="h-4 w-4" /></Button>
            </div>
          ))}
        </TabsContent>

        {/* MATIERES */}
        <TabsContent value="matieres" className="space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-lg">Nouvelle matière</CardTitle></CardHeader>
            <CardContent className="grid gap-3 md:grid-cols-5">
              <Input className="h-11" placeholder="Nom" value={subForm.name} onChange={e => setSubForm({ ...subForm, name: e.target.value })} />
              <Input className="h-11" placeholder="Professeur" value={subForm.teacher} onChange={e => setSubForm({ ...subForm, teacher: e.target.value })} />
              <Input className="h-11" type="number" placeholder="Coefficient" value={subForm.coefficient} onChange={e => setSubForm({ ...subForm, coefficient: e.target.value })} />
              <Input className="h-11" placeholder="Salle" value={subForm.room} onChange={e => setSubForm({ ...subForm, room: e.target.value })} />
              <Button className="h-11" disabled={!subForm.name} onClick={async () => {
                const ok = await insert("subjects", { name: subForm.name, teacher: subForm.teacher || null, coefficient: Number(subForm.coefficient) || 1, room: subForm.room || null, color: COLORS[subjects.length % COLORS.length] });
                if (ok) setSubForm({ name: "", teacher: "", coefficient: "1", room: "" });
              }}><Plus className="h-4 w-4" /></Button>
            </CardContent>
          </Card>
          <div className="grid gap-3 md:grid-cols-3">
            {subjects.map(s => (
              <Card key={s.id}>
                <CardContent className="p-4 flex items-start gap-3">
                  <div className="w-3 h-10 rounded-full" style={{ background: s.color ?? undefined }} />
                  <div className="flex-1">
                    <p className="font-medium">{s.name}</p>
                    <p className="text-xs text-muted-foreground">{[s.teacher, s.room, `coef ${s.coefficient}`].filter(Boolean).join(" · ")}</p>
                    <p className="text-xs text-muted-foreground mt-1"><BookOpen className="inline h-3 w-3 mr-1" />{Math.round((studyMinutes[s.id] || 0) / 60 * 10) / 10} h d'étude</p>
                  </div>
                  <Button size="icon" variant="ghost" onClick={() => remove("subjects", s.id)}><Trash2 className="h-4 w-4" /></Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* COACH */}
        <TabsContent value="coach" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2"><Lightbulb className="h-5 w-5 text-primary" />Coach d'études</CardTitle>
              <CardDescription>Conseils basés sur vos devoirs, examens, notes et temps d'étude (1 crédit IA)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button className="h-11" disabled={busy === "coach"} onClick={runCoach}>
                {busy === "coach" ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Wand2 className="h-4 w-4 mr-2" />}Analyser mes études
              </Button>
              {coach && (
                <div className="space-y-3">
                  <p className="text-sm">{coach.summary}</p>
                  {coach.advices.map((a, i) => (
                    <div key={i} className="p-3 rounded-xl bg-muted/30">
                      <p className="font-medium text-sm">{a.title}</p>
                      <p className="text-sm text-muted-foreground">{a.detail}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

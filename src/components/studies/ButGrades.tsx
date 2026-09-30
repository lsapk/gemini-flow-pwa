import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import curriculum from "@/data/butCurriculum.json";

type Module = { code: string; name: string; coefs: number[] };
type Semester = { number: number; ues: string[]; modules: Module[] };
type Program = { id: string; label: string; semesters: Semester[] };

const PROGRAMS = curriculum as Program[];
const BONUS = "__BONUS__";
const db = supabase as any;

function ueAverages(sem: Semester, notes: Record<string, number>) {
  const bonus = notes[BONUS] || 0;
  return sem.ues.map((_, i) => {
    let sum = 0, w = 0;
    sem.modules.forEach(m => {
      const n = notes[m.code];
      if (n != null && m.coefs[i]) { sum += n * m.coefs[i]; w += m.coefs[i]; }
    });
    return w ? Math.min(20, sum / w + bonus) : null;
  });
}

const tone = (v: number | null) => v == null ? "text-muted-foreground" : v >= 10 ? "text-primary" : v >= 8 ? "text-foreground" : "text-destructive";

export function ButGrades() {
  const { user } = useAuth();
  const [programId, setProgramId] = useState(PROGRAMS[0].id);
  const [semNum, setSemNum] = useState(PROGRAMS[0].semesters[0].number);
  const [notes, setNotes] = useState<Record<string, Record<string, number>>>({});

  useEffect(() => {
    if (!user) return;
    db.from("user_settings").select("but_program").eq("id", user.id).maybeSingle().then(({ data }: any) => {
      const p = PROGRAMS.find(x => x.id === data?.but_program);
      if (p) { setProgramId(p.id); setSemNum(p.semesters[0].number); }
    });
    db.from("but_grades").select("*").eq("user_id", user.id).then(({ data }: any) => {
      const map: Record<string, Record<string, number>> = {};
      (data || []).forEach((g: any) => {
        const k = `${g.program_id}|${g.semester}`;
        (map[k] ||= {})[g.module_code] = Number(g.value);
      });
      setNotes(map);
    });
  }, [user]);

  const program = PROGRAMS.find(p => p.id === programId)!;
  const sem = program.semesters.find(s => s.number === semNum) || program.semesters[0];
  const key = `${program.id}|${sem.number}`;
  const semNotes = notes[key] || {};
  const avgs = useMemo(() => ueAverages(sem, semNotes), [sem, semNotes]);

  const yearAvgs = useMemo(() => {
    const per = program.semesters.map(s => ueAverages(s, notes[`${program.id}|${s.number}`] || {}));
    return per[0].map((_, i) => {
      const vals = per.map(p => p[i]).filter((v): v is number => v != null);
      return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null;
    });
  }, [program, notes]);
  const validated = yearAvgs.filter(v => v != null && v >= 10).length;
  const under8 = yearAvgs.some(v => v != null && v < 8);

  const changeProgram = async (id: string) => {
    const p = PROGRAMS.find(x => x.id === id)!;
    setProgramId(id); setSemNum(p.semesters[0].number);
    if (user) await db.from("user_settings").update({ but_program: id }).eq("id", user.id);
  };

  const saveNote = async (code: string, raw: string) => {
    if (!user) return;
    const trimmed = raw.replace(",", ".").trim();
    const next = { ...semNotes };
    if (trimmed === "") {
      delete next[code];
      setNotes({ ...notes, [key]: next });
      await db.from("but_grades").delete().eq("user_id", user.id).eq("program_id", program.id).eq("semester", sem.number).eq("module_code", code);
      return;
    }
    const v = Number(trimmed);
    if (isNaN(v) || v < 0 || v > 20) return toast.error("Note entre 0 et 20");
    if (next[code] === v) return;
    next[code] = v;
    setNotes({ ...notes, [key]: next });
    const { error } = await db.from("but_grades").upsert(
      { user_id: user.id, program_id: program.id, semester: sem.number, module_code: code, value: v, updated_at: new Date().toISOString() },
      { onConflict: "user_id,program_id,semester,module_code" },
    );
    if (error) toast.error("Note non enregistrée");
  };

  const filled = sem.modules.filter(m => semNotes[m.code] != null).length;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <CardTitle className="text-lg">Moyennes BUT Informatique</CardTitle>
            <CardDescription>Coefficients officiels IUT Lyon 1 – Doua (rentrée 2026)</CardDescription>
          </div>
          <Select value={programId} onValueChange={changeProgram}>
            <SelectTrigger className="h-11 md:w-72"><SelectValue /></SelectTrigger>
            <SelectContent>{PROGRAMS.map(p => <SelectItem key={p.id} value={p.id}>{p.id}</SelectItem>)}</SelectContent>
          </Select>
        </CardHeader>
        <CardContent className="space-y-4">
          <Tabs value={String(sem.number)} onValueChange={v => setSemNum(Number(v))}>
            <TabsList>{program.semesters.map(s => <TabsTrigger key={s.number} value={String(s.number)}>Semestre {s.number}</TabsTrigger>)}</TabsList>
          </Tabs>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
            {sem.ues.map((ue, i) => (
              <div key={ue} className="p-3 rounded-xl bg-muted/30 text-center">
                <p className="text-xs text-muted-foreground">{ue} · C{i + 1}</p>
                <p className={`text-xl font-bold ${tone(avgs[i])}`}>{avgs[i] != null ? avgs[i]!.toFixed(2) : "—"}</p>
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">{filled}/{sem.modules.length} notes saisies. Les moyennes sont calculées sur les modules déjà notés.</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-lg">Notes du semestre {sem.number}</CardTitle></CardHeader>
        <CardContent className="space-y-1">
          <div className="hidden md:grid grid-cols-[1fr_repeat(6,44px)_88px] gap-2 text-xs text-muted-foreground px-2">
            <span>Module</span>{sem.ues.map(u => <span key={u} className="text-center">{u}</span>)}<span className="text-center">Note /20</span>
          </div>
          {sem.modules.map(m => (
            <div key={m.code} className="grid grid-cols-[1fr_88px] md:grid-cols-[1fr_repeat(6,44px)_88px] gap-2 items-center p-2 rounded-xl hover:bg-muted/30">
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{m.name}</p>
                <p className="text-xs text-muted-foreground">{m.code}<span className="md:hidden"> · coef {m.coefs.map((c, i) => c ? `C${i + 1}:${c}` : "").filter(Boolean).join(" ")}</span></p>
              </div>
              {m.coefs.map((c, i) => <span key={i} className="hidden md:block text-center text-xs text-muted-foreground">{c || ""}</span>)}
              <Input key={`${key}-${m.code}`} className="h-11 text-center" inputMode="decimal" placeholder="—" defaultValue={semNotes[m.code] ?? ""} onBlur={e => saveNote(m.code, e.target.value)} />
            </div>
          ))}
          <div className="grid grid-cols-[1fr_88px] gap-2 items-center p-2 rounded-xl bg-muted/20">
            <p className="text-sm font-medium">Bonus semestre (ajouté à chaque compétence)</p>
            <Input key={`${key}-bonus`} className="h-11 text-center" inputMode="decimal" placeholder="0" defaultValue={semNotes[BONUS] ?? ""} onBlur={e => saveNote(BONUS, e.target.value)} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Bilan de l'année</CardTitle>
          <CardDescription>Compétence validée à partir de 10 de moyenne annuelle. Passage : au moins 4 compétences validées et aucune sous 8.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
            {yearAvgs.map((v, i) => (
              <div key={i} className="p-3 rounded-xl bg-muted/30 text-center">
                <p className="text-xs text-muted-foreground">C{i + 1}</p>
                <p className={`text-xl font-bold ${tone(v)}`}>{v != null ? v.toFixed(2) : "—"}</p>
              </div>
            ))}
          </div>
          <Badge variant={validated >= 4 && !under8 ? "default" : "secondary"}>
            {validated}/6 compétences validées{under8 ? " · une compétence sous 8" : ""}
          </Badge>
        </CardContent>
      </Card>
    </div>
  );
}

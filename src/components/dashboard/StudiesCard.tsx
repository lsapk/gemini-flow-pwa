import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useStudentMode } from "@/hooks/useStudentMode";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { GraduationCap, ChevronRight } from "lucide-react";

const db = supabase as any;

export function StudiesCard() {
  const { user } = useAuth();
  const enabled = useStudentMode();
  const navigate = useNavigate();
  const [data, setData] = useState({ due: 0, exam: null as null | { title: string; days: number }, avg: null as number | null, hours: 0 });

  useEffect(() => {
    if (!user || !enabled) return;
    const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString();
    const weekAhead = new Date(Date.now() + 7 * 86400000).toISOString();
    Promise.all([
      db.from("assignments").select("id").eq("user_id", user.id).neq("status", "done").lte("due_date", weekAhead),
      db.from("exams").select("title, exam_date").eq("user_id", user.id).gte("exam_date", new Date().toISOString()).order("exam_date").limit(1),
      db.from("grades").select("value, out_of, coefficient").eq("user_id", user.id),
      db.from("focus_sessions").select("duration").eq("user_id", user.id).not("subject_id", "is", null).gte("started_at", weekAgo),
    ]).then(([a, e, g, f]) => {
      const grades = g.data || [];
      const w = grades.reduce((s: number, x: any) => s + Number(x.coefficient), 0);
      const avg = w ? grades.reduce((s: number, x: any) => s + (Number(x.value) / Number(x.out_of)) * 20 * Number(x.coefficient), 0) / w : null;
      const ex = e.data?.[0];
      setData({
        due: a.data?.length || 0,
        exam: ex ? { title: ex.title, days: Math.ceil((new Date(ex.exam_date).getTime() - Date.now()) / 86400000) } : null,
        avg,
        hours: (f.data || []).reduce((s: number, x: any) => s + (x.duration || 0), 0) / 60,
      });
    });
  }, [user, enabled]);

  if (!enabled) return null;

  return (
    <Card>
      <CardHeader className="pb-2 flex flex-row items-center justify-between">
        <CardTitle className="text-lg flex items-center gap-2"><GraduationCap className="h-5 w-5 text-primary" />Études</CardTitle>
        <Button variant="ghost" size="sm" onClick={() => navigate("/etudes")}>Ouvrir<ChevronRight className="h-4 w-4 ml-1" /></Button>
      </CardHeader>
      <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="p-3 rounded-xl bg-muted/30"><p className="text-xs text-muted-foreground">À rendre (7 j)</p><p className="text-xl font-bold">{data.due}</p></div>
        <div className="p-3 rounded-xl bg-muted/30"><p className="text-xs text-muted-foreground">Prochain examen</p><p className="text-sm font-semibold truncate">{data.exam ? `${data.exam.title} · J-${data.exam.days}` : "—"}</p></div>
        <div className="p-3 rounded-xl bg-muted/30"><p className="text-xs text-muted-foreground">Moyenne</p><p className="text-xl font-bold">{data.avg != null ? data.avg.toFixed(2) : "—"}</p></div>
        <div className="p-3 rounded-xl bg-muted/30"><p className="text-xs text-muted-foreground">Étude cette semaine</p><p className="text-xl font-bold">{data.hours.toFixed(1)} h</p></div>
      </CardContent>
    </Card>
  );
}

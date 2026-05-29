import { useState, useEffect, useRef, useCallback } from "react";
import { toLocalDateKey } from "@/utils/dateUtils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TrendingUp, History, Square, Play, Pause, PictureInPicture2, Timer, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useSoundService } from "@/hooks/useSoundService";
import { supabase } from "@/integrations/supabase/client";
import { SimpleBarChart } from "@/components/ui/charts/SimpleBarChart";
import { Task } from "@/types";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

interface ActiveFocusSession {
  id: string;
  title: string;
  duration: number;
  startTime: number;
  isActive: boolean;
  timeLeft: number;
  userId: string;
}

export default function Focus() {
  const [duration, setDuration] = useState(25);
  const [isCustomDuration, setIsCustomDuration] = useState(false);
  const [manualMinutes, setManualMinutes] = useState("25");
  const [timeLeft, setTimeLeft] = useState(duration * 60);
  const [isActive, setIsActive] = useState(false);
  const [sessionTitle, setSessionTitle] = useState("");
  const [completedSessionsToday, setCompletedSessionsToday] = useState(0);
  const [minutesToday, setMinutesToday] = useState(0);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [sessionsHistory, setSessionsHistory] = useState<any[]>([]);
  const [weeklyData, setWeeklyData] = useState<{ name: string; minutes: number }[]>([]);
  const [isPipActive, setIsPipActive] = useState(false);
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [manualSession, setManualSession] = useState({
    title: "",
    duration: 25,
    date: new Date().toISOString().split('T')[0],
    startTime: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }).replace('h', ':')
  });
  const pipWindowRef = useRef<any>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();
  const sound = useSoundService();

  useEffect(() => { if (!currentSessionId) setTimeLeft(duration * 60); }, [duration, currentSessionId]);
  useEffect(() => { if (user) { loadSessionsToday(); checkActiveSession(); loadSessionsHistory(); loadWeeklyData(); } }, [user]);

  const loadSessionsToday = async () => {
    if (!user) return;
    const today = new Date(); today.setHours(0, 0, 0, 0);
    try {
      const { data, error } = await supabase.from('focus_sessions').select('duration').eq('user_id', user.id).gte('started_at', today.toISOString()).not('completed_at', 'is', null);
      if (error) { console.error('Error loading sessions:', error); } else { setCompletedSessionsToday(data?.length || 0); setMinutesToday(data.reduce((sum, s) => sum + (s.duration || 0), 0)); }
    } catch (error) { console.error('Error loading sessions:', error); }
  };

  const checkActiveSession = () => {
    const saved = localStorage.getItem('active_focus_session');
    if (saved) {
      try {
        const session: ActiveFocusSession = JSON.parse(saved);
        const elapsed = Math.floor((Date.now() - session.startTime) / 1000);
        const remaining = session.isActive ? (session.duration * 60 - elapsed) : session.timeLeft;
        if (remaining > 0) { setCurrentSessionId(session.id); setSessionTitle(session.title); setDuration(session.duration); setTimeLeft(Math.ceil(remaining)); setIsActive(session.isActive); } else { localStorage.removeItem('active_focus_session'); }
      } catch (error) { console.error('Error parsing saved session:', error); localStorage.removeItem('active_focus_session'); }
    }
  };

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(prev => { 
          if (prev <= 1) { setIsActive(false); handleTimerComplete(); return 0; } 
          const n = prev - 1; 
          saveSessionState({ timeLeft: n }); 
          return n; 
        });
      }, 1000);
    }
    return () => { if (interval) clearInterval(interval); };
  }, [isActive, timeLeft]);

  useEffect(() => {
    if (isPipActive && canvasRef.current) {
      drawPipCanvas(canvasRef.current, timeLeft, duration * 60, sessionTitle, isActive);
    }
  }, [timeLeft, isActive, isPipActive, sessionTitle, duration]);

  const saveSessionState = (updates: Partial<ActiveFocusSession>) => { const s = localStorage.getItem('active_focus_session'); if (s) { localStorage.setItem('active_focus_session', JSON.stringify({ ...JSON.parse(s), ...updates })); } };
  const formatTime = (t: number) => `${Math.floor(t / 60).toString().padStart(2, '0')}:${(t % 60).toString().padStart(2, '0')}`;

  const startTimer = async () => {
    if (!sessionTitle.trim()) { toast({ title: "Titre requis", description: "Veuillez entrer un titre pour votre session.", variant: "destructive" }); return; }
    if (!user) return;
    const sessionId = `focus_${Date.now()}`; const startTime = new Date();
    setIsActive(true); setCurrentSessionId(sessionId); setTimeLeft(duration * 60);
    localStorage.setItem('active_focus_session', JSON.stringify({ id: sessionId, title: sessionTitle, duration, startTime: startTime.getTime(), isActive: true, timeLeft: duration * 60, userId: user.id }));
    sound.playTimerStart();
    toast({ title: "Session démarrée", description: `Session de ${duration} minutes commencée.` });
  };

  const pauseTimer = () => { 
    const n = !isActive; 
    setIsActive(n); 
    saveSessionState({ isActive: n, timeLeft }); 
    sound.playTimerPause();
    toast({ title: n ? "Session reprise" : "Session en pause" }); 
  };

  const stopTimer = async () => {
    if (!currentSessionId || !user) return;
    const raw = localStorage.getItem('active_focus_session'); if (!raw) return;
    const sd: ActiveFocusSession = JSON.parse(raw); const completed = sd.duration * 60 - timeLeft;
    try {
      const { error } = await supabase.from('focus_sessions').insert({ user_id: user.id, title: sd.title, duration: Math.floor(completed / 60), started_at: new Date(sd.startTime).toISOString(), completed_at: new Date().toISOString() });
      if (error) throw error;
      sound.playDelete();
      toast({ title: "Session arrêtée", description: `Session enregistrée de ${Math.floor(completed / 60)} minutes.` }); loadSessionsToday();
    } catch (error) { console.error('Error stopping session:', error); toast({ variant: "destructive", title: "Erreur lors de l'arrêt" }); } finally { localStorage.removeItem('active_focus_session'); closePip(); resetSession(); }
  };

  const handleTimerComplete = async () => {
    if (!currentSessionId || !user) return;
    const raw = localStorage.getItem('active_focus_session'); if (!raw) return;
    const sd: ActiveFocusSession = JSON.parse(raw);
    try {
      await supabase.from('focus_sessions').insert({ user_id: user.id, title: sd.title, duration: sd.duration, started_at: new Date(sd.startTime).toISOString(), completed_at: new Date().toISOString() });
      sound.playTimerComplete();
      toast({ title: "🎉 Session terminée !", description: `Félicitations ! Session de ${duration} minutes complétée.` });
    } catch (error) { console.error('Error completing session:', error); } finally { localStorage.removeItem('active_focus_session'); closePip(); resetSession(); loadSessionsToday(); }
  };

  const resetSession = () => { setIsActive(false); setCurrentSessionId(null); setTimeLeft(duration * 60); setSessionTitle(""); };

  const loadSessionsHistory = async () => { if (!user) return; try { const { data, error } = await supabase.from('focus_sessions').select('*').eq('user_id', user.id).order('started_at', { ascending: false }).limit(10); if (error) throw error; setSessionsHistory(data || []); } catch (error) { console.error(error); } };

  const handleManualSubmit = async () => {
    if (!user || !manualSession.title || manualSession.duration <= 0) return;
    try {

      const [hours, minutes] = manualSession.startTime.split(':').map(Number);
      const startedAt = new Date(manualSession.date);
      startedAt.setHours(hours, minutes, 0, 0);

      const completedAt = new Date(startedAt.getTime() + manualSession.duration * 60000);

      const { error } = await supabase.from('focus_sessions').insert({
        user_id: user.id,
        title: manualSession.title,
        duration: manualSession.duration,
        started_at: startedAt.toISOString(),
        completed_at: completedAt.toISOString()
      });

      if (error) throw error;

      toast({ title: "Session ajoutée", description: "La session a été enregistrée manuellement." });
      setIsManualModalOpen(false);
      setManualSession({
        title: "",
        duration: 25,
        date: new Date().toISOString().split('T')[0],
        startTime: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }).replace('h', ':')
      });
      loadSessionsToday();
      loadSessionsHistory();
      loadWeeklyData();
    } catch (error) {
      console.error(error);
      toast({ variant: "destructive", title: "Erreur", description: "Impossible d'ajouter la session." });
    }
  };

  const loadWeeklyData = async () => {
    if (!user) return;
    try {
      const ago = new Date(); ago.setDate(ago.getDate() - 7);
      const { data, error } = await supabase.from('focus_sessions').select('duration, started_at').eq('user_id', user.id).gte('started_at', ago.toISOString()).not('completed_at', 'is', null);
      if (error) throw error;
      const days = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
      const dd: { [k: string]: number } = {};
      data?.forEach(s => { const d = days[new Date(s.started_at).getDay()]; dd[d] = (dd[d] || 0) + (s.duration || 0); });
      setWeeklyData(days.map(d => ({ name: d, minutes: dd[d] || 0 })));
    } catch (error) { console.error(error); }
  };

  const drawPipCanvas = (canvas: HTMLCanvasElement, timeLeftVal: number, totalSecondsVal: number, title: string, active: boolean) => {
    const ctx = canvas.getContext('2d'); if (!ctx) return;
    const w = canvas.width; const h = canvas.height;
    ctx.fillStyle = '#050505'; ctx.fillRect(0, 0, w, h);
    const cx = w / 2; const cy = h / 2 - 10; const r = Math.min(w, h) * 0.35;
    const progressVal = totalSecondsVal > 0 ? (totalSecondsVal - timeLeftVal) / totalSecondsVal : 0;
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.strokeStyle = '#222'; ctx.lineWidth = 8; ctx.stroke();
    ctx.beginPath(); ctx.arc(cx, cy, r, -Math.PI / 2, -Math.PI / 2 + progressVal * Math.PI * 2); ctx.strokeStyle = '#6366f1'; ctx.lineWidth = 8; ctx.lineCap = 'round'; ctx.stroke();
    const mins = Math.floor(timeLeftVal / 60).toString().padStart(2, '0'); const secs = (timeLeftVal % 60).toString().padStart(2, '0');
    ctx.fillStyle = '#ffffff'; ctx.font = 'bold 36px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(`${mins}:${secs}`, cx, cy);
    ctx.font = '12px sans-serif'; ctx.fillStyle = '#a0a0c0'; ctx.fillText(title.length > 25 ? title.substring(0, 22) + '...' : title, cx, h - 15);
  };

  const openPip = async () => {
    try {
      const canvas = document.createElement('canvas'); canvas.width = 300; canvas.height = 300; canvasRef.current = canvas;
      drawPipCanvas(canvas, timeLeft, duration * 60, sessionTitle, isActive);
      const stream = canvas.captureStream(30); const video = document.createElement('video'); video.srcObject = stream; video.muted = true; video.autoplay = true; video.playsInline = true; videoRef.current = video;
      await video.play();
      if ('documentPictureInPicture' in window) {
        const pipWin = await (window as any).documentPictureInPicture.requestWindow({ width: 300, height: 320 });
        pipWindowRef.current = pipWin;
        const style = pipWin.document.createElement('style'); style.textContent = `body { margin: 0; background: #050505; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; font-family: system-ui, sans-serif; overflow: hidden; } canvas { width: 100%; height: auto; }`;
        pipWin.document.head.appendChild(style); pipWin.document.body.appendChild(canvas);
        pipWin.addEventListener('pagehide', () => { setIsPipActive(false); pipWindowRef.current = null; });
        setIsPipActive(true);
      } else if (video.requestPictureInPicture) {
        video.style.position = 'fixed'; video.style.opacity = '0'; video.style.width = '1px'; document.body.appendChild(video);
        await video.requestPictureInPicture(); setIsPipActive(true);
        video.addEventListener('leavepictureinpicture', () => { setIsPipActive(false); video.remove(); videoRef.current = null; });
      }
    } catch (error) { console.error(error); }
  };

  const closePip = () => {
    if (pipWindowRef.current) {
      try { pipWindowRef.current.close(); } catch (e) { console.error('Error closing PiP window:', e); }
      pipWindowRef.current = null;
    }
    if (document.pictureInPictureElement) {
      try { document.exitPictureInPicture(); } catch (e) { console.error('Error exiting PiP:', e); }
    }
    setIsPipActive(false);
  };

  const totalSeconds = duration * 60;
  const progress = currentSessionId ? ((totalSeconds - timeLeft) / totalSeconds) : 0;
  const radius = 135;
  const circumference = 2 * Math.PI * radius;
  const strokeOffset = circumference * (1 - progress);
  const durationOptions = [15, 25, 30, 45, 60, 90];

  return (
    <div className="container mx-auto space-y-8 max-w-5xl px-4 sm:px-6 py-6 md:py-10 min-h-[calc(100vh-80px)] flex flex-col items-center">
      <div className="text-center space-y-2">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-transparent">Focus</h1>
        <p className="text-muted-foreground text-sm font-medium">Entrez dans la zone de concentration</p>
      </div>

      <div className="w-full flex flex-col items-center gap-12">
        <div className="w-full max-w-md flex flex-col items-center">
          <AnimatePresence mode="wait">
            {!currentSessionId ? (
              <motion.div key="setup" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="w-full space-y-10 flex flex-col items-center">
                <div className="w-full space-y-4">
                  <Input value={sessionTitle} onChange={(e) => setSessionTitle(e.target.value)} placeholder="Qu'allez-vous accomplir ?" className="h-14 text-lg text-center rounded-[2rem] bg-card/40 border-primary/20 focus:border-primary/40 focus:ring-primary/20 backdrop-blur-md" />
                  <div className="flex flex-wrap justify-center gap-2 px-2">
                    {durationOptions.map((opt) => (
                      <button key={opt} onClick={() => { setDuration(opt); setIsCustomDuration(false); }} className={cn("px-4 py-2 rounded-full text-sm font-semibold transition-all duration-300", duration === opt && !isCustomDuration ? "bg-primary text-white shadow-lg shadow-primary/20 scale-105" : "bg-secondary/40 text-muted-foreground hover:bg-secondary/60")}>{opt}m</button>
                    ))}
                    <button onClick={() => setIsCustomDuration(true)} className={cn("px-4 py-2 rounded-full text-sm font-semibold transition-all duration-300", isCustomDuration ? "bg-primary text-white shadow-lg shadow-primary/20 scale-105" : "bg-secondary/40 text-muted-foreground hover:bg-secondary/60")}>Perso</button>
                  </div>
                  {isCustomDuration && (
                    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex justify-center">
                      <div className="flex items-center gap-2 bg-card/40 p-2 rounded-2xl border border-primary/10">
                        <Input type="number" value={manualMinutes} onChange={(e) => { setManualMinutes(e.target.value); const val = parseInt(e.target.value); if (val > 0) setDuration(val); }} className="w-20 h-10 text-center bg-transparent border-none text-lg font-bold focus-visible:ring-0" />
                        <span className="text-muted-foreground pr-3 font-medium">minutes</span>
                      </div>
                    </motion.div>
                  )}
                </div>

                <div className="relative group cursor-pointer" onClick={startTimer}>
                  <div className="absolute inset-0 bg-primary/10 blur-[80px] rounded-full opacity-30 group-hover:opacity-50 transition-opacity"></div>
                  <div className="relative w-72 h-72 sm:w-80 sm:h-80 flex items-center justify-center">
                    <svg viewBox="0 0 320 320" className="w-full h-full -rotate-90">
                      <circle cx="160" cy="160" r={radius} fill="none" stroke="currentColor" strokeWidth="4" className="text-secondary/20" />
                      <circle cx="160" cy="160" r={radius} fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="4 8" className="text-primary/30" />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center space-y-1">
                      <span className="text-6xl font-heading font-extrabold tracking-tighter">{duration}</span>
                      <span className="text-xs uppercase tracking-[0.2em] font-bold text-muted-foreground">MINUTES</span>
                    </div>
                  </div>
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="absolute -bottom-4 left-1/2 -translate-x-1/2">
                    <Button size="lg" className="rounded-full px-8 h-12 font-bold shadow-xl shadow-primary/20">DÉMARRER</Button>
                  </motion.div>
                </div>
              </motion.div>
            ) : (
              <motion.div key="active" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="w-full flex flex-col items-center space-y-12">
                <div className="text-center space-y-1">
                  <h2 className="text-xl font-bold text-foreground/90 tracking-tight">{sessionTitle}</h2>
                  <p className="text-xs font-bold text-primary/60 uppercase tracking-widest">EN CONCENTRATION</p>
                </div>

                <div className="relative w-80 h-80 flex items-center justify-center">
                  <div className={cn("absolute inset-0 bg-primary/10 blur-[100px] rounded-full transition-opacity duration-1000", isActive ? "opacity-40" : "opacity-10")}></div>
                  <svg viewBox="0 0 320 320" className="w-full h-full -rotate-90">
                    <circle cx="160" cy="160" r={radius} fill="none" stroke="currentColor" strokeWidth="4" className="text-secondary/10" />
                    <motion.circle cx="160" cy="160" r={radius} fill="none" stroke="hsl(var(--primary))" strokeWidth="12" strokeLinecap="round" strokeDasharray={circumference} animate={{ strokeDashoffset: strokeOffset }} transition={{ type: "tween", ease: "linear", duration: 1 }} className="drop-shadow-[0_0_12px_rgba(var(--primary-rgb),0.5)]" />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <motion.span key={timeLeft} className="text-7xl font-heading font-extrabold tracking-tighter" initial={{ scale: 1.05, opacity: 0.8 }} animate={{ scale: 1, opacity: 1 }}>{formatTime(timeLeft)}</motion.span>
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mt-2">{isActive ? "Reste" : "En pause"}</p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <Button onClick={pauseTimer} variant="secondary" size="icon" className="h-14 w-14 rounded-full bg-card/60 backdrop-blur-xl border-primary/10 shadow-lg hover:scale-110 active:scale-95 transition-all">{isActive ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6 fill-current" />}</Button>
                  <Button onClick={stopTimer} variant="secondary" size="icon" className="h-14 w-14 rounded-full bg-card/60 backdrop-blur-xl border-primary/10 shadow-lg hover:scale-110 active:scale-95 transition-all"><Square className="h-5 w-5 fill-current" /></Button>
                  <Button onClick={isPipActive ? closePip : openPip} variant="secondary" size="icon" className={cn("h-14 w-14 rounded-full bg-card/60 backdrop-blur-xl border-primary/10 shadow-lg hover:scale-110 active:scale-95 transition-all", isPipActive && "text-primary border-primary/30")}><PictureInPicture2 className="h-5 w-5" /></Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-6 pt-10">
          <Card className="rounded-[2rem] bg-card/30 border-primary/5 backdrop-blur-sm">
            <CardHeader className="pb-2"><CardTitle className="text-sm font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2"><TrendingUp className="h-4 w-4" /> Activité Récente</CardTitle></CardHeader>
            <CardContent className="p-4">{weeklyData.length > 0 ? <SimpleBarChart data={weeklyData.map(d => ({ name: d.name, value: d.minutes }))} xAxisKey="name" barKey="value" color="hsl(var(--primary))" className="h-32" /> : <div className="h-32 flex items-center justify-center text-xs text-muted-foreground">Aucune donnée</div>}</CardContent>
          </Card>
          <Card className="rounded-[2rem] bg-card/30 border-primary/5 backdrop-blur-sm overflow-hidden">
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                <History className="h-4 w-4" /> Historique
              </CardTitle>
              <Dialog open={isManualModalOpen} onOpenChange={setIsManualModalOpen}>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-primary/10 text-primary">
                    <Plus className="h-4 w-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="rounded-[2rem] bg-card/95 backdrop-blur-2xl border-primary/10">
                  <DialogHeader>
                    <DialogTitle className="text-xl font-bold">Ajouter une session</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="title">Titre de la session</Label>
                      <Input id="title" value={manualSession.title} onChange={(e) => setManualSession({...manualSession, title: e.target.value})} placeholder="Ex: Travail sur le projet DeepFlow" className="rounded-xl" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="date">Date</Label>
                        <Input id="date" type="date" value={manualSession.date} onChange={(e) => setManualSession({...manualSession, date: e.target.value})} className="rounded-xl" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="startTime">Heure de début</Label>
                        <Input id="startTime" type="time" value={manualSession.startTime} onChange={(e) => setManualSession({...manualSession, startTime: e.target.value})} className="rounded-xl" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="duration">Durée (minutes)</Label>
                      <Input id="duration" type="number" value={manualSession.duration} onChange={(e) => setManualSession({...manualSession, duration: parseInt(e.target.value) || 0})} className="rounded-xl" />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button onClick={handleManualSubmit} className="w-full rounded-xl font-bold">Enregistrer la session</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-primary/5 max-h-[160px] overflow-y-auto">
                {sessionsHistory.length > 0 ? sessionsHistory.map((s) => (
                  <div key={s.id} className="p-4 flex items-center justify-between hover:bg-primary/5 transition-colors">
                    <div className="min-w-0 flex-1"><p className="text-sm font-bold truncate">{s.title}</p><p className="text-[10px] text-muted-foreground font-medium uppercase">{new Date(s.started_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}</p></div>
                    <Badge variant="secondary" className="bg-primary/10 text-primary border-none text-[10px] h-5">{s.duration}m</Badge>
                  </div>
                )) : <div className="p-10 text-center text-xs text-muted-foreground">Commencez votre première session !</div>}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

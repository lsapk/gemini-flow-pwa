import { useState, useEffect, useRef, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Play, Pause, Square, TrendingUp, CheckCircle2, Target, ListTodo, History, Plus, Calendar, Timer, PictureInPicture2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useSoundService } from "@/hooks/useSoundService";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SimpleBarChart } from "@/components/ui/charts/SimpleBarChart";
import { Task } from "@/types";
import { motion, AnimatePresence } from "framer-motion";

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
  const [customDuration, setCustomDuration] = useState("");
  const [isCustomDuration, setIsCustomDuration] = useState(false);
  const [timeLeft, setTimeLeft] = useState(duration * 60);
  const [isActive, setIsActive] = useState(false);
  const [sessionTitle, setSessionTitle] = useState("");
  const [completedSessionsToday, setCompletedSessionsToday] = useState(0);
  const [minutesToday, setMinutesToday] = useState(0);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [sessionsHistory, setSessionsHistory] = useState<any[]>([]);
  const [weeklyData, setWeeklyData] = useState<{ name: string; minutes: number }[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [linkedTaskId, setLinkedTaskId] = useState<string | null>(null);
  const [manualTitle, setManualTitle] = useState("");
  const [manualDuration, setManualDuration] = useState("");
  const [manualDate, setManualDate] = useState(new Date().toISOString().split('T')[0]);
  const [manualTime, setManualTime] = useState("09:00");
  const [isAddingManual, setIsAddingManual] = useState(false);
  const [isPipActive, setIsPipActive] = useState(false);
  const pipWindowRef = useRef<any>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();
  const sound = useSoundService();

  useEffect(() => { if (!currentSessionId) setTimeLeft(duration * 60); }, [duration, currentSessionId]);
  useEffect(() => { if (user) { loadSessionsToday(); checkActiveSession(); loadSessionsHistory(); loadWeeklyData(); loadTasks(); } }, [user]);

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

  // Update PiP canvas when time changes
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
      if ('Notification' in window && Notification.permission === 'granted') { new Notification('Session terminée !', { body: `"${sessionTitle}" terminée.`, icon: '/icons/icon-192x192.png' }); }
    } catch (error) { console.error('Error completing session:', error); } finally { localStorage.removeItem('active_focus_session'); closePip(); resetSession(); loadSessionsToday(); }
  };

  const resetSession = () => { setIsActive(false); setCurrentSessionId(null); setTimeLeft(duration * 60); setSessionTitle(""); setLinkedTaskId(null); };

  const loadSessionsHistory = async () => { if (!user) return; try { const { data, error } = await supabase.from('focus_sessions').select('*').eq('user_id', user.id).order('started_at', { ascending: false }).limit(10); if (error) throw error; setSessionsHistory(data || []); } catch (error) { console.error(error); } };

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

  const loadTasks = async () => {
    if (!user) return;
    try { const { data, error } = await supabase.from('tasks').select('*').eq('user_id', user.id).eq('completed', false).order('priority', { ascending: false }).limit(50); if (error) throw error; setTasks((data || []).map(t => ({ ...t, priority: t.priority as 'high' | 'medium' | 'low' }))); } catch (error) { console.error(error); }
  };

  const completeLinkedTask = async () => {
    if (!linkedTaskId || !user) return;
    try { const { error } = await supabase.from('tasks').update({ completed: true }).eq('id', linkedTaskId).eq('user_id', user.id); if (error) throw error; sound.playComplete(); toast({ title: "Tâche complétée !" }); loadTasks(); } catch (error) { console.error(error); }
  };

  const addManualSession = async () => {
    if (!user) return;
    if (!manualTitle.trim()) { toast({ title: "Titre requis", variant: "destructive" }); return; }
    if (!manualDuration || parseInt(manualDuration) <= 0) { toast({ title: "Durée invalide", variant: "destructive" }); return; }
    setIsAddingManual(true);
    try {
      const start = new Date(`${manualDate}T${manualTime}`); const dur = parseInt(manualDuration); const end = new Date(start.getTime() + dur * 60 * 1000);
      const { error } = await supabase.from('focus_sessions').insert({ user_id: user.id, title: manualTitle.trim(), duration: dur, started_at: start.toISOString(), completed_at: end.toISOString() });
      sound.playCreate();
      toast({ title: "Session ajoutée !", description: `Session de ${dur} minutes enregistrée.` });
      setManualTitle(""); setManualDuration(""); setManualDate(new Date().toISOString().split('T')[0]); setManualTime("09:00");
      loadSessionsToday(); loadSessionsHistory(); loadWeeklyData();
    } catch (error) { console.error(error); toast({ variant: "destructive", title: "Erreur" }); } finally { setIsAddingManual(false); }
  };

  // === Picture-in-Picture ===
  const drawPipCanvas = (canvas: HTMLCanvasElement, timeLeftVal: number, totalSecondsVal: number, title: string, active: boolean) => {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const w = canvas.width;
    const h = canvas.height;
    
    // Background
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, w, h);
    
    // Progress ring
    const cx = w / 2;
    const cy = h / 2 - 10;
    const r = Math.min(w, h) * 0.3;
    const progressVal = totalSecondsVal > 0 ? (totalSecondsVal - timeLeftVal) / totalSecondsVal : 0;
    
    // Background circle
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.strokeStyle = '#333355';
    ctx.lineWidth = 6;
    ctx.stroke();
    
    // Progress arc
    ctx.beginPath();
    ctx.arc(cx, cy, r, -Math.PI / 2, -Math.PI / 2 + progressVal * Math.PI * 2);
    ctx.strokeStyle = '#6077f5';
    ctx.lineWidth = 6;
    ctx.lineCap = 'round';
    ctx.stroke();
    
    // Time text
    const mins = Math.floor(timeLeftVal / 60).toString().padStart(2, '0');
    const secs = (timeLeftVal % 60).toString().padStart(2, '0');
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 32px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${mins}:${secs}`, cx, cy);
    
    // Status text
    ctx.font = '12px sans-serif';
    ctx.fillStyle = active ? '#4ade80' : '#facc15';
    ctx.fillText(active ? '● En cours' : '⏸ Pause', cx, cy + r + 20);
    
    // Title
    ctx.font = '11px sans-serif';
    ctx.fillStyle = '#a0a0c0';
    const truncTitle = title.length > 25 ? title.substring(0, 22) + '...' : title;
    ctx.fillText(truncTitle, cx, h - 12);
  };

  const openPip = async () => {
    try {
      // Create a canvas to render the timer
      const canvas = document.createElement('canvas');
      canvas.width = 300;
      canvas.height = 300;
      canvasRef.current = canvas;
      
      // Draw initial frame
      drawPipCanvas(canvas, timeLeft, duration * 60, sessionTitle, isActive);
      
      // Create video from canvas stream
      const stream = canvas.captureStream(30);
      const video = document.createElement('video');
      video.srcObject = stream;
      video.muted = true;
      video.autoplay = true;
      video.playsInline = true;
      videoRef.current = video;
      
      await video.play();
      
      // Try Document PiP API first (Chrome 116+)
      if ('documentPictureInPicture' in window) {
        const pipWin = await (window as any).documentPictureInPicture.requestWindow({
          width: 300,
          height: 340,
        });
        pipWindowRef.current = pipWin;
        
        // Style the PiP window
        const style = pipWin.document.createElement('style');
        style.textContent = `
          body { margin: 0; background: #1a1a2e; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; font-family: system-ui, sans-serif; color: white; overflow: hidden; }
          canvas { width: 100%; height: auto; }
          .controls { display: flex; gap: 8px; margin-top: 8px; }
          button { padding: 6px 16px; border-radius: 8px; border: none; cursor: pointer; font-size: 13px; font-weight: 600; }
          .pause-btn { background: #6077f5; color: white; }
          .stop-btn { background: #ef4444; color: white; }
          button:hover { opacity: 0.9; }
        `;
        pipWin.document.head.appendChild(style);
        
        // Add canvas
        pipWin.document.body.appendChild(canvas);
        
        // Add controls
        const controls = pipWin.document.createElement('div');
        controls.className = 'controls';
        
        const pauseBtn = pipWin.document.createElement('button');
        pauseBtn.className = 'pause-btn';
        pauseBtn.textContent = isActive ? '⏸ Pause' : '▶ Reprendre';
        pauseBtn.onclick = () => { pauseTimer(); pauseBtn.textContent = !isActive ? '⏸ Pause' : '▶ Reprendre'; };
        
        const stopBtn = pipWin.document.createElement('button');
        stopBtn.className = 'stop-btn';
        stopBtn.textContent = '⏹ Arrêter';
        stopBtn.onclick = () => { stopTimer(); };
        
        controls.appendChild(pauseBtn);
        controls.appendChild(stopBtn);
        pipWin.document.body.appendChild(controls);
        
        pipWin.addEventListener('pagehide', () => {
          setIsPipActive(false);
          pipWindowRef.current = null;
        });
        
        setIsPipActive(true);
      } 
      // Fallback to standard PiP API
      else if (video.requestPictureInPicture) {
        // Need to add video to DOM temporarily
        video.style.position = 'fixed';
        video.style.opacity = '0';
        video.style.pointerEvents = 'none';
        video.style.width = '1px';
        video.style.height = '1px';
        document.body.appendChild(video);
        
        await video.requestPictureInPicture();
        setIsPipActive(true);
        
        video.addEventListener('leavepictureinpicture', () => {
          setIsPipActive(false);
          video.remove();
          videoRef.current = null;
        });
      } else {
        toast({ title: "PiP non supporté", description: "Votre navigateur ne supporte pas le Picture-in-Picture.", variant: "destructive" });
      }
    } catch (error) {
      console.error('PiP error:', error);
      toast({ title: "Erreur PiP", description: "Impossible d'activer le mode Picture-in-Picture.", variant: "destructive" });
    }
  };

  const closePip = () => {
    if (pipWindowRef.current) {
      try { pipWindowRef.current.close(); } catch {}
      pipWindowRef.current = null;
    }
    if (document.pictureInPictureElement) {
      try { document.exitPictureInPicture(); } catch {}
    }
    if (videoRef.current) {
      try { videoRef.current.remove(); } catch {}
      videoRef.current = null;
    }
    canvasRef.current = null;
    setIsPipActive(false);
  };

  // SVG Timer calculations
  const totalSeconds = duration * 60;
  const progress = currentSessionId ? ((totalSeconds - timeLeft) / totalSeconds) : 0;
  const radius = 140;
  const circumference = 2 * Math.PI * radius;
  const strokeOffset = circumference * (1 - progress);

  return (
    <div className="container mx-auto space-y-6 max-w-7xl px-3 sm:px-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight flex items-center gap-2">
            <Timer className="h-7 w-7 text-primary" />
            Mode Focus
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Concentrez-vous sur ce qui compte vraiment</p>
        </div>
      </div>

      {/* Stat Pills */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { icon: Target, label: "Sessions", value: completedSessionsToday, color: "text-primary" },
          { icon: TrendingUp, label: "Minutes", value: minutesToday, color: "text-blue-500" },
          { icon: CheckCircle2, label: "Statut", value: currentSessionId ? (isActive ? "Actif" : "Pause") : "Prêt", color: "text-green-500" },
          { icon: History, label: "Moy/jour", value: weeklyData.length > 0 ? Math.round(weeklyData.reduce((s, d) => s + d.minutes, 0) / 7) : 0, color: "text-purple-500" },
        ].map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05, duration: 0.3 }}
          >
            <Card className="backdrop-blur-sm bg-card/80 border-border/40 hover:bg-card/90 transition-all duration-200">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl flex items-center justify-center bg-secondary/50">
                  <stat.icon className={`h-5 w-5 ${stat.color}`} />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                  <p className="text-xl font-bold">{stat.value}</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Timer Card */}
        <Card className="lg:col-span-2 backdrop-blur-sm bg-card/80 border-border/40 overflow-hidden">
          <CardContent className="p-6 sm:p-8">
            <AnimatePresence mode="wait">
              {!currentSessionId ? (
                <motion.div
                  key="setup"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-6"
                >
                  <div>
                    <h2 className="text-xl font-semibold mb-1">Nouvelle session</h2>
                    <p className="text-sm text-muted-foreground">Démarrez une session de concentration profonde</p>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="session-title" className="text-sm font-medium">Titre de la session</Label>
                      <Input id="session-title" value={sessionTitle} onChange={(e) => setSessionTitle(e.target.value)} placeholder="Ex: Étude de maths, Rédaction..." className="mt-2" />
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Durée</Label>
                      <Select value={isCustomDuration ? "custom" : duration.toString()} onValueChange={(v) => { if (v === "custom") { setIsCustomDuration(true); } else { setIsCustomDuration(false); setDuration(parseInt(v)); } }}>
                        <SelectTrigger className="mt-2"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="15">15 minutes</SelectItem>
                          <SelectItem value="25">25 min (Pomodoro)</SelectItem>
                          <SelectItem value="30">30 minutes</SelectItem>
                          <SelectItem value="45">45 minutes</SelectItem>
                          <SelectItem value="60">60 minutes</SelectItem>
                          <SelectItem value="90">90 minutes</SelectItem>
                          <SelectItem value="custom">Personnalisé</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    {isCustomDuration && (
                      <div>
                        <Label className="text-sm font-medium">Durée personnalisée (min)</Label>
                        <Input type="number" min="1" max="240" value={customDuration} onChange={(e) => { setCustomDuration(e.target.value); if (e.target.value && parseInt(e.target.value) > 0) setDuration(parseInt(e.target.value)); }} placeholder="Ex: 20, 40..." className="mt-2" />
                      </div>
                    )}
                    {tasks.length > 0 && (
                      <div>
                        <Label className="text-sm font-medium">Lier à une tâche (optionnel)</Label>
                        <Select value={linkedTaskId || "none"} onValueChange={(v) => setLinkedTaskId(v === "none" ? null : v)}>
                          <SelectTrigger className="mt-2"><SelectValue placeholder="Aucune" /></SelectTrigger>
                          <SelectContent className="max-h-60"><SelectItem value="none">Aucune tâche</SelectItem>{tasks.map(t => <SelectItem key={t.id} value={t.id}>{t.title}</SelectItem>)}</SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>

                  {/* Preview timer */}
                  <div className="flex flex-col items-center pt-4">
                    <div className="relative w-48 h-48 sm:w-56 sm:h-56">
                      <svg viewBox="0 0 320 320" className="w-full h-full -rotate-90">
                        <circle cx="160" cy="160" r={radius} fill="none" stroke="hsl(var(--secondary))" strokeWidth="8" />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-4xl sm:text-5xl font-mono font-bold text-foreground">{formatTime(duration * 60)}</span>
                        <span className="text-xs text-muted-foreground mt-1">prêt</span>
                      </div>
                    </div>
                    <Button onClick={startTimer} size="lg" className="mt-6 rounded-2xl px-10 h-12 active:scale-[0.95] transition-transform">
                      <Play className="mr-2 h-5 w-5" />Démarrer
                    </Button>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="active"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  className="flex flex-col items-center space-y-6"
                >
                  <div className="text-center">
                    <h2 className="text-lg font-semibold">{sessionTitle}</h2>
                    <p className="text-sm text-muted-foreground">Session de {duration} minutes</p>
                  </div>

                  {/* SVG Ring Timer */}
                  <div className="relative w-64 h-64 sm:w-80 sm:h-80">
                    <svg viewBox="0 0 320 320" className="w-full h-full -rotate-90">
                      <circle cx="160" cy="160" r={radius} fill="none" stroke="hsl(var(--secondary))" strokeWidth="8" strokeLinecap="round" />
                      <motion.circle
                        cx="160" cy="160" r={radius}
                        fill="none"
                        stroke="hsl(var(--primary))"
                        strokeWidth="10"
                        strokeLinecap="round"
                        strokeDasharray={circumference}
                        animate={{ strokeDashoffset: strokeOffset }}
                        transition={{ type: "spring", bounce: 0, duration: 0.8 }}
                        style={{ filter: "drop-shadow(0 0 8px hsl(var(--primary) / 0.4))" }}
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <motion.span
                        key={timeLeft}
                        className="text-5xl sm:text-6xl font-mono font-bold text-foreground"
                        initial={{ scale: 1.02 }}
                        animate={{ scale: 1 }}
                        transition={{ duration: 0.15 }}
                      >
                        {formatTime(timeLeft)}
                      </motion.span>
                      <span className="text-xs text-muted-foreground mt-1">
                        {isActive ? "en cours" : "en pause"}
                      </span>
                    </div>
                  </div>

                  {/* Controls */}
                  <div className="flex flex-wrap gap-3 justify-center">
                    <Button onClick={pauseTimer} variant="outline" size="lg" className="rounded-2xl h-12 px-6 active:scale-[0.95] transition-transform">
                      {isActive ? <><Pause className="mr-2 h-4 w-4" />Pause</> : <><Play className="mr-2 h-4 w-4" />Reprendre</>}
                    </Button>
                    <Button onClick={stopTimer} variant="destructive" size="lg" className="rounded-2xl h-12 px-6 active:scale-[0.95] transition-transform">
                      <Square className="mr-2 h-4 w-4" />Arrêter
                    </Button>
                    {linkedTaskId && (
                      <Button onClick={completeLinkedTask} size="lg" className="rounded-2xl h-12 px-6 active:scale-[0.95] transition-transform">
                        <CheckCircle2 className="mr-2 h-4 w-4" />Terminer tâche
                      </Button>
                    )}
                    <Button 
                      onClick={isPipActive ? closePip : openPip} 
                      variant="outline" 
                      size="lg" 
                      className={`rounded-2xl h-12 px-6 active:scale-[0.95] transition-transform ${isPipActive ? 'border-primary text-primary' : ''}`}
                      title="Picture-in-Picture"
                    >
                      <PictureInPicture2 className="mr-2 h-4 w-4" />
                      PiP
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>

        {/* Side Panel */}
        <Card className="lg:col-span-1 backdrop-blur-sm bg-card/80 border-border/40">
          <Tabs defaultValue="stats" className="w-full">
            <div className="p-4 pb-0">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="stats">Stats</TabsTrigger>
                <TabsTrigger value="history">Historique</TabsTrigger>
                <TabsTrigger value="manual"><Plus className="h-4 w-4" /></TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="stats" className="space-y-4 p-4">
              <div>
                <h3 className="text-sm font-semibold mb-3">Focus cette semaine</h3>
                {weeklyData.length > 0 ? (
                  <SimpleBarChart data={weeklyData.map(d => ({ name: d.name, value: d.minutes }))} xAxisKey="name" barKey="value" color="hsl(var(--primary))" className="h-48" />
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-8">Aucune donnée</p>
                )}
              </div>
              {tasks.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold mb-2 flex items-center gap-2"><ListTodo className="h-4 w-4" />Tâches en attente</h3>
                  <div className="space-y-2">
                    {tasks.slice(0, 3).map(t => (
                      <div key={t.id} className="text-xs p-3 rounded-xl bg-secondary/50 hover:bg-secondary/70 transition-colors cursor-pointer active:scale-[0.98]" onClick={() => setLinkedTaskId(t.id)}>
                        <p className="font-medium truncate">{t.title}</p>
                        <p className="text-muted-foreground capitalize">{t.priority}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="history" className="space-y-2 p-4">
              <h3 className="text-sm font-semibold mb-3">Sessions récentes</h3>
              {sessionsHistory.length > 0 ? (
                <div className="space-y-2 max-h-[400px] overflow-y-auto">
                  {sessionsHistory.map((s) => (
                    <motion.div key={s.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-xs p-3 rounded-xl bg-secondary/50 space-y-1">
                      <p className="font-medium truncate">{s.title}</p>
                      <div className="flex items-center justify-between text-muted-foreground">
                        <span>{s.duration} min</span>
                        <span>{new Date(s.started_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}</span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">Aucune session</p>
              )}
            </TabsContent>

            <TabsContent value="manual" className="space-y-4 p-4">
              <div>
                <h3 className="text-sm font-semibold mb-1 flex items-center gap-2"><Calendar className="h-4 w-4" />Ajouter manuellement</h3>
                <p className="text-xs text-muted-foreground mb-4">Timer oublié ? Ajoutez votre session ici.</p>
              </div>
              <div className="space-y-3">
                <div><Label className="text-xs">Titre</Label><Input value={manualTitle} onChange={(e) => setManualTitle(e.target.value)} placeholder="Ex: Projet..." className="mt-1 h-9 text-sm" /></div>
                <div><Label className="text-xs">Durée (min)</Label><Input type="number" min="1" max="480" value={manualDuration} onChange={(e) => setManualDuration(e.target.value)} placeholder="45" className="mt-1 h-9 text-sm" /></div>
                <div className="grid grid-cols-2 gap-2">
                  <div><Label className="text-xs">Date</Label><Input type="date" value={manualDate} onChange={(e) => setManualDate(e.target.value)} max={new Date().toISOString().split('T')[0]} className="mt-1 h-9 text-sm" /></div>
                  <div><Label className="text-xs">Heure</Label><Input type="time" value={manualTime} onChange={(e) => setManualTime(e.target.value)} className="mt-1 h-9 text-sm" /></div>
                </div>
                <Button onClick={addManualSession} className="w-full mt-2 rounded-2xl active:scale-[0.95] transition-transform" disabled={isAddingManual}>
                  {isAddingManual ? "Ajout..." : <><Plus className="mr-2 h-4 w-4" />Ajouter</>}
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </Card>
      </div>
    </div>
  );
}

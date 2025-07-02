interface FocusSession {
  id: string;
  title: string;
  duration: number;
  startTime: number;
  isRunning: boolean;
}

class BackgroundFocusService {
  private static instance: BackgroundFocusService;
  private sessions: Map<string, FocusSession> = new Map();
  private intervals: Map<string, NodeJS.Timeout> = new Map();
  private callbacks: Map<string, (timeLeft: number, isComplete: boolean) => void> = new Map();

  static getInstance(): BackgroundFocusService {
    if (!BackgroundFocusService.instance) {
      BackgroundFocusService.instance = new BackgroundFocusService();
    }
    return BackgroundFocusService.instance;
  }

  startSession(id: string, title: string, duration: number): void {
    if (this.sessions.has(id)) {
      this.stopSession(id);
    }
    const session: FocusSession = {
      id,
      title,
      duration: duration * 60, // mins to seconds
      startTime: Date.now(),
      isRunning: true,
    };

    this.sessions.set(id, session);
    this.clearInterval(id);

    const interval = setInterval(() => {
      this.updateSession(id);
    }, 1000);

    this.intervals.set(id, interval);

    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }

  pauseSession(id: string): void {
    const session = this.sessions.get(id);
    if (session && session.isRunning) {
      this.clearInterval(id);
      const elapsed = (Date.now() - session.startTime) / 1000;
      session.duration = session.duration - elapsed; // Update duration to remaining time
      session.isRunning = false;
    }
  }

  resumeSession(id: string): void {
    const session = this.sessions.get(id);
    if (session && !session.isRunning) {
      session.isRunning = true;
      session.startTime = Date.now(); // Reset start time
      
      const interval = setInterval(() => {
        this.updateSession(id);
      }, 1000);
      
      this.intervals.set(id, interval);
    }
  }

  stopSession(id: string): void {
    this.clearInterval(id);
    this.sessions.delete(id);
    this.callbacks.delete(id);
  }

  getTimeLeft(id: string): number {
    const session = this.sessions.get(id);
    if (!session) return 0;

    if (!session.isRunning) {
      return Math.max(0, session.duration);
    }

    const elapsed = Math.floor((Date.now() - session.startTime) / 1000);
    return Math.max(0, session.duration - elapsed);
  }

  isSessionActive(id: string): boolean {
    const session = this.sessions.get(id);
    return session ? session.isRunning : false;
  }

  onSessionUpdate(id: string, callback: (timeLeft: number, isComplete: boolean) => void): void {
    this.callbacks.set(id, callback);
  }

  private updateSession(id: string): void {
    const session = this.sessions.get(id);
    const callback = this.callbacks.get(id);
    
    if (!session || !callback) return;

    const timeLeft = this.getTimeLeft(id);
    const isComplete = timeLeft <= 0;

    callback(timeLeft, isComplete);

    if (isComplete) {
      this.handleSessionComplete(id, session);
    }
  }

  private handleSessionComplete(id: string, session: FocusSession): void {
    // Show notification
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('Session terminée !', {
        body: `Votre session "${session.title}" est terminée. Bien joué !`,
        icon: '/favicon.ico',
        tag: 'focus-complete'
      });
    }

    // Play sound if browser supports it
    try {
      const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DrwGWYC0GWrJO3B+l0W6BdHr+e3FMGOD1Yh89p4B/e53v6uC1');
      audio.play().catch(() => {
        // Ignore audio play errors
      });
    } catch (error) {
      // Ignore audio errors
    }

    this.stopSession(id);
  }

  private clearInterval(id: string): void {
    const interval = this.intervals.get(id);
    if (interval) {
      clearInterval(interval);
      this.intervals.delete(id);
    }
  }

  getAllActiveSessions(): Array<{ id: string; title: string; timeLeft: number }> {
    const activeSessions: Array<{ id: string; title: string; timeLeft: number }> = [];
    
    this.sessions.forEach((session, id) => {
      if (session.isRunning) {
        activeSessions.push({
          id,
          title: session.title,
          timeLeft: this.getTimeLeft(id)
        });
      }
    });
    
    return activeSessions;
  }
}

export default BackgroundFocusService;

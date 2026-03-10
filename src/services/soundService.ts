
class SoundService {
  private static instance: SoundService;
  private ctx: AudioContext | null = null;
  private enabled: boolean = true;

  static getInstance(): SoundService {
    if (!SoundService.instance) {
      SoundService.instance = new SoundService();
    }
    return SoundService.instance;
  }

  setEnabled(enabled: boolean) {
    this.enabled = enabled;
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  private getContext(): AudioContext {
    if (!this.ctx || this.ctx.state === 'closed') {
      this.ctx = new AudioContext();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  private playTone(freq: number, duration: number, type: OscillatorType = 'sine', volume = 0.15) {
    if (!this.enabled) return;
    try {
      const ctx = this.getContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(volume, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + duration);
    } catch (e) {
      // Silently fail if audio is not available
    }
  }

  private playSequence(notes: { freq: number; delay: number; duration: number; type?: OscillatorType; volume?: number }[]) {
    if (!this.enabled) return;
    notes.forEach(note => {
      setTimeout(() => {
        this.playTone(note.freq, note.duration, note.type || 'sine', note.volume || 0.15);
      }, note.delay);
    });
  }

  // === Sound Effects ===

  /** Habit/task completed */
  playComplete() {
    this.playSequence([
      { freq: 523, delay: 0, duration: 0.1 },
      { freq: 659, delay: 80, duration: 0.1 },
      { freq: 784, delay: 160, duration: 0.15 },
    ]);
  }

  /** Habit/task uncompleted */
  playUncomplete() {
    this.playTone(350, 0.12, 'triangle', 0.1);
  }

  /** Generic click / tap */
  playClick() {
    this.playTone(800, 0.04, 'sine', 0.08);
  }

  /** Error / warning */
  playError() {
    this.playSequence([
      { freq: 300, delay: 0, duration: 0.15, type: 'sawtooth', volume: 0.1 },
      { freq: 250, delay: 120, duration: 0.2, type: 'sawtooth', volume: 0.1 },
    ]);
  }

  /** Success (e.g., all habits done, goal reached) */
  playSuccess() {
    this.playSequence([
      { freq: 523, delay: 0, duration: 0.1 },
      { freq: 659, delay: 100, duration: 0.1 },
      { freq: 784, delay: 200, duration: 0.1 },
      { freq: 1047, delay: 300, duration: 0.25 },
    ]);
  }

  /** Focus timer start */
  playTimerStart() {
    this.playSequence([
      { freq: 440, delay: 0, duration: 0.08, type: 'triangle' },
      { freq: 660, delay: 100, duration: 0.12, type: 'triangle' },
    ]);
  }

  /** Focus timer pause/resume */
  playTimerPause() {
    this.playTone(440, 0.1, 'triangle', 0.1);
  }

  /** Focus timer complete - celebration */
  playTimerComplete() {
    this.playSequence([
      { freq: 523, delay: 0, duration: 0.12 },
      { freq: 659, delay: 120, duration: 0.12 },
      { freq: 784, delay: 240, duration: 0.12 },
      { freq: 1047, delay: 360, duration: 0.12 },
      { freq: 1319, delay: 480, duration: 0.3 },
    ]);
  }

  /** Streak milestone */
  playStreakMilestone() {
    this.playSequence([
      { freq: 660, delay: 0, duration: 0.08 },
      { freq: 880, delay: 80, duration: 0.08 },
      { freq: 1100, delay: 160, duration: 0.08 },
      { freq: 1320, delay: 240, duration: 0.2 },
    ]);
  }

  /** Navigation / page switch */
  playNavigate() {
    this.playTone(600, 0.04, 'sine', 0.05);
  }

  /** Delete / archive */
  playDelete() {
    this.playTone(250, 0.15, 'triangle', 0.1);
  }

  /** New item created */
  playCreate() {
    this.playSequence([
      { freq: 440, delay: 0, duration: 0.06, type: 'triangle' },
      { freq: 880, delay: 70, duration: 0.1, type: 'triangle' },
    ]);
  }
}

export default SoundService;

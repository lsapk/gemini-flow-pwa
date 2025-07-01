
import { supabase } from '@/integrations/supabase/client';

class BackgroundFocusService {
  private sessionId: string | null = null;
  private startTime: Date | null = null;
  private intervalId: NodeJS.Timeout | null = null;

  async startSession(userId: string): Promise<string | null> {
    try {
      // Vérifier s'il y a déjà une session active
      const { data: existingSession } = await supabase
        .from('background_focus_sessions')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .single();

      if (existingSession) {
        // Reprendre la session existante
        this.sessionId = existingSession.id;
        this.startTime = new Date(existingSession.started_at);
      } else {
        // Créer une nouvelle session
        const { data, error } = await supabase
          .from('background_focus_sessions')
          .insert({
            user_id: userId,
            is_active: true
          })
          .select()
          .single();

        if (error) throw error;

        this.sessionId = data.id;
        this.startTime = new Date();
      }

      // Démarrer le suivi du temps
      this.startTracking();
      return this.sessionId;
    } catch (error) {
      console.error('Erreur lors du démarrage de la session focus:', error);
      return null;
    }
  }

  async endSession(): Promise<void> {
    if (!this.sessionId || !this.startTime) return;

    try {
      const endTime = new Date();
      const durationMinutes = Math.floor((endTime.getTime() - this.startTime.getTime()) / (1000 * 60));

      await supabase
        .from('background_focus_sessions')
        .update({
          ended_at: endTime.toISOString(),
          duration_minutes: durationMinutes,
          is_active: false
        })
        .eq('id', this.sessionId);

      // Créer aussi une entrée dans focus_sessions pour la compatibilité
      await supabase
        .from('focus_sessions')
        .insert({
          user_id: (await supabase.auth.getUser()).data.user?.id,
          title: 'Session Focus en arrière-plan',
          duration: durationMinutes * 60, // en secondes
          started_at: this.startTime.toISOString(),
          completed_at: endTime.toISOString()
        });

      this.stopTracking();
      this.sessionId = null;
      this.startTime = null;
    } catch (error) {
      console.error('Erreur lors de la fin de la session focus:', error);
    }
  }

  private startTracking(): void {
    // Mettre à jour la durée toutes les minutes
    this.intervalId = setInterval(() => {
      this.updateSessionDuration();
    }, 60000); // 1 minute
  }

  private stopTracking(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  private async updateSessionDuration(): Promise<void> {
    if (!this.sessionId || !this.startTime) return;

    try {
      const currentTime = new Date();
      const durationMinutes = Math.floor((currentTime.getTime() - this.startTime.getTime()) / (1000 * 60));

      await supabase
        .from('background_focus_sessions')
        .update({
          duration_minutes: durationMinutes
        })
        .eq('id', this.sessionId);
    } catch (error) {
      console.error('Erreur lors de la mise à jour de la session:', error);
    }
  }

  isActive(): boolean {
    return this.sessionId !== null;
  }

  getCurrentDuration(): number {
    if (!this.startTime) return 0;
    return Math.floor((new Date().getTime() - this.startTime.getTime()) / (1000 * 60));
  }
}

export const backgroundFocusService = new BackgroundFocusService();

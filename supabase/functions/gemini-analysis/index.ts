
import { serve } from "https://deno.land/std@0.186.0/http/server.ts";
import { GoogleGenerativeAI } from "https://esm.sh/@google/generative-ai@0.24.1?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.2?target=deno";

// Define CORS headers for browser requests
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type LanguageCode = "fr" | "en" | "es" | "de";

// Helper function to get analysis prompt based on language
function getAnalysisPrompt(userData: any, language: LanguageCode = "fr"): string {
  const { tasks, habits, goals, focusSessions, journalEntries } = userData;
  
  // Format data for AI to analyze
  const completedTasks = tasks.filter((t: any) => t.completed).length;
  const pendingTasks = tasks.length - completedTasks;
  const habitsCount = habits.length;
  const goalsCount = goals.length;
  const goalsCompleted = goals.filter((g: any) => g.completed).length;
  const totalFocusTime = focusSessions.reduce((acc: number, s: any) => acc + (s.duration || 0), 0);
  const journalCount = journalEntries.length;
  
  const prompts = {
    fr: `Tu es DeepFlow, un assistant IA spécialisé en analyse de productivité et bien-être. Analyse ces données de l'utilisateur et crée un rapport détaillé avec des recommandations constructives.

Données utilisateur :
- Tâches: ${tasks.length} au total (${completedTasks} terminées, ${pendingTasks} en attente)
- Habitudes suivies: ${habitsCount}
- Objectifs: ${goalsCount} au total (${goalsCompleted} atteints)
- Temps total en sessions Focus: ${totalFocusTime} minutes
- Entrées de journal: ${journalCount}

Format souhaité :
1. Utilise du markdown riche avec des emojis pertinents
2. Commence par un résumé des tendances générales
3. Analyse les points forts et axes d'amélioration
4. Propose 3-5 conseils spécifiques basés sur les données
5. Conclus avec une note encourageante

Ton analyse doit être personnalisée, positive et orientée vers l'action.`,

    en: `You are DeepFlow, an AI assistant specialized in productivity and wellbeing analysis. Analyze this user data and create a detailed report with constructive recommendations.

User data:
- Tasks: ${tasks.length} total (${completedTasks} completed, ${pendingTasks} pending)
- Habits tracked: ${habitsCount}
- Goals: ${goalsCount} total (${goalsCompleted} achieved)
- Total Focus session time: ${totalFocusTime} minutes
- Journal entries: ${journalCount}

Desired format:
1. Use rich markdown with relevant emojis
2. Start with a summary of general trends
3. Analyze strengths and areas for improvement
4. Suggest 3-5 specific recommendations based on the data
5. Conclude with an encouraging note

Your analysis should be personalized, positive, and action-oriented.`,

    es: `Eres DeepFlow, un asistente de IA especializado en análisis de productividad y bienestar. Analiza estos datos del usuario y crea un informe detallado con recomendaciones constructivas.

Datos del usuario:
- Tareas: ${tasks.length} en total (${completedTasks} completadas, ${pendingTasks} pendientes)
- Hábitos seguidos: ${habitsCount}
- Objetivos: ${goalsCount} en total (${goalsCompleted} alcanzados)
- Tiempo total en sesiones de enfoque: ${totalFocusTime} minutos
- Entradas de diario: ${journalCount}

Formato deseado:
1. Utiliza markdown enriquecido con emojis relevantes
2. Comienza con un resumen de tendencias generales
3. Analiza puntos fuertes y áreas de mejora
4. Sugiere 3-5 recomendaciones específicas basadas en los datos
5. Concluye con una nota alentadora

Tu análisis debe ser personalizado, positivo y orientado a la acción.`,

    de: `Du bist DeepFlow, ein KI-Assistent, der auf Produktivitäts- und Wohlbefindensanalyse spezialisiert ist. Analysiere diese Benutzerdaten und erstelle einen detaillierten Bericht mit konstruktiven Empfehlungen.

Benutzerdaten:
- Aufgaben: ${tasks.length} insgesamt (${completedTasks} abgeschlossen, ${pendingTasks} ausstehend)
- Verfolgte Gewohnheiten: ${habitsCount}
- Ziele: ${goalsCount} insgesamt (${goalsCompleted} erreicht)
- Gesamtzeit der Fokussitzungen: ${totalFocusTime} Minuten
- Journaleinträge: ${journalCount}

Gewünschtes Format:
1. Verwende umfangreiches Markdown mit relevanten Emojis
2. Beginne mit einer Zusammenfassung der allgemeinen Trends
3. Analysiere Stärken und Verbesserungsbereiche
4. Schlage 3-5 spezifische Empfehlungen basierend auf den Daten vor
5. Schließe mit einer ermutigenden Notiz ab

Deine Analyse sollte personalisiert, positiv und handlungsorientiert sein.`
  };

  return prompts[language] || prompts.fr;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get API key from environment variable
    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY is not set in environment variables");
    }

    // Get Supabase credentials from environment
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") || "";
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

    // Initialize the Google Generative AI
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    
    // Parse request body
    const { userId } = await req.json();
    
    if (!userId) {
      throw new Error("User ID is required");
    }

    // Initialize Supabase client with service role for admin access
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Get user's language preference
    const { data: userSettings } = await supabase
      .from('user_settings')
      .select('language')
      .eq('id', userId)
      .single();
      
    const userLanguage = userSettings?.language || "fr" as LanguageCode;

    // Fetch user data
    const [tasks, habits, goals, focusSessions, journalEntries] = await Promise.all([
      supabase.from('tasks').select('*').eq('user_id', userId),
      supabase.from('habits').select('*').eq('user_id', userId),
      supabase.from('goals').select('*').eq('user_id', userId),
      supabase.from('focus_sessions').select('*').eq('user_id', userId),
      supabase.from('journal_entries').select('*').eq('user_id', userId)
    ]);

    const userData = {
      tasks: tasks.data || [],
      habits: habits.data || [],
      goals: goals.data || [],
      focusSessions: focusSessions.data || [],
      journalEntries: journalEntries.data || []
    };

    // Prepare stats for the frontend
    const today = new Date();
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay());

    // Task completion by day of week
    const tasksPerDay = Array(7).fill(0).map((_, i) => {
      const day = new Date(weekStart);
      day.setDate(weekStart.getDate() + i);
      
      const dayString = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'][i];
      
      const completedToday = tasks.data ? tasks.data.filter((t: any) => {
        if (!t.completed) return false;
        const completedDate = new Date(t.updated_at);
        return completedDate.getDate() === day.getDate() && 
               completedDate.getMonth() === day.getMonth() &&
               completedDate.getFullYear() === day.getFullYear();
      }).length : 0;
      
      return { name: dayString, total: completedToday };
    });
    
    // Habits tracking by week
    const habitsPerWeek = [1, 2, 3, 4].map(weekNum => {
      const weekStart = new Date(today);
      weekStart.setDate(today.getDate() - today.getDay() - (7 * (4 - weekNum)));
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      
      const total = habits.data ? habits.data.filter((h: any) => {
        if (!h.last_completed_at) return false;
        const completedDate = new Date(h.last_completed_at);
        return completedDate >= weekStart && completedDate <= weekEnd;
      }).length : 0;
      
      return { name: `Semaine ${weekNum}`, total };
    });
    
    // Focus time by day
    const focusPerDay = Array(7).fill(0).map((_, i) => {
      const day = new Date(weekStart);
      day.setDate(weekStart.getDate() + i);
      
      const dayString = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'][i];
      
      const minutesToday = focusSessions.data ? focusSessions.data.filter((s: any) => {
        if (!s.completed_at) return false;
        const sessionDate = new Date(s.completed_at);
        return sessionDate.getDate() === day.getDate() && 
               sessionDate.getMonth() === day.getMonth() &&
               sessionDate.getFullYear() === day.getFullYear();
      }).reduce((sum: number, session: any) => sum + (session.duration || 0), 0) : 0;
      
      return { name: dayString, total: minutesToday };
    });
    
    const userStats = {
      tasksPerDay,
      habitsPerWeek,
      focusPerDay
    };
    
    // Generate analysis
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const prompt = getAnalysisPrompt(userData, userLanguage);
    const result = await model.generateContent(prompt);
    const analysis = result.response.text();

    return new Response(
      JSON.stringify({
        analysis,
        stats: userStats
      }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("Error generating analysis:", error);
    
    return new Response(
      JSON.stringify({
        error: error.message,
        analysis: "⚠️ **Une erreur est survenue**\n\nImpossible de générer l'analyse pour le moment. Veuillez réessayer plus tard.",
        stats: null
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});

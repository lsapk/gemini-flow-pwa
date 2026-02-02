import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface UserData {
  tasks: any[];
  habits: any[];
  goals: any[];
  journal_entries: any[];
  focus_sessions: any[];
  habit_completions: any[];
  quests: any[];
  player_profile: any;
}

interface AnalysisRequest {
  type: 'daily_briefing' | 'smart_prioritization' | 'cross_insights' | 'goal_prediction' | 'habit_dna' | 'flow_prediction' | 'mood_analysis';
  specific_data?: any;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Authenticate user via JWT
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      );
    }

    const supabaseAuth = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: claimsError } = await supabaseAuth.auth.getUser(token);
    
    if (claimsError || !claimsData?.user?.id) {
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      );
    }

    const userId = claimsData.user.id;
    const { type, specific_data }: AnalysisRequest = await req.json();

    console.log('AI Cross Analysis request:', { type, userId });

    // Create Supabase client with service role
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Fetch all user data in parallel
    const [
      tasksResult,
      habitsResult,
      goalsResult,
      journalResult,
      focusResult,
      habitCompletionsResult,
      questsResult,
      playerProfileResult
    ] = await Promise.all([
      supabase.from('tasks').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(100),
      supabase.from('habits').select('*').eq('user_id', userId),
      supabase.from('goals').select('*').eq('user_id', userId),
      supabase.from('journal_entries').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(30),
      supabase.from('focus_sessions').select('*').eq('user_id', userId).order('started_at', { ascending: false }).limit(100),
      supabase.from('habit_completions').select('*').eq('user_id', userId).order('completed_date', { ascending: false }).limit(365),
      supabase.from('quests').select('*').eq('user_id', userId).eq('completed', false),
      supabase.from('player_profiles').select('*').eq('user_id', userId).maybeSingle()
    ]);

    const userData: UserData = {
      tasks: tasksResult.data || [],
      habits: habitsResult.data || [],
      goals: goalsResult.data || [],
      journal_entries: journalResult.data || [],
      focus_sessions: focusResult.data || [],
      habit_completions: habitCompletionsResult.data || [],
      quests: questsResult.data || [],
      player_profile: playerProfileResult.data
    };

    // Get Lovable API key
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      return new Response(
        JSON.stringify({ error: 'AI service not configured' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    // Build prompt based on analysis type
    let systemPrompt = '';
    let userPrompt = '';

    const now = new Date();
    const currentHour = now.getHours();
    const dayOfWeek = now.toLocaleDateString('fr-FR', { weekday: 'long' });

    // Calculate key metrics
    const completedTasksToday = userData.tasks.filter(t => 
      t.completed && new Date(t.updated_at).toDateString() === now.toDateString()
    ).length;
    
    const pendingHighPriorityTasks = userData.tasks.filter(t => 
      !t.completed && t.priority === 'high'
    );
    
    const recentMoods = userData.journal_entries
      .slice(0, 5)
      .map(j => j.mood)
      .filter(Boolean);
    
    const avgFocusDuration = userData.focus_sessions.length > 0
      ? Math.round(userData.focus_sessions.reduce((sum, f) => sum + (f.duration || 0), 0) / userData.focus_sessions.length)
      : 0;

    // Analyze chronobiology patterns
    const hourlyActivity: Record<number, number> = {};
    userData.tasks.filter(t => t.completed).forEach(t => {
      const hour = new Date(t.updated_at).getHours();
      hourlyActivity[hour] = (hourlyActivity[hour] || 0) + 1;
    });
    
    const peakHours = Object.entries(hourlyActivity)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([hour]) => parseInt(hour));

    const productivityType = peakHours[0] < 12 ? 'lève-tôt' : peakHours[0] < 17 ? 'après-midi' : 'oiseau de nuit';

    switch (type) {
      case 'daily_briefing':
        systemPrompt = `Tu es un coach IA personnel ultra-motivant et perspicace pour DeepFlow.
Tu dois générer un briefing matinal PERSONNALISÉ qui croise toutes les données de l'utilisateur.

RÈGLES:
- Sois dynamique, motivant et précis
- Utilise les données réelles pour personnaliser
- Mentionne des chiffres concrets
- Donne 3-4 actions prioritaires claires
- Adapte le ton selon l'humeur récente
- Maximum 200 mots

FORMAT JSON OBLIGATOIRE:
{
  "greeting": "salutation personnalisée selon l'heure",
  "productivity_type": "type de productivité détecté",
  "mood_insight": "insight sur l'humeur récente",
  "priority_tasks": ["tâche 1", "tâche 2", "tâche 3"],
  "active_quest": { "title": "nom de quête", "progress": "X/Y", "message": "encouragement" },
  "daily_tip": "conseil personnalisé du jour",
  "motivation_message": "message de motivation final"
}`;

        userPrompt = `Génère le briefing matinal pour cet utilisateur.

CONTEXTE ACTUEL:
- Heure: ${currentHour}h (${dayOfWeek})
- Type de productivité: ${productivityType}
- Heures de pic: ${peakHours.join('h, ')}h

DONNÉES UTILISATEUR:
- Tâches en attente haute priorité: ${pendingHighPriorityTasks.length} (${pendingHighPriorityTasks.slice(0, 3).map(t => t.title).join(', ')})
- Tâches complétées aujourd'hui: ${completedTasksToday}
- Humeurs récentes: ${recentMoods.join(', ') || 'non renseigné'}
- Durée moyenne de focus: ${avgFocusDuration} minutes
- Habitudes actives: ${userData.habits.length}
- Quêtes actives: ${userData.quests.map(q => `${q.title} (${q.current_progress}/${q.target_value})`).join(', ') || 'aucune'}
- Niveau joueur: ${userData.player_profile?.level || 1}
- XP: ${userData.player_profile?.experience_points || 0}

Génère un briefing JSON ultra-personnalisé.`;
        break;

      case 'smart_prioritization':
        systemPrompt = `Tu es un expert en productivité et gestion du temps pour DeepFlow.
Analyse les tâches et suggère un ordre optimal basé sur:
- Chronobiologie de l'utilisateur (quand il est le plus productif)
- Énergie actuelle (déduite de l'humeur du journal)
- Impact sur les objectifs
- Deadlines
- Complexité vs énergie disponible

FORMAT JSON OBLIGATOIRE:
{
  "optimized_order": [
    {
      "task_id": "id",
      "title": "titre",
      "suggested_time": "HH:MM",
      "reason": "pourquoi maintenant",
      "energy_match": "high|medium|low"
    }
  ],
  "blocked_slots": ["description des créneaux à protéger"],
  "productivity_prediction": "prédiction de productivité si l'ordre est suivi"
}`;

        userPrompt = `Optimise l'ordre des tâches pour aujourd'hui.

CHRONOBIOLOGIE:
- Type: ${productivityType}
- Heures de pic: ${peakHours.join('h, ')}h
- Heure actuelle: ${currentHour}h

HUMEUR RÉCENTE: ${recentMoods[0] || 'neutre'}

TÂCHES À PRIORISER:
${userData.tasks.filter(t => !t.completed).slice(0, 10).map(t => 
  `- [${t.priority}] ${t.title} (deadline: ${t.due_date || 'aucune'})`
).join('\n')}

OBJECTIFS EN COURS:
${userData.goals.filter(g => !g.completed).map(g => 
  `- ${g.title} (${g.progress}%)`
).join('\n')}`;
        break;

      case 'cross_insights':
        systemPrompt = `Tu es un analyste de données comportementales expert pour DeepFlow.
Génère des insights croisés en analysant TOUTES les corrélations entre:
- Habitudes et productivité
- Humeur et performance
- Sessions focus et complétion de tâches
- Patterns temporels

Types d'insights à générer:
1. CORRÉLATION: "Quand X, alors Y"
2. PATTERN: "Tu tends à faire X"
3. PRÉDICTION: "Risque de X dans Y jours"
4. OPPORTUNITÉ: "Tu n'as jamais essayé X"

FORMAT JSON OBLIGATOIRE:
{
  "insights": [
    {
      "type": "correlation|pattern|prediction|opportunity",
      "icon": "emoji approprié",
      "title": "titre court",
      "description": "description détaillée avec chiffres",
      "priority": "high|medium|low",
      "action": "action suggérée"
    }
  ],
  "summary": "résumé global en une phrase"
}`;

        userPrompt = `Analyse croisée complète des données utilisateur.

HABITUDES (${userData.habits.length}):
${userData.habits.map(h => 
  `- ${h.title} (streak: ${h.streak || 0}, catégorie: ${h.category})`
).join('\n')}

COMPLÉTION DES HABITUDES (30 derniers jours):
${Object.entries(
  userData.habit_completions.reduce((acc, hc) => {
    const date = hc.completed_date;
    acc[date] = (acc[date] || 0) + 1;
    return acc;
  }, {} as Record<string, number>)
).slice(0, 10).map(([date, count]) => `${date}: ${count} habitudes`).join('\n')}

JOURNAL (5 dernières entrées):
${userData.journal_entries.slice(0, 5).map(j => 
  `- ${new Date(j.created_at).toLocaleDateString('fr-FR')}: humeur "${j.mood || 'non spécifiée'}"`
).join('\n')}

FOCUS SESSIONS:
- Total: ${userData.focus_sessions.length} sessions
- Durée moyenne: ${avgFocusDuration} min
- Sessions longues (>45min): ${userData.focus_sessions.filter(f => f.duration > 45).length}

TÂCHES:
- Complétées: ${userData.tasks.filter(t => t.completed).length}
- En attente: ${userData.tasks.filter(t => !t.completed).length}
- High priority complétées: ${userData.tasks.filter(t => t.completed && t.priority === 'high').length}

CHRONOBIOLOGIE:
${Object.entries(hourlyActivity).sort(([a], [b]) => parseInt(a) - parseInt(b)).map(([h, c]) => `${h}h: ${c} tâches`).join(', ')}

Génère 4-6 insights croisés pertinents et actionnables.`;
        break;

      case 'goal_prediction':
        systemPrompt = `Tu es un expert en prédiction de succès d'objectifs pour DeepFlow.
Calcule la probabilité de succès de chaque objectif basée sur:
- Progression actuelle vs temps restant
- Vélocité récente
- Consistance des habitudes liées
- Patterns historiques

FORMAT JSON OBLIGATOIRE:
{
  "predictions": [
    {
      "goal_id": "id",
      "title": "titre",
      "current_progress": 0,
      "success_probability": 0,
      "velocity": "accelerating|stable|slowing",
      "risk_level": "low|medium|high|critical",
      "insight": "analyse personnalisée",
      "recommendation": "action pour améliorer les chances"
    }
  ]
}`;

        userPrompt = `Prédis le succès des objectifs.

OBJECTIFS:
${userData.goals.filter(g => !g.completed).map(g => {
  const daysLeft = g.target_date ? Math.ceil((new Date(g.target_date).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) : null;
  return `- ${g.title}: ${g.progress}% (${daysLeft !== null ? `${daysLeft} jours restants` : 'pas de deadline'}, catégorie: ${g.category})`;
}).join('\n')}

VÉLOCITÉ DES TÂCHES (7 derniers jours):
${(() => {
  const last7Days = userData.tasks.filter(t => {
    const taskDate = new Date(t.updated_at);
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    return t.completed && taskDate > weekAgo;
  }).length;
  return `${last7Days} tâches complétées`;
})()}

HABITUDES LIÉES:
${userData.habits.map(h => `- ${h.title} (streak: ${h.streak || 0})`).join('\n')}`;
        break;

      case 'habit_dna':
        systemPrompt = `Tu es un analyste de comportements pour DeepFlow.
Génère un profil "ADN d'habitudes" unique montrant:
- Forces par catégorie
- Habitudes "fondation" (qui déclenchent d'autres comportements)
- Points faibles à développer
- Patterns de complétion

FORMAT JSON OBLIGATOIRE:
{
  "dna_profile": {
    "dominant_trait": "trait principal",
    "categories": [
      {
        "name": "nom catégorie",
        "icon": "emoji",
        "score": 0-100,
        "status": "foundation|growing|developing|weak",
        "habits_count": 0
      }
    ],
    "foundation_habit": {
      "name": "nom de l'habitude fondation",
      "impact": "description de son impact"
    },
    "weak_spot": {
      "category": "catégorie faible",
      "suggestion": "suggestion d'amélioration"
    },
    "insight": "insight principal personnalisé"
  }
}`;

        userPrompt = `Génère le profil ADN d'habitudes.

HABITUDES:
${userData.habits.map(h => 
  `- ${h.title} (catégorie: ${h.category || 'autre'}, streak: ${h.streak || 0}, fréquence: ${h.frequency})`
).join('\n')}

COMPLÉTION PAR HABITUDE:
${(() => {
  const completionByHabit: Record<string, number> = {};
  userData.habit_completions.forEach(hc => {
    completionByHabit[hc.habit_id] = (completionByHabit[hc.habit_id] || 0) + 1;
  });
  return userData.habits.map(h => 
    `- ${h.title}: ${completionByHabit[h.id] || 0} completions`
  ).join('\n');
})()}

CORRÉLATIONS AVEC FOCUS:
- Sessions focus après habitudes: ${userData.focus_sessions.length} sessions totales
- Durée moyenne: ${avgFocusDuration} min`;
        break;

      case 'flow_prediction':
        systemPrompt = `Tu es un expert en états de flow et productivité optimale pour DeepFlow.
Prédit les fenêtres de flow basées sur:
- Historique des sessions focus longues (>45min)
- Conditions: heure, jour, humeur avant la session
- Patterns récurrents

FORMAT JSON OBLIGATOIRE:
{
  "flow_prediction": {
    "probability": 0-100,
    "optimal_window": {
      "start": "HH:MM",
      "end": "HH:MM",
      "day": "jour de la semaine"
    },
    "conditions": ["condition favorable 1", "condition 2"],
    "suggested_task": "type de tâche idéale",
    "insight": "explication personnalisée",
    "tips": ["conseil 1", "conseil 2"]
  }
}`;

        userPrompt = `Prédit les fenêtres de flow pour aujourd'hui.

SESSIONS FOCUS HISTORIQUES:
${userData.focus_sessions.slice(0, 20).map(f => {
  const startHour = f.started_at ? new Date(f.started_at).getHours() : 0;
  const day = f.started_at ? new Date(f.started_at).toLocaleDateString('fr-FR', { weekday: 'short' }) : 'N/A';
  return `- ${day} ${startHour}h: ${f.duration} min`;
}).join('\n')}

SESSIONS LONGUES (>45min):
${userData.focus_sessions.filter(f => f.duration > 45).slice(0, 10).map(f => {
  const startHour = f.started_at ? new Date(f.started_at).getHours() : 0;
  return `- ${startHour}h: ${f.duration} min`;
}).join('\n')}

CHRONOBIOLOGIE:
- Type: ${productivityType}
- Pic de productivité: ${peakHours[0]}h

HUMEUR RÉCENTE: ${recentMoods[0] || 'neutre'}
JOUR ACTUEL: ${dayOfWeek}
HEURE ACTUELLE: ${currentHour}h`;
        break;

      case 'mood_analysis':
        systemPrompt = `Tu es un analyste de corrélation humeur-productivité pour DeepFlow.
Analyse les liens entre l'humeur et la productivité pour générer des insights actionnables.

FORMAT JSON OBLIGATOIRE:
{
  "mood_analysis": {
    "current_trend": "improving|stable|declining",
    "best_mood_for_productivity": "humeur la plus productive",
    "correlations": [
      {
        "observation": "description de la corrélation",
        "percentage": "X%",
        "actionable_insight": "conseil basé sur cette corrélation"
      }
    ],
    "recommendations": ["recommandation 1", "recommandation 2"],
    "weekly_pattern": {
      "best_day": "jour le plus productif",
      "challenging_day": "jour le plus difficile"
    }
  }
}`;

        userPrompt = `Analyse la corrélation humeur-productivité.

JOURNAL (30 derniers jours):
${userData.journal_entries.map(j => {
  const date = new Date(j.created_at);
  const tasksCompletedThatDay = userData.tasks.filter(t => 
    t.completed && new Date(t.updated_at).toDateString() === date.toDateString()
  ).length;
  return `- ${date.toLocaleDateString('fr-FR')}: humeur "${j.mood || 'N/A'}", ${tasksCompletedThatDay} tâches complétées`;
}).join('\n')}

DISTRIBUTION DES HUMEURS:
${(() => {
  const moodCounts: Record<string, number> = {};
  userData.journal_entries.forEach(j => {
    if (j.mood) moodCounts[j.mood] = (moodCounts[j.mood] || 0) + 1;
  });
  return Object.entries(moodCounts).map(([mood, count]) => `${mood}: ${count}`).join(', ');
})()}

PRODUCTIVITÉ PAR JOUR:
${(() => {
  const dayProductivity: Record<string, number[]> = {};
  userData.tasks.filter(t => t.completed).forEach(t => {
    const day = new Date(t.updated_at).toLocaleDateString('fr-FR', { weekday: 'long' });
    if (!dayProductivity[day]) dayProductivity[day] = [];
    dayProductivity[day].push(1);
  });
  return Object.entries(dayProductivity).map(([day, tasks]) => 
    `${day}: ${tasks.length} tâches`
  ).join(', ');
})()}`;
        break;

      default:
        return new Response(
          JSON.stringify({ error: 'Invalid analysis type' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        );
    }

    // Call Lovable AI Gateway
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-3-flash-preview',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 429 }
        );
      }
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: 'AI credits exhausted. Please add credits.' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 402 }
        );
      }
      throw new Error('AI gateway error');
    }

    const aiData = await aiResponse.json();
    let responseText = aiData.choices?.[0]?.message?.content || '';

    // Parse JSON response
    let parsedResult;
    try {
      // Try to extract JSON from the response
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsedResult = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found');
      }
    } catch (e) {
      console.error('Failed to parse AI response:', e);
      parsedResult = { raw_response: responseText, error: 'Failed to parse response' };
    }

    // Log the AI request
    await supabase.from('ai_requests').insert({
      user_id: userId,
      service: 'ai-cross-analysis'
    });

    console.log('AI Cross Analysis completed:', { type, resultKeys: Object.keys(parsedResult) });

    return new Response(
      JSON.stringify({ 
        type,
        result: parsedResult,
        generated_at: new Date().toISOString()
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in ai-cross-analysis:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});

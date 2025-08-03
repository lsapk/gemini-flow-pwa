import { createClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI } from "@google/generative-ai";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { message, user_id, context } = await req.json();

    if (!user_id) {
      return new Response(
        JSON.stringify({ error: 'User ID is required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Helper functions for data operations
    const createTask = async (title: string, description?: string, priority?: string, due_date?: string) => {
      const { data, error } = await supabaseClient
        .from('tasks')
        .insert({
          title,
          description: description || null,
          priority: priority || 'medium',
          due_date: due_date || null,
          user_id,
          completed: false
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    };

    const createHabit = async (title: string, description?: string, frequency?: string, target?: number) => {
      const { data, error } = await supabaseClient
        .from('habits')
        .insert({
          title,
          description: description || null,
          frequency: frequency || 'daily',
          target: target || 1,
          user_id,
          streak: 0
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    };

    const createGoal = async (title: string, description?: string, category?: string, target_date?: string) => {
      const { data, error } = await supabaseClient
        .from('goals')
        .insert({
          title,
          description: description || null,
          category: category || null,
          target_date: target_date || null,
          user_id,
          completed: false,
          progress: 0
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    };

    const createJournalEntry = async (title: string, content: string, mood?: string, tags?: string[]) => {
      const { data, error } = await supabaseClient
        .from('journal_entries')
        .insert({
          title,
          content,
          mood: mood || null,
          tags: tags || null,
          user_id
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    };

    const createFocusSession = async (title: string, duration: number) => {
      const { data, error } = await supabaseClient
        .from('focus_sessions')
        .insert({
          title: title || 'Session de focus',
          duration,
          user_id,
          started_at: new Date().toISOString()
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    };

    // Enhanced system prompt
    const systemPrompt = `Tu es un assistant IA personnel spécialisé dans la productivité et le développement personnel pour l'application DeepFlow. Tu peux maintenant créer et modifier des données directement.

    FONCTIONNALITÉS DISPONIBLES:
    - Créer des tâches, habitudes, objectifs, entrées de journal
    - Analyser les données utilisateur pour des conseils personnalisés
    - Proposer des améliorations basées sur les patterns comportementaux
    
    INSTRUCTIONS IMPORTANTES:
    - Utilise le contexte de conversation pour des réponses personnalisées
    - Ne répète jamais "Bonjour" si c'est un message de suivi dans la conversation
    - Sois proactif : propose de créer des éléments quand c'est pertinent
    - Donne des conseils concrets et actionables
    - Utilise les données utilisateur pour personnaliser tes réponses
    
    ACTIONS POSSIBLES:
    Quand l'utilisateur demande de créer quelque chose, tu peux utiliser ces fonctions:
    - createTask(title, description?, priority?, due_date?)
    - createHabit(title, description?, frequency?, target?)
    - createGoal(title, description?, category?, target_date?)
    - createJournalEntry(title, content, mood?, tags?)
    - createFocusSession(title?, duration)
    
    DONNÉES UTILISATEUR: ${JSON.stringify(context?.user_data || {})}
    MESSAGES RÉCENTS: ${JSON.stringify(context?.recent_messages || [])}
    
    Réponds de manière conversationnelle et utile, en utilisant les données disponibles.`;

    // Initialize Gemini
    const genAI = new GoogleGenerativeAI(Deno.env.get('GEMINI_API_KEY') || '');
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    // Check if the message is asking to create something
    const isCreateRequest = /créer|ajouter|faire|nouveau|nouvelle|commencer/i.test(message);
    let actionTaken = null;

    // Try to detect and execute actions
    if (isCreateRequest) {
      const lowerMessage = message.toLowerCase();
      
      if (lowerMessage.includes('tâche') || lowerMessage.includes('task')) {
        const taskMatch = message.match(/(?:tâche|task).*?"([^"]+)"|(?:tâche|task)\s+(.+?)(?:\s+(?:avec|pour|de)|$)/i);
        if (taskMatch) {
          const title = taskMatch[1] || taskMatch[2];
          try {
            actionTaken = await createTask(title.trim());
          } catch (error) {
            console.error('Error creating task:', error);
          }
        }
      } else if (lowerMessage.includes('habitude') || lowerMessage.includes('habit')) {
        const habitMatch = message.match(/(?:habitude|habit).*?"([^"]+)"|(?:habitude|habit)\s+(.+?)(?:\s+(?:avec|pour|de)|$)/i);
        if (habitMatch) {
          const title = habitMatch[1] || habitMatch[2];
          try {
            actionTaken = await createHabit(title.trim());
          } catch (error) {
            console.error('Error creating habit:', error);
          }
        }
      } else if (lowerMessage.includes('objectif') || lowerMessage.includes('goal')) {
        const goalMatch = message.match(/(?:objectif|goal).*?"([^"]+)"|(?:objectif|goal)\s+(.+?)(?:\s+(?:avec|pour|de)|$)/i);
        if (goalMatch) {
          const title = goalMatch[1] || goalMatch[2];
          try {
            actionTaken = await createGoal(title.trim());
          } catch (error) {
            console.error('Error creating goal:', error);
          }
        }
      } else if (lowerMessage.includes('journal') || lowerMessage.includes('note')) {
        const journalMatch = message.match(/(?:journal|note).*?"([^"]+)"|(?:journal|note)\s+(.+)/i);
        if (journalMatch) {
          const content = journalMatch[1] || journalMatch[2];
          try {
            actionTaken = await createJournalEntry('Entrée créée par IA', content.trim());
          } catch (error) {
            console.error('Error creating journal entry:', error);
          }
        }
      }
    }

    // Generate AI response
    const enhancedMessage = actionTaken 
      ? `${message}\n\nACTION EFFECTUÉE: J'ai créé ${actionTaken.title || 'un élément'} pour toi.`
      : message;

    const result = await model.generateContent([
      systemPrompt,
      `Message utilisateur: ${enhancedMessage}`
    ]);

    const response = result.response;
    const responseText = response.text();

    // Log AI request
    await supabaseClient.from('ai_requests').insert({
      user_id,
      service: 'gemini-chat-enhanced'
    });

    return new Response(
      JSON.stringify({ 
        response: responseText,
        action: actionTaken ? `Créé: ${actionTaken.title || 'élément'}` : null
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in gemini-chat-enhanced:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});

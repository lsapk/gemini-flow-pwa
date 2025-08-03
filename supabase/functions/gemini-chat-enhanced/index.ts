
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { GoogleGenerativeAI } from 'https://esm.sh/@google/generative-ai';

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

    // Enhanced system prompt with better action detection
    const systemPrompt = `Tu es un assistant IA personnel spécialisé dans la productivité et le développement personnel pour l'application DeepFlow. Tu peux créer et modifier des données directement SEULEMENT quand l'utilisateur le demande EXPLICITEMENT.

    RÈGLES IMPORTANTES POUR LES ACTIONS:
    - Ne crée JAMAIS d'éléments automatiquement sans demande explicite
    - L'utilisateur doit utiliser des mots comme "créer", "ajouter", "faire", "nouveau" pour que tu puisses créer quelque chose
    - Si l'utilisateur pose juste une question ou demande des conseils, ne crée RIEN
    - Demande toujours confirmation avant de créer quelque chose d'important
    
    FONCTIONNALITÉS DISPONIBLES:
    - Créer des tâches, habitudes, objectifs, entrées de journal (SEULEMENT sur demande explicite)
    - Analyser les données utilisateur pour des conseils personnalisés
    - Proposer des améliorations basées sur les patterns comportementaux
    
    INSTRUCTIONS:
    - Utilise le contexte de conversation pour des réponses personnalisées
    - Ne répète jamais "Bonjour" si c'est un message de suivi dans la conversation
    - Donne des conseils concrets et actionables
    - Utilise les données utilisateur pour personnaliser tes réponses
    - Sois conversationnel et utile
    
    DONNÉES UTILISATEUR: ${JSON.stringify(context?.user_data || {})}
    MESSAGES RÉCENTS: ${JSON.stringify(context?.recent_messages || [])}
    
    Réponds de manière conversationnelle et utile, en utilisant les données disponibles.`;

    // Initialize Gemini with updated model
    const genAI = new GoogleGenerativeAI(Deno.env.get('GEMINI_API_KEY') || '');
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // More strict action detection - only create when explicitly asked
    const isExplicitCreateRequest = /(?:créer|ajouter|faire|nouveau|nouvelle)\s+(?:une?\s+)?(?:tâche|habitude|objectif|goal|task|habit)/i.test(message) ||
                                   /(?:peux-tu|pourrais-tu|veux-tu|créé)\s+(?:créer|ajouter|faire)/i.test(message);
    
    let actionTaken = null;

    // Only try to create if it's an explicit request
    if (isExplicitCreateRequest) {
      const lowerMessage = message.toLowerCase();
      
      if ((lowerMessage.includes('tâche') || lowerMessage.includes('task')) && 
          (lowerMessage.includes('créer') || lowerMessage.includes('ajouter') || lowerMessage.includes('nouveau'))) {
        const taskMatch = message.match(/(?:tâche|task).*?"([^"]+)"|(?:créer|ajouter|nouveau).*?(?:tâche|task).*?([^.!?]+)/i);
        if (taskMatch) {
          const title = (taskMatch[1] || taskMatch[2]).trim();
          if (title.length > 2) {
            try {
              actionTaken = await createTask(title);
            } catch (error) {
              console.error('Error creating task:', error);
            }
          }
        }
      } else if ((lowerMessage.includes('habitude') || lowerMessage.includes('habit')) && 
                 (lowerMessage.includes('créer') || lowerMessage.includes('ajouter') || lowerMessage.includes('nouveau'))) {
        const habitMatch = message.match(/(?:habitude|habit).*?"([^"]+)"|(?:créer|ajouter|nouveau).*?(?:habitude|habit).*?([^.!?]+)/i);
        if (habitMatch) {
          const title = (habitMatch[1] || habitMatch[2]).trim();
          if (title.length > 2) {
            try {
              actionTaken = await createHabit(title);
            } catch (error) {
              console.error('Error creating habit:', error);
            }
          }
        }
      } else if ((lowerMessage.includes('objectif') || lowerMessage.includes('goal')) && 
                 (lowerMessage.includes('créer') || lowerMessage.includes('ajouter') || lowerMessage.includes('nouveau'))) {
        const goalMatch = message.match(/(?:objectif|goal).*?"([^"]+)"|(?:créer|ajouter|nouveau).*?(?:objectif|goal).*?([^.!?]+)/i);
        if (goalMatch) {
          const title = (goalMatch[1] || goalMatch[2]).trim();
          if (title.length > 2) {
            try {
              actionTaken = await createGoal(title);
            } catch (error) {
              console.error('Error creating goal:', error);
            }
          }
        }
      }
    }

    // Generate AI response
    const enhancedMessage = actionTaken 
      ? `${message}\n\nACTION EFFECTUÉE: J'ai créé "${actionTaken.title}" pour toi.`
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
        action: actionTaken ? `Créé: ${actionTaken.title}` : null
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

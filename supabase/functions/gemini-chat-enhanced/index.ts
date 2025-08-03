
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

    // Enhanced system prompt avec règles strictes
    const systemPrompt = `Tu es un assistant IA spécialisé dans la productivité pour l'application DeepFlow. 

    RÈGLES CRITIQUES POUR LES ACTIONS:
    - Tu ne crées JAMAIS d'éléments automatiquement
    - Tu ne crées quelque chose QUE si l'utilisateur dit explicitement "créer", "ajouter", "faire" suivi du type d'élément
    - Exemples valides: "créer une tâche", "ajouter une habitude", "faire un objectif"
    - Si l'utilisateur pose juste une question ou demande des conseils, tu réponds SANS créer quoi que ce soit
    - Si tu n'es pas sûr, demande confirmation avant de créer
    
    DONNÉES UTILISATEUR: ${JSON.stringify(context?.user_data || {})}
    
    Réponds de manière conversationnelle et utile, en utilisant les données disponibles.`;

    // Initialize Gemini with the correct model
    const genAI = new GoogleGenerativeAI(Deno.env.get('GEMINI_API_KEY') || '');
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // Très strict action detection - seulement créer quand explicitement demandé
    const lowerMessage = message.toLowerCase();
    const isExplicitCreateRequest = (
      (lowerMessage.includes('créer') || lowerMessage.includes('ajouter') || lowerMessage.includes('faire')) &&
      (lowerMessage.includes('tâche') || lowerMessage.includes('habitude') || lowerMessage.includes('objectif') || 
       lowerMessage.includes('task') || lowerMessage.includes('habit') || lowerMessage.includes('goal'))
    );
    
    let actionTaken = null;

    // Only try to create if it's an explicit and clear request
    if (isExplicitCreateRequest) {
      console.log('Explicit create request detected:', message);
      
      if ((lowerMessage.includes('tâche') || lowerMessage.includes('task')) && 
          (lowerMessage.includes('créer') || lowerMessage.includes('ajouter') || lowerMessage.includes('faire'))) {
        // Extract title from quotes or after keywords
        const taskMatch = message.match(/"([^"]+)"/) || 
                          message.match(/(?:tâche|task)[\s:]*([^.!?]+)/i);
        if (taskMatch && taskMatch[1]) {
          const title = taskMatch[1].trim();
          if (title.length > 2 && !title.includes('[{')) { // Avoid malformed titles
            try {
              actionTaken = await createTask(title);
              console.log('Task created:', actionTaken);
            } catch (error) {
              console.error('Error creating task:', error);
            }
          }
        }
      } else if ((lowerMessage.includes('habitude') || lowerMessage.includes('habit')) && 
                 (lowerMessage.includes('créer') || lowerMessage.includes('ajouter') || lowerMessage.includes('faire'))) {
        const habitMatch = message.match(/"([^"]+)"/) || 
                           message.match(/(?:habitude|habit)[\s:]*([^.!?]+)/i);
        if (habitMatch && habitMatch[1]) {
          const title = habitMatch[1].trim();
          if (title.length > 2 && !title.includes('[{')) {
            try {
              actionTaken = await createHabit(title);
              console.log('Habit created:', actionTaken);
            } catch (error) {
              console.error('Error creating habit:', error);
            }
          }
        }
      } else if ((lowerMessage.includes('objectif') || lowerMessage.includes('goal')) && 
                 (lowerMessage.includes('créer') || lowerMessage.includes('ajouter') || lowerMessage.includes('faire'))) {
        const goalMatch = message.match(/"([^"]+)"/) || 
                          message.match(/(?:objectif|goal)[\s:]*([^.!?]+)/i);
        if (goalMatch && goalMatch[1]) {
          const title = goalMatch[1].trim();
          if (title.length > 2 && !title.includes('[{')) {
            try {
              actionTaken = await createGoal(title);
              console.log('Goal created:', actionTaken);
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

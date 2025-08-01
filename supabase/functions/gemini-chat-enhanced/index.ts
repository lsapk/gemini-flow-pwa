
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.2?target=deno";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function executeAction(action: any, user_id: string, supabase: any) {
  console.log("Executing action:", action);
  let actionResult = null;
  
  switch (action.type) {
    case 'create_task':
      if (!action.data.title || action.data.title.trim() === '') {
        throw new Error('Le titre de la tâche est requis');
      }
      
      const { data: taskData, error: taskError } = await supabase
        .from('tasks')
        .insert({
          user_id: user_id,
          title: action.data.title.trim(),
          description: action.data.description || null,
          priority: ['high', 'medium', 'low'].includes(action.data.priority) ? action.data.priority : 'medium',
          due_date: action.data.due_date || null,
          completed: false
        })
        .select()
        .single();
      
      if (taskError) throw taskError;
      actionResult = { type: 'task_created', data: taskData };
      break;
      
    case 'create_habit':
      if (!action.data.title || action.data.title.trim() === '') {
        throw new Error('Le titre de l\'habitude est requis');
      }
      
      const { data: habitData, error: habitError } = await supabase
        .from('habits')
        .insert({
          user_id: user_id,
          title: action.data.title.trim(),
          description: action.data.description || null,
          frequency: ['daily', 'weekly', 'monthly'].includes(action.data.frequency) ? action.data.frequency : 'daily',
          category: ['health', 'productivity', 'personal'].includes(action.data.category) ? action.data.category : null,
          target: Math.max(1, parseInt(action.data.target) || 1),
          streak: 0
        })
        .select()
        .single();
      
      if (habitError) throw habitError;
      actionResult = { type: 'habit_created', data: habitData };
      break;
      
    case 'create_goal':
      if (!action.data.title || action.data.title.trim() === '') {
        throw new Error('Le titre de l\'objectif est requis');
      }
      
      const { data: goalData, error: goalError } = await supabase
        .from('goals')
        .insert({
          user_id: user_id,
          title: action.data.title.trim(),
          description: action.data.description || null,
          category: ['personal', 'professional', 'health', 'finance'].includes(action.data.category) ? action.data.category : 'personal',
          target_date: action.data.target_date || null,
          progress: 0,
          completed: false
        })
        .select()
        .single();
      
      if (goalError) throw goalError;
      actionResult = { type: 'goal_created', data: goalData };
      break;
      
    case 'create_journal':
      if (!action.data.title || action.data.title.trim() === '') {
        throw new Error('Le titre de l\'entrée de journal est requis');
      }
      if (!action.data.content || action.data.content.trim() === '') {
        throw new Error('Le contenu de l\'entrée de journal est requis');
      }
      
      const { data: journalData, error: journalError } = await supabase
        .from('journal_entries')
        .insert({
          user_id: user_id,
          title: action.data.title.trim(),
          content: action.data.content.trim(),
          mood: ['excellent', 'tres-heureux', 'heureux', 'bien', 'motive', 'optimiste', 'reconnaissant', 'calme', 'neutre', 'fatigue', 'stresse', 'anxieux', 'inquiet', 'triste', 'decu', 'frustre', 'en-colere', 'confus', 'surpris', 'excite'].includes(action.data.mood) ? action.data.mood : null,
          tags: Array.isArray(action.data.tags) ? action.data.tags : null
        })
        .select()
        .single();
      
      if (journalError) throw journalError;
      actionResult = { type: 'journal_created', data: journalData };
      break;
  }
  
  if (!actionResult) {
    throw new Error(`Action non reconnue: ${action.type}`);
  }

  return actionResult;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, context, user_id, action } = await req.json();
    
    console.log("Received request:", { message, user_id, action, contextKeys: Object.keys(context || {}) });
    
    if (!message && !action) {
      throw new Error('Message or action is required');
    }
    
    if (!user_id) {
      throw new Error('User ID is required');
    }
    
    const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!geminiApiKey) {
      console.error('GEMINI_API_KEY not found');
      return new Response(JSON.stringify({ 
        response: "Configuration manquante. L'API Gemini n'est pas configurée.",
        error: true 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(supabaseUrl!, supabaseServiceKey!);

    // Si une action est passée directement, on l'exécute
    if (action && action.type) {
      try {
        const actionResult = await executeAction(action, user_id, supabase);
        console.log("Action executed successfully:", actionResult);
        return new Response(JSON.stringify({ 
          response: `✅ ${actionResult.type === 'task_created' ? 'Tâche' : 
                    actionResult.type === 'habit_created' ? 'Habitude' : 
                    actionResult.type === 'goal_created' ? 'Objectif' : 'Entrée de journal'} créé(e) avec succès ! 🎉`,
          action_result: actionResult
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      } catch (error) {
        console.error('Error executing action:', error);
        return new Response(JSON.stringify({ 
          response: `❌ Erreur lors de la création : ${error.message}`,
          error: true 
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    // Préparer le contexte de conversation
    const conversationContext = context?.recent_messages?.length > 0 ? 
      `HISTORIQUE RÉCENT:\n${context.recent_messages.map(msg => `${msg.role}: ${msg.content}`).slice(-5).join('\n')}\n\n` : 
      '';

    const systemPrompt = `Tu es DeepFlow AI, un assistant IA personnel spécialisé dans le développement personnel et la productivité. 
Tu parles TOUJOURS en français et tu utilises des emojis appropriés (1 à 3 par réponse) 😊.

${conversationContext}

DONNÉES UTILISATEUR ACTUELLES:
${context?.user_data ? JSON.stringify(context.user_data, null, 2) : 'Aucune donnée disponible'}

IMPORTANT - RÈGLES DE CRÉATION:
- Quand l'utilisateur demande de créer quelque chose, tu PROPOSES directement la création avec les détails
- Tu NE demandes PAS de confirmation à chaque fois
- Tu es proactif et efficace
- Tu te souviens de la conversation précédente

CAPACITÉS:
- Analyser les données de productivité de l'utilisateur en détail 📊
- Créer directement des tâches, habitudes, objectifs, entrées de journal ✨
- Donner des conseils personnalisés basés sur les vraies données 💡
- Fournir des statistiques précises et des analyses approfondies 📈
- Proposer des améliorations concrètes et réalisables 🚀

INSTRUCTIONS:
- Réponds TOUJOURS en français et avec des emojis adaptés 😊
- Sois encourageant, constructif et empathique 💪
- Sois direct et efficace dans tes réponses
- Utilise un ton amical et professionnel 🤝
- Souviens-toi du contexte de la conversation
`;

    console.log("Calling Gemini API...");
    
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: `${systemPrompt}\n\nUtilisateur: ${message}` }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 1000,
          topP: 0.8,
          topK: 40
        }
      }),
    });

    if (!response.ok) {
      console.error('Gemini API error:', response.status, response.statusText);
      const errorText = await response.text();
      console.error('Error details:', errorText);
      
      return new Response(JSON.stringify({ 
        response: "Je rencontre actuellement des difficultés techniques. Veuillez réessayer dans quelques instants. 😅",
        error: true,
        details: `API Error: ${response.status}`
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const data = await response.json();
    console.log("Gemini response received:", JSON.stringify(data, null, 2));

    let responseText = data.candidates?.[0]?.content?.parts?.[0]?.text || "Désolé, je n'ai pas pu traiter votre demande. Veuillez réessayer. 😅";
    console.log("Final AI response:", responseText);

    return new Response(JSON.stringify({ response: responseText }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in gemini-chat-enhanced function:', error);
    
    let errorMessage = 'Une erreur inattendue s\'est produite. Veuillez réessayer. 😅';
    
    if (error.message?.includes('API')) {
      errorMessage = 'Problème de connexion avec le service IA. Veuillez réessayer dans quelques instants. 🔄';
    } else if (error.message?.includes('required')) {
      errorMessage = 'Données manquantes dans la requête. Veuillez rafraîchir la page. 🔄';
    }
    
    return new Response(JSON.stringify({ 
      response: errorMessage,
      error: true,
      details: error.message 
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

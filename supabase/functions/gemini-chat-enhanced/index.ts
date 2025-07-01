
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.2?target=deno";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function getUserData(user_id: string, supabase: any) {
  // Récupérer toutes les données utilisateur en temps réel
  const [
    { data: tasks },
    { data: habits },
    { data: goals },
    { data: journalEntries },
    { data: focusSessions },
    { data: backgroundSessions },
    { data: userProfile }
  ] = await Promise.all([
    supabase.from('tasks').select('*').eq('user_id', user_id).order('created_at', { ascending: false }),
    supabase.from('habits').select('*').eq('user_id', user_id).eq('is_archived', false).order('sort_order'),
    supabase.from('goals').select('*').eq('user_id', user_id).eq('is_archived', false).order('created_at', { ascending: false }),
    supabase.from('journal_entries').select('*').eq('user_id', user_id).order('created_at', { ascending: false }).limit(10),
    supabase.from('focus_sessions').select('*').eq('user_id', user_id).order('created_at', { ascending: false }).limit(20),
    supabase.from('background_focus_sessions').select('*').eq('user_id', user_id).order('created_at', { ascending: false }).limit(10),
    supabase.from('user_profiles').select('*').eq('id', user_id).single()
  ]);

  return {
    tasks: tasks || [],
    habits: habits || [],
    goals: goals || [],
    journal_entries: journalEntries || [],
    focus_sessions: focusSessions || [],
    background_focus_sessions: backgroundSessions || [],
    user_profile: userProfile
  };
}

async function createPendingAction(action: any, user_id: string, supabase: any) {
  const { data, error } = await supabase
    .from('ai_pending_actions')
    .insert({
      user_id: user_id,
      action_type: action.type,
      action_data: action.data
    })
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

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
          completed: false,
          parent_task_id: action.data.parent_task_id || null,
          sort_order: action.data.sort_order || 0
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
          streak: 0,
          sort_order: action.data.sort_order || 0
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
          mood: ['excellent', 'good', 'neutral', 'bad', 'terrible'].includes(action.data.mood) ? action.data.mood : null,
          tags: Array.isArray(action.data.tags) ? action.data.tags : null
        })
        .select()
        .single();
      
      if (journalError) throw journalError;
      actionResult = { type: 'journal_created', data: journalData };
      break;

    case 'create_tasks':
      if (!Array.isArray(action.data) || action.data.length === 0) {
        throw new Error('Aucune tâche à créer');
      }
      
      const createdTasks = [];
      for (const taskData of action.data) {
        if (!taskData.title || taskData.title.trim() === '') {
          continue; // Skip tasks without title
        }
        
        const { data: newTask, error: taskErr } = await supabase
          .from('tasks')
          .insert({
            user_id: user_id,
            title: taskData.title.trim(),
            description: taskData.description || null,
            priority: ['high', 'medium', 'low'].includes(taskData.priority) ? taskData.priority : 'medium',
            due_date: taskData.due_date || null,
            completed: false,
            sort_order: taskData.sort_order || 0
          })
          .select()
          .single();
        
        if (!taskErr && newTask) {
          createdTasks.push(newTask);
        }
      }
      
      actionResult = { type: 'tasks_created', data: createdTasks, count: createdTasks.length };
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
    const { message, user_id, action, confirm_action } = await req.json();
    
    console.log("Received request:", { message, user_id, action, confirm_action });
    
    if (!message && !action && !confirm_action) {
      throw new Error('Message, action or confirm_action is required');
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

    // Si c'est une confirmation d'action
    if (confirm_action) {
      try {
        const { data: pendingAction, error: fetchError } = await supabase
          .from('ai_pending_actions')
          .select('*')
          .eq('id', confirm_action)
          .eq('user_id', user_id)
          .single();

        if (fetchError || !pendingAction) {
          throw new Error('Action non trouvée ou expirée');
        }

        const actionResult = await executeAction({
          type: pendingAction.action_type,
          data: pendingAction.action_data
        }, user_id, supabase);

        // Supprimer l'action en attente
        await supabase
          .from('ai_pending_actions')
          .delete()
          .eq('id', confirm_action);

        return new Response(JSON.stringify({ 
          response: `✅ ${actionResult.type === 'task_created' ? 'Tâche' : 
                      actionResult.type === 'habit_created' ? 'Habitude' : 
                      actionResult.type === 'goal_created' ? 'Objectif' : 
                      actionResult.type === 'tasks_created' ? `${actionResult.count} tâches` : 'Entrée de journal'} créé(e) avec succès ! 🎉`,
          action_result: actionResult
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      } catch (error) {
        console.error('Error confirming action:', error);
        return new Response(JSON.stringify({ 
          response: `❌ Erreur lors de la confirmation : ${error.message}`,
          error: true 
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    // Si une action est passée directement, on l'exécute
    if (action && action.type) {
      try {
        const actionResult = await executeAction(action, user_id, supabase);
        console.log("Action executed successfully:", actionResult);
        return new Response(JSON.stringify({ 
          response: `✅ ${actionResult.type === 'task_created' ? 'Tâche' : 
                      actionResult.type === 'habit_created' ? 'Habitude' : 
                      actionResult.type === 'goal_created' ? 'Objectif' : 
                      actionResult.type === 'tasks_created' ? `${actionResult.count} tâches` : 'Entrée de journal'} créé(e) avec succès ! 🎉`,
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

    // Récupérer toutes les données utilisateur
    const userData = await getUserData(user_id, supabase);

    const systemPrompt = `Tu es DeepFlow AI, un assistant IA personnel spécialisé dans le développement personnel et la productivité. 
Tu parles TOUJOURS en français et tu utilises TOUJOURS des emojis appropriés dans tes réponses (1 à 3 par réponse) 😊.
Tu as accès aux données en temps réel de l'utilisateur et tu peux l'aider à créer des tâches, habitudes, objectifs et entrées de journal.

IMPORTANT : 
- Tu ne dois JAMAIS mentionner le mot "JSON", "format JSON" ni d'instruction technique à l'utilisateur.
- Pour créer plusieurs éléments ou des éléments complexes, tu dois TOUJOURS demander confirmation explicite avec le format JSON ci-dessous.
- Ne crée des éléments directement QUE si l'utilisateur le demande explicitement ET simplement.

Pour créer un élément qui nécessite une confirmation, ta réponse DOIT contenir un bloc de code. N'ajoute aucun commentaire ou texte explicatif à l'intérieur de ce bloc. Le bloc doit commencer par \`\`\`json et se terminer par \`\`\`. Voici le format à l'intérieur du bloc :
\`\`\`json
{"pending_action":{"type":"create_task","data":{"title":"titre","description":"description","priority":"medium","due_date":"YYYY-MM-DD"}}}
\`\`\`

Pour plusieurs éléments :
\`\`\`json
{"pending_action":{"type":"create_tasks","data":[{"title":"titre1","description":"desc1","priority":"high","due_date":"YYYY-MM-DD"},{"title":"titre2","description":"desc2","priority":"medium"}]}}
\`\`\`

DONNÉES UTILISATEUR ACTUELLES (EN TEMPS RÉEL):
${JSON.stringify(userData, null, 2)}

CAPACITÉS:
- Analyser les données de productivité de l'utilisateur en détail 📊
- Créer des tâches, habitudes, objectifs, entrées de journal avec confirmation ✨
- Donner des conseils personnalisés basés sur les vraies données temps réel 💡
- Fournir des statistiques précises et des analyses approfondies 📈
- Proposer des améliorations concrètes et réalisables 🚀

INSTRUCTIONS:
- Réponds TOUJOURS en français et avec des emojis adaptés 😊
- Sois encourageant, constructif et empathique 💪
- Propose des actions concrètes et réalisables ✅
- Utilise un ton amical et professionnel 🤝
- Pour les créations multiples ou complexes, utilise TOUJOURS le format JSON de confirmation ci-dessus.
- Analyse les données temps réel pour donner des conseils précis et personnalisés.
- Tu as accès aux habitudes archivées, utilise ces informations pour donner des conseils pertinents.
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
          maxOutputTokens: 1500,
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

    // Vérifier si la réponse contient une action en attente
    const pendingActionRegex = /```json\s*(\{[\s\S]*?"pending_action"[\s\S]*?\})\s*```/;
    const match = responseText.match(pendingActionRegex);

    if (match) {
      try {
        const jsonString = match[1];
        const actionJson = JSON.parse(jsonString);

        if (actionJson.pending_action) {
          console.log("Pending action detected, creating:", actionJson.pending_action);
          
          const pendingAction = await createPendingAction(actionJson.pending_action, user_id, supabase);
          const cleanedResponse = responseText.replace(match[0], '').trim();
          
          return new Response(JSON.stringify({ 
            response: cleanedResponse || "J'ai préparé une action pour vous. Veuillez la confirmer ci-dessous. 🤔",
            pending_action: pendingAction
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
      } catch (e) {
        console.error("Error processing pending action from AI response:", e.message);
      }
    }

    // Vérifier si la réponse contient une action directe (pour compatibilité)
    const directActionRegex = /```json\s*(\{[\s\S]*?"action"[\s\S]*?\})\s*```/;
    const directMatch = responseText.match(directActionRegex);

    if (directMatch) {
      try {
        const jsonString = directMatch[1];
        const actionJson = JSON.parse(jsonString);

        if (actionJson.action) {
          console.log("Direct action detected, executing:", actionJson.action);
          
          const actionResult = await executeAction(actionJson.action, user_id, supabase);
          const cleanedResponse = responseText.replace(directMatch[0], '').trim();
          
          const successMessage = `✅ ${actionResult.type === 'task_created' ? 'Tâche' : 
                                  actionResult.type === 'habit_created' ? 'Habitude' : 
                                  actionResult.type === 'goal_created' ? 'Objectif' : 
                                  actionResult.type === 'tasks_created' ? `${actionResult.count} tâches` : 'Entrée de journal'} créé(e) avec succès ! 🎉`;

          return new Response(JSON.stringify({ 
            response: cleanedResponse || successMessage,
            action_result: actionResult
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
      } catch (e) {
        console.error("Error processing direct action from AI response:", e.message);
      }
    }

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

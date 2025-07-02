
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, context } = await req.json();
    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');

    if (!GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY not configured');
    }

    // Construire le prompt avec le contexte complet
    const systemPrompt = `Tu es un assistant IA spécialisé dans la productivité et l'organisation personnelle. 

CONTEXTE UTILISATEUR (en temps réel):
- Habitudes actuelles: ${JSON.stringify(context.habits, null, 2)}
- Tâches actuelles: ${JSON.stringify(context.tasks, null, 2)}
- Objectifs actuels: ${JSON.stringify(context.goals, null, 2)}
- Entrées de journal récentes: ${JSON.stringify(context.journalEntries, null, 2)}
- Sessions de focus récentes: ${JSON.stringify(context.focusSessions, null, 2)}
- Profil utilisateur: ${JSON.stringify(context.userProfile, null, 2)}

HISTORIQUE DES MESSAGES:
${context.previousMessages?.map(m => `${m.role}: ${m.content}`).join('\n') || 'Aucun historique'}

CAPACITÉS SPÉCIALES:
- Tu peux proposer de créer plusieurs éléments à la fois (habitudes, tâches, objectifs)
- Quand tu proposes une création multiple, inclus dans ta réponse JSON un objet "suggestions" avec "createMultiple"
- Analyse les données en temps réel pour des conseils personnalisés
- Garde une mémoire des 10 derniers messages

INSTRUCTIONS:
- Réponds en français
- Sois concis mais utile
- Utilise les données en temps réel pour des conseils pertinents
- Si tu proposes de créer plusieurs éléments, formate ta réponse comme suit:
  {
    "response": "Voici ce que je propose...",
    "suggestions": {
      "createMultiple": {
        "type": "habits|tasks|goals",
        "items": [array of items to create]
      }
    }
  }`;

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: `${systemPrompt}\n\nMessage utilisateur: ${message}`
              }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 1024,
        }
      }),
    });

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    const aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || "Désolé, je n'ai pas pu traiter votre demande.";

    // Tenter de parser la réponse comme JSON pour les suggestions
    let parsedResponse;
    try {
      parsedResponse = JSON.parse(aiResponse);
    } catch {
      parsedResponse = { response: aiResponse };
    }

    return new Response(JSON.stringify(parsedResponse), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in gemini-chat-enhanced function:', error);
    return new Response(
      JSON.stringify({ 
        response: "Je rencontre des difficultés techniques. Veuillez réessayer.",
        error: true 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});


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
    const { message, context, user_id } = await req.json();
    
    // Construire le prompt avec le contexte utilisateur
    const systemPrompt = `Tu es un assistant IA personnel spécialisé dans le développement personnel et la productivité. Tu as accès aux données en temps réel de l'utilisateur et à l'historique de vos conversations récentes.

DONNÉES UTILISATEUR ACTUELLES:
- Habitudes: ${context.user_data?.habits?.length || 0} habitudes
- Objectifs: ${context.user_data?.goals?.length || 0} objectifs  
- Tâches: ${context.user_data?.tasks?.length || 0} tâches
- Entrées de journal: ${context.user_data?.journal_entries?.length || 0} entrées récentes
- Bonnes actions: ${context.user_data?.good_actions?.length || 0} actions récentes

DÉTAILS DES DONNÉES:
${JSON.stringify(context.user_data, null, 2)}

HISTORIQUE RÉCENT:
${context.recent_messages?.map((msg: any) => `${msg.role}: ${msg.content}`).join('\n') || 'Aucun historique'}

INSTRUCTIONS:
- Réponds en français
- Utilise les données en temps réel pour donner des conseils personnalisés
- Fais référence à l'historique de conversation quand c'est pertinent
- Sois encourageant et constructif
- Propose des actions concrètes basées sur les données actuelles
- Si l'utilisateur demande des statistiques, utilise les vraies données
- Limite tes réponses à 300 mots maximum`;

    const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=' + Deno.env.get('GEMINI_API_KEY'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: systemPrompt },
              { text: `Utilisateur: ${message}` }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 500,
        }
      }),
    });

    const data = await response.json();
    const aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || "Désolé, je n'ai pas pu traiter votre demande.";

    return new Response(JSON.stringify({ response: aiResponse }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in gemini-chat-enhanced function:', error);
    return new Response(JSON.stringify({ 
      error: 'Erreur du serveur',
      details: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

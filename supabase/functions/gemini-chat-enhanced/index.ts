
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
    
    console.log("Received request:", { message, user_id, contextKeys: Object.keys(context || {}) });
    
    if (!message) {
      throw new Error('Message is required');
    }
    
    if (!user_id) {
      throw new Error('User ID is required');
    }
    
    // Construire le prompt avec le contexte utilisateur amélioré
    const systemPrompt = `Tu es un assistant IA personnel spécialisé dans le développement personnel et la productivité. Tu as accès aux données en temps réel de l'utilisateur et tu peux l'aider à créer des tâches, habitudes, objectifs, et bonnes actions.

DONNÉES UTILISATEUR ACTUELLES:
${context?.user_data ? JSON.stringify(context.user_data, null, 2) : 'Aucune donnée disponible'}

HISTORIQUE RÉCENT:
${context?.recent_messages?.map((msg: any) => `${msg.role}: ${msg.content}`).join('\n') || 'Aucun historique'}

CAPACITÉS:
- Analyser les données de productivité de l'utilisateur
- Créer des tâches, habitudes, objectifs et bonnes actions via les APIs
- Donner des conseils personnalisés basés sur les vraies données
- Fournir des statistiques précises
- Proposer des améliorations concrètes

INSTRUCTIONS:
- Réponds TOUJOURS en français
- Utilise les données réelles pour donner des conseils personnalisés
- Sois encourageant et constructif
- Propose des actions concrètes
- Utilise un ton amical et professionnel
- Si l'utilisateur demande de créer quelque chose, explique comment tu peux l'aider
- Limite tes réponses à 400 mots maximum`;

    const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
    
    if (!geminiApiKey) {
      console.error('GEMINI_API_KEY not found');
      return new Response(JSON.stringify({ 
        response: "Configuration manquante. L'API Gemini n'est pas configurée.",
        error: true 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log("Calling Gemini API...");
    
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${geminiApiKey}`, {
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
          maxOutputTokens: 800,
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
        response: "Erreur de connexion avec le service IA. Veuillez vérifier votre configuration API ou réessayer plus tard.",
        error: true,
        details: `API Error: ${response.status}`
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const data = await response.json();
    console.log("Gemini response received:", data);

    const aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || "Désolé, je n'ai pas pu traiter votre demande. Veuillez réessayer.";

    console.log("Final AI response:", aiResponse);

    return new Response(JSON.stringify({ response: aiResponse }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in gemini-chat-enhanced function:', error);
    
    // Réponse d'erreur plus détaillée
    const errorMessage = error.message?.includes('API') 
      ? 'Erreur de connexion avec le service IA. Veuillez vérifier la configuration.'
      : 'Erreur du serveur. Veuillez réessayer dans quelques instants.';
    
    return new Response(JSON.stringify({ 
      response: errorMessage,
      error: true,
      details: error.message 
    }), {
      status: 200, // On retourne 200 pour éviter les erreurs côté client
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

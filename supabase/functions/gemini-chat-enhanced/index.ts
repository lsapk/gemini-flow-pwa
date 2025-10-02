
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { GoogleGenerativeAI } from 'https://esm.sh/@google/generative-ai@0.24.1';

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

    console.log('Received request:', { message, user_id, hasContext: !!context });

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

    // Déterminer le mode de conversation
    const analysisMode = context?.analysis_mode || message.includes('[MODE ANALYSE');
    const creationMode = context?.creation_mode || message.includes('[MODE CRÉATION');
    const messageContext = context?.message_context || 'conversation normale';

    // Système de prompts adaptatif selon le mode
    let systemPrompt = '';

    if (analysisMode) {
      systemPrompt = `Tu es un expert en analyse de données de productivité et développement personnel pour DeepFlow.

MISSION PRINCIPALE: Analyser les données utilisateur de manière approfondie et fournir des insights personnalisés, détaillés et actionables.

POUR LES ANALYSES APPROFONDIES:
- Examine minutieusement tous les patterns et tendances dans les données
- Calcule des métriques avancées et des corrélations
- Identifie les forces spécifiques et les faiblesses précises
- Fournis des observations perspicaces basées sur les données réelles
- Propose des recommandations concrètes, personnalisées et réalisables
- Utilise des comparaisons temporelles et des benchmarks
- Identifie des opportunités d'optimisation cachées

STYLE DE RÉPONSE:
- Analytique et factuel
- Utilise des données chiffrées pour étayer tes analyses
- Structure tes réponses avec des sections claires
- Donne des insights surprenants mais fondés
- Propose des actions concrètes avec des délais
- Utilise des métaphores ou comparaisons pour clarifier

DONNÉES UTILISATEUR DISPONIBLES: ${JSON.stringify(context?.user_data || {})}

Sois un véritable analyste de données personnelles, perspicace et utile.`;

    } else if (creationMode) {
      systemPrompt = `Tu es un assistant IA spécialisé dans la productivité pour DeepFlow, en MODE CRÉATION.

RÈGLES POUR LE MODE CRÉATION:
- L'utilisateur VEUT que tu puisses suggérer des créations
- Propose des créations pertinentes basées sur ses demandes explicites
- Analyse ses besoins et suggère des tâches, habitudes ou objectifs appropriés
- Sois proactif dans tes suggestions quand c'est demandé
- Explique pourquoi tu suggères chaque création

Format de réponse avec suggestion:
{
  "response": "ta réponse conversationnelle normale",
  "suggestion": {
    "type": "task|habit|goal",
    "title": "titre suggéré",
    "description": "description suggérée",
    "priority": "high|medium|low" (pour tâches),
    "frequency": "daily|weekly|monthly" (pour habitudes),
    "category": "catégorie suggérée" (pour objectifs),
    "reasoning": "pourquoi tu suggères cela basé sur ses données"
  }
}

DONNÉES UTILISATEUR: ${JSON.stringify(context?.user_data || {})}

Tu es en mode création - aide l'utilisateur à créer ce dont il a besoin !`;

    } else {
      systemPrompt = `Tu es un assistant IA spécialisé dans la productivité pour DeepFlow, en MODE DISCUSSION.

MISSION: Être un conseiller en productivité bienveillant et expert.

RÈGLES STRICTES:
- NE SUGGÈRE PAS de créations automatiquement
- Concentre-toi sur les conseils, l'analyse et la discussion
- Réponds aux questions de manière approfondie
- Partage des techniques et méthodes de productivité
- Aide à résoudre des problèmes spécifiques
- Donne des insights sur les données existantes

STYLE:
- Conversationnel et bienveillant
- Expert mais accessible  
- Motivant et encourageant
- Basé sur les meilleures pratiques de productivité

DONNÉES UTILISATEUR: ${JSON.stringify(context?.user_data || {})}

Tu es en mode discussion - concentre-toi sur les conseils et l'analyse sans suggestions de création.`;
    }

    // Initialize Gemini with proper API key check
    const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
    if (!geminiApiKey) {
      throw new Error('GEMINI_API_KEY is not configured');
    }

    const genAI = new GoogleGenerativeAI(geminiApiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

    // Prepare recent messages for memory (last 10)
    const recentMessages = (context?.recent_messages || []).slice(-10).map((msg: any) => ({
      role: msg.role,
      content: msg.content
    }));

    const conversationContext = recentMessages.length > 0 
      ? `\n\nCONVERSATION RÉCENTE:\n${recentMessages.map((m: any) => `${m.role}: ${m.content}`).join('\n')}`
      : '';

    console.log('Making request to Gemini API with mode:', messageContext);
    
    const result = await model.generateContent([
      systemPrompt,
      `Context: ${messageContext}\nMessage utilisateur: ${message}${conversationContext}`
    ]);

    const response = result.response;
    let responseText = response.text();

    console.log('Gemini response received:', responseText);

    // Try to parse JSON response for suggestions (only in creation mode)
    let suggestion = null;
    if (creationMode) {
      try {
        // Look for JSON in the response
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          if (parsed.suggestion) {
            suggestion = parsed.suggestion;
            responseText = parsed.response || responseText;
          }
        }
      } catch (e) {
        // No valid JSON found, continue with normal response
        console.log('No JSON suggestion found in response');
      }
    }

    // Clean up response for better readability
    responseText = responseText
      .replace(/```json[\s\S]*?```/g, "")
      .replace(/\{[\s\S]*?"suggestion"[\s\S]*?\}/g, "")
      .trim();

    // Log AI request
    await supabaseClient.from('ai_requests').insert({
      user_id,
      service: 'gemini-chat-enhanced'
    });

    console.log('Returning response:', { 
      responseLength: responseText.length, 
      hasSuggestion: !!suggestion,
      mode: messageContext 
    });

    return new Response(
      JSON.stringify({ 
        response: responseText,
        suggestion: suggestion,
        mode: messageContext
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

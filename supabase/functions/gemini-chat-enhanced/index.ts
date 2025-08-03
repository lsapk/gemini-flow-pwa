
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

    // Enhanced system prompt for intelligent suggestions
    const systemPrompt = `Tu es un assistant IA spécialisé dans la productivité pour l'application DeepFlow. 

    RÈGLES POUR LES SUGGESTIONS INTELLIGENTES:
    - Analyse le contexte de chaque message pour comprendre si l'utilisateur pourrait bénéficier d'une tâche, habitude ou objectif
    - Si tu détectes qu'une création serait utile, propose-la avec des détails précis
    - Ne crée JAMAIS automatiquement - propose toujours d'abord
    - Utilise le format JSON suivant pour tes suggestions:

    Format de réponse quand tu suggères quelque chose:
    {
      "response": "ta réponse conversationnelle normale",
      "suggestion": {
        "type": "task|habit|goal",
        "title": "titre suggéré",
        "description": "description suggérée",
        "priority": "high|medium|low" (pour tâches),
        "frequency": "daily|weekly|monthly" (pour habitudes),
        "category": "catégorie suggérée" (pour objectifs),
        "reasoning": "pourquoi tu suggères cela"
      }
    }

    DONNÉES UTILISATEUR: ${JSON.stringify(context?.user_data || {})}
    
    Exemples de situations où suggérer:
    - Utilisateur mentionne quelque chose qu'il veut faire → suggérer une tâche
    - Utilisateur parle d'améliorer quelque chose régulièrement → suggérer une habitude  
    - Utilisateur évoque un objectif à long terme → suggérer un objectif
    - Utilisateur exprime une frustration → suggérer des actions pour l'aider

    Réponds de manière naturelle ET intelligente.`;

    // Initialize Gemini
    const genAI = new GoogleGenerativeAI(Deno.env.get('GEMINI_API_KEY') || '');
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // Préparer les messages récents pour la mémoire (derniers 10)
    const recentMessages = (context?.recent_messages || []).slice(-10).map((msg: any) => ({
      role: msg.role,
      content: msg.content
    }));

    const conversationContext = recentMessages.length > 0 
      ? `\n\nCONVERSATION RÉCENTE:\n${recentMessages.map((m: any) => `${m.role}: ${m.content}`).join('\n')}`
      : '';

    const result = await model.generateContent([
      systemPrompt,
      `Message utilisateur: ${message}${conversationContext}`
    ]);

    const response = result.response;
    let responseText = response.text();

    // Try to parse JSON response for suggestions
    let suggestion = null;
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

    // Log AI request
    await supabaseClient.from('ai_requests').insert({
      user_id,
      service: 'gemini-chat-enhanced'
    });

    return new Response(
      JSON.stringify({ 
        response: responseText,
        suggestion: suggestion
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

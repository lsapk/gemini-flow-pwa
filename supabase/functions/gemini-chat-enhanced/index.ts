
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

    // Enhanced system prompt - plus strict sur les suggestions
    const systemPrompt = `Tu es un assistant IA spécialisé dans la productivité pour l'application DeepFlow. 

    RÈGLES STRICTES POUR LES SUGGESTIONS INTELLIGENTES:
    - UNIQUEMENT suggérer des créations si l'utilisateur EXPRIME CLAIREMENT une intention ou un besoin
    - Ne PAS suggérer pour de simples salutations comme "salut", "bonjour", "hello"
    - Ne PAS suggérer si l'utilisateur pose juste une question générale
    - SUGGÉRER seulement si l'utilisateur mentionne :
      * Vouloir faire quelque chose ("je veux", "j'aimerais", "je dois")
      * Un problème à résoudre ("j'ai du mal à", "je n'arrive pas à")
      * Un objectif spécifique ("pour améliorer", "pour devenir", "afin de")
      * Une activité récurrente qu'il veut tracker
    
    Si tu détectes qu'une création serait VRAIMENT utile, propose-la avec ce format JSON:

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
        "reasoning": "pourquoi tu suggères cela"
      }
    }

    DONNÉES UTILISATEUR: ${JSON.stringify(context?.user_data || {})}
    
    Réponds de manière naturelle ET intelligente, mais NE SUGGÈRE QUE quand c'est VRAIMENT pertinent.`;

    // Initialize Gemini with proper API key check
    const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
    if (!geminiApiKey) {
      throw new Error('GEMINI_API_KEY is not configured');
    }

    const genAI = new GoogleGenerativeAI(geminiApiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // Préparer les messages récents pour la mémoire (derniers 10)
    const recentMessages = (context?.recent_messages || []).slice(-10).map((msg: any) => ({
      role: msg.role,
      content: msg.content
    }));

    const conversationContext = recentMessages.length > 0 
      ? `\n\nCONVERSATION RÉCENTE:\n${recentMessages.map((m: any) => `${m.role}: ${m.content}`).join('\n')}`
      : '';

    console.log('Making request to Gemini API...');
    
    const result = await model.generateContent([
      systemPrompt,
      `Message utilisateur: ${message}${conversationContext}`
    ]);

    const response = result.response;
    let responseText = response.text();

    console.log('Gemini response received:', responseText);

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

    console.log('Returning response:', { responseLength: responseText.length, hasSuggestion: !!suggestion });

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

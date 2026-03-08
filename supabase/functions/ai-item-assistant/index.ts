import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const TOOL_DEFINITIONS = {
  task: {
    name: 'suggest_task',
    description: 'Génère une description enrichie et des suggestions pour une tâche de productivité.',
    parameters: {
      type: 'object',
      properties: {
        description: { type: 'string', description: 'Description détaillée et actionable de la tâche (2-3 phrases)' },
        priority: { type: 'string', enum: ['high', 'medium', 'low'], description: 'Priorité suggérée' },
        due_date_suggestion: { type: 'string', description: 'Suggestion de délai relatif, ex: "dans 3 jours", "cette semaine", "demain"' },
        subtasks: {
          type: 'array',
          items: { type: 'string' },
          description: '3-5 sous-tâches concrètes pour accomplir cette tâche'
        }
      },
      required: ['description', 'priority', 'subtasks'],
      additionalProperties: false
    }
  },
  habit: {
    name: 'suggest_habit',
    description: 'Génère une description enrichie et des suggestions pour une habitude.',
    parameters: {
      type: 'object',
      properties: {
        description: { type: 'string', description: 'Description motivante de l\'habitude et ses bénéfices (2-3 phrases)' },
        frequency: { type: 'string', enum: ['daily', 'weekly', 'monthly'], description: 'Fréquence idéale recommandée' },
        category: { type: 'string', description: 'Catégorie suggérée (ex: Santé, Travail, Personnel, Sport, Bien-être, Apprentissage)' },
        tips: { type: 'string', description: 'Un conseil pratique pour maintenir cette habitude sur le long terme' }
      },
      required: ['description', 'frequency', 'category', 'tips'],
      additionalProperties: false
    }
  },
  goal: {
    name: 'suggest_goal',
    description: 'Génère une description enrichie et des suggestions pour un objectif.',
    parameters: {
      type: 'object',
      properties: {
        description: { type: 'string', description: 'Description SMART de l\'objectif avec bénéfices attendus (2-3 phrases)' },
        category: { type: 'string', enum: ['personal', 'professional', 'health'], description: 'Catégorie la plus appropriée' },
        milestones: {
          type: 'array',
          items: { type: 'string' },
          description: '3-5 étapes clés pour atteindre cet objectif'
        }
      },
      required: ['description', 'category', 'milestones'],
      additionalProperties: false
    }
  }
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      );
    }

    const supabaseAuth = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: claimsError } = await supabaseAuth.auth.getUser(token);

    if (claimsError || !claimsData?.user?.id) {
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      );
    }

    const userId = claimsData.user.id;
    const { type, title, existingData } = await req.json();

    if (!type || !title || !['task', 'habit', 'goal'].includes(type)) {
      return new Response(
        JSON.stringify({ error: 'Invalid request: type and title required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      return new Response(
        JSON.stringify({ error: 'AI service not configured' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    // Check limits (reuse same pattern as gemini-chat-enhanced)
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    let isPremium = false;
    try {
      const { data: sub } = await supabaseClient
        .from('subscribers')
        .select('subscribed')
        .eq('user_id', userId)
        .maybeSingle();
      const { data: adminRole } = await supabaseClient
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .eq('role', 'admin')
        .maybeSingle();
      isPremium = sub?.subscribed === true || !!adminRole;
    } catch (e) {
      console.error('Error checking premium:', e);
    }

    if (!isPremium) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const { count } = await supabaseClient
        .from('ai_requests')
        .select('*', { count: 'exact', head: true })
        .eq('service', 'ai-item-assistant')
        .eq('user_id', userId)
        .gte('created_at', today.toISOString());

      if ((count || 0) >= 10) {
        return new Response(
          JSON.stringify({ error: 'AI_LIMIT_REACHED', message: 'Limite quotidienne atteinte. Passez à Premium pour des suggestions illimitées.' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 429 }
        );
      }
    }

    const toolDef = TOOL_DEFINITIONS[type as keyof typeof TOOL_DEFINITIONS];
    const typeLabels = { task: 'tâche', habit: 'habitude', goal: 'objectif' };

    const systemPrompt = `Tu es un assistant de productivité expert pour l'app DeepFlow. L'utilisateur crée une ${typeLabels[type as keyof typeof typeLabels]}. Génère des suggestions intelligentes, concrètes et motivantes en français. Sois concis mais utile.${existingData ? `\n\nDonnées existantes: ${JSON.stringify(existingData)}` : ''}`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Titre: "${title}"` }
        ],
        tools: [{
          type: 'function',
          function: {
            name: toolDef.name,
            description: toolDef.description,
            parameters: toolDef.parameters
          }
        }],
        tool_choice: { type: 'function', function: { name: toolDef.name } },
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded, please try again later.' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 429 }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'AI credits exhausted.' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 402 }
        );
      }
      const errText = await response.text();
      console.error('AI gateway error:', response.status, errText);
      throw new Error(`AI gateway error: ${errText}`);
    }

    const aiData = await response.json();
    let suggestion = null;

    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (toolCall?.function?.arguments) {
      try {
        suggestion = JSON.parse(toolCall.function.arguments);
      } catch (e) {
        console.error('Failed to parse tool call arguments:', e);
      }
    }

    // Fallback: try to parse content as JSON if no tool call
    if (!suggestion) {
      const content = aiData.choices?.[0]?.message?.content;
      if (content) {
        try {
          suggestion = JSON.parse(content);
        } catch {
          console.log('No structured suggestion extracted');
        }
      }
    }

    // Log request
    await supabaseClient.from('ai_requests').insert({
      user_id: userId,
      service: 'ai-item-assistant'
    });

    return new Response(
      JSON.stringify({ suggestion, type }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in ai-item-assistant:', error);
    return new Response(
      JSON.stringify({ error: 'Une erreur interne est survenue.' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});

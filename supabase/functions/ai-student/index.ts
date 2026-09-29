import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

const PROMPTS: Record<string, string> = {
  breakdown: `Découpe ce devoir en 3 à 8 sous-tâches concrètes. Réponds UNIQUEMENT en JSON: {"subtasks":[{"title":string,"minutes":number}],"tip":string}`,
  revision_plan: `Crée un planning de révision (répétition espacée) entre aujourd'hui et la date d'examen, 3 à 10 sessions. Réponds UNIQUEMENT en JSON: {"sessions":[{"date":"YYYY-MM-DD","title":string,"minutes":number}],"tip":string}`,
  coach: `Tu es un coach d'études. À partir des données, donne 3 à 5 conseils concrets et priorisés. Réponds UNIQUEMENT en JSON: {"summary":string,"advices":[{"title":string,"detail":string}]}`,
};

async function streamText(apiKey: string, system: string, user: string): Promise<string> {
  const res = await fetch('https://ai.gateway.lovable.dev/v1/responses', {
    method: 'POST',
    headers: { 'Lovable-API-Key': apiKey, 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json', 'X-Lovable-AIG-SDK': 'fetch' },
    body: JSON.stringify({
      model: 'openai/gpt-6-astra',
      stream: true,
      store: false,
      reasoning: { effort: 'low' },
      instructions: system,
      input: [{ role: 'user', content: user }],
    }),
  });
  if (!res.ok || !res.body) {
    const t = await res.text();
    const err: any = new Error(t || 'AI error');
    err.status = res.status;
    throw err;
  }
  const reader = res.body.getReader();
  const dec = new TextDecoder();
  let buf = '', out = '';
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += dec.decode(value, { stream: true });
    const lines = buf.split('\n');
    buf = lines.pop() ?? '';
    for (const line of lines) {
      if (!line.startsWith('data:')) continue;
      const data = line.slice(5).trim();
      if (!data || data === '[DONE]') continue;
      try {
        const ev = JSON.parse(data);
        if (ev.type === 'response.output_text.delta') out += ev.delta;
      } catch { /* ignore */ }
    }
  }
  return out;
}

function extractJson(text: string) {
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start < 0 || end < 0) throw new Error('Réponse IA invalide');
  return JSON.parse(text.slice(start, end + 1));
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) return json({ error: 'Non authentifié' }, 401);

    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
    if (userErr || !userData?.user) return json({ error: 'Session invalide' }, 401);

    const { action, payload } = await req.json();
    if (!PROMPTS[action]) return json({ error: 'Action invalide' }, 400);

    const apiKey = Deno.env.get('LOVABLE_API_KEY');
    if (!apiKey) return json({ error: 'IA non configurée' }, 500);

    const { error: creditErr } = await supabase.rpc('consume_ai_credit', { amount: 1 });
    if (creditErr) return json({ error: 'Crédits IA insuffisants' }, 402);

    const today = new Date().toISOString().slice(0, 10);
    const system = `Tu es l'assistant études de DeepFlow. Réponds en français. Nous sommes le ${today}. ${PROMPTS[action]}`;
    const text = await streamText(apiKey, system, JSON.stringify(payload ?? {}).slice(0, 12000));
    return json({ result: extractJson(text) });
  } catch (e: any) {
    console.error('ai-student error', e);
    const status = e?.status === 429 ? 429 : e?.status === 402 ? 402 : 500;
    const msg = status === 429 ? 'Trop de requêtes, réessayez dans un instant.' : status === 402 ? 'Crédits IA épuisés.' : "L'IA n'a pas pu répondre.";
    return json({ error: msg }, status);
  }
});

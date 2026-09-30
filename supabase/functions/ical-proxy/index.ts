const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  try {
    const { url } = await req.json();
    const u = new URL(url);
    if (u.protocol !== 'https:' && u.protocol !== 'http:') throw new Error('URL invalide');
    const res = await fetch(u.toString(), { headers: { 'User-Agent': 'DeepFlow/1.0' } });
    const text = await res.text();
    if (!res.ok || !text.includes('BEGIN:VCALENDAR')) throw new Error("Ce lien ne renvoie pas un calendrier iCal");
    return new Response(text, { headers: { ...cors, 'Content-Type': 'text/calendar; charset=utf-8' } });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), { status: 400, headers: { ...cors, 'Content-Type': 'application/json' } });
  }
});

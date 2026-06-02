// AI Auto-Pilot: turn a vague objective into goal + tasks + habits + weekly plan.
// Two modes via { action }: "preview" (default) returns plan only, "apply" inserts into DB.
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

const PLAN_TOOL = {
  type: "function",
  function: {
    name: "build_plan",
    description:
      "Build a structured productivity plan: one main goal, supporting tasks, supporting habits, and a weekly cadence.",
    parameters: {
      type: "object",
      properties: {
        goal: {
          type: "object",
          properties: {
            title: { type: "string" },
            description: { type: "string" },
            category: { type: "string" },
            target_date: {
              type: "string",
              description: "ISO date YYYY-MM-DD",
            },
          },
          required: ["title", "description", "category", "target_date"],
          additionalProperties: false,
        },
        tasks: {
          type: "array",
          items: {
            type: "object",
            properties: {
              title: { type: "string" },
              description: { type: "string" },
              priority: { type: "string", enum: ["low", "medium", "high"] },
              due_date: { type: "string", description: "ISO date YYYY-MM-DD" },
            },
            required: ["title", "priority"],
            additionalProperties: false,
          },
        },
        habits: {
          type: "array",
          items: {
            type: "object",
            properties: {
              title: { type: "string" },
              description: { type: "string" },
              frequency: {
                type: "string",
                enum: ["daily", "weekly"],
              },
              days_of_week: {
                type: "array",
                items: { type: "integer", minimum: 0, maximum: 6 },
                description: "0=Sunday … 6=Saturday",
              },
              category: { type: "string" },
            },
            required: ["title", "frequency"],
            additionalProperties: false,
          },
        },
        weekly_plan: {
          type: "string",
          description: "Markdown-friendly weekly cadence (max 600 chars).",
        },
        rationale: {
          type: "string",
          description: "Why this plan, in French (max 500 chars).",
        },
      },
      required: ["goal", "tasks", "habits", "weekly_plan", "rationale"],
      additionalProperties: false,
    },
  },
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS")
    return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return json({ error: "Unauthorized" }, 401);
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.replace("Bearer ", "");
    const { data: claims, error: claimsErr } = await supabase.auth.getClaims(
      token,
    );
    if (claimsErr || !claims?.claims?.sub) {
      return json({ error: "Unauthorized" }, 401);
    }
    const userId = claims.claims.sub as string;

    const body = await req.json().catch(() => ({}));
    const action = body.action ?? "preview";

    if (action === "apply") {
      const plan = body.plan;
      if (!plan?.goal) return json({ error: "Missing plan" }, 400);

      const { data: goalRow, error: gErr } = await supabase
        .from("goals")
        .insert({
          user_id: userId,
          title: plan.goal.title,
          description: plan.goal.description ?? null,
          category: plan.goal.category ?? "personal",
          target_date: plan.goal.target_date ?? null,
        })
        .select()
        .single();
      if (gErr) return json({ error: gErr.message }, 400);

      const taskRows = (plan.tasks ?? []).slice(0, 50).map((t: any) => ({
        user_id: userId,
        title: t.title,
        description: t.description ?? null,
        priority: t.priority ?? "medium",
        due_date: t.due_date ?? null,
        category: plan.goal.category ?? null,
      }));
      const habitRows = (plan.habits ?? []).slice(0, 20).map((h: any) => ({
        user_id: userId,
        title: h.title,
        description: h.description ?? null,
        frequency: h.frequency ?? "daily",
        target: 1,
        days_of_week:
          h.frequency === "weekly" && Array.isArray(h.days_of_week)
            ? h.days_of_week
            : null,
        category: h.category ?? plan.goal.category ?? null,
        linked_goal_id: goalRow.id,
      }));

      const [tIns, hIns] = await Promise.all([
        taskRows.length
          ? supabase.from("tasks").insert(taskRows).select("id")
          : Promise.resolve({ data: [], error: null } as any),
        habitRows.length
          ? supabase.from("habits").insert(habitRows).select("id")
          : Promise.resolve({ data: [], error: null } as any),
      ]);

      return json({
        ok: true,
        goal_id: goalRow.id,
        task_ids: (tIns.data ?? []).map((r: any) => r.id),
        habit_ids: (hIns.data ?? []).map((r: any) => r.id),
      });
    }

    // === preview: call Lovable AI ===
    const objective = (body.objective ?? "").toString().trim();
    if (!objective || objective.length < 5) {
      return json({ error: "Objective too short" }, 400);
    }
    const horizonWeeks = Math.min(Math.max(Number(body.horizon_weeks) || 12, 1), 52);
    const intensity = ["chill", "balanced", "intense"].includes(body.intensity)
      ? body.intensity
      : "balanced";

    // Consume 1 credit (voluntary action)
    const { error: credErr } = await supabase.rpc("consume_ai_credit", {
      amount: 1,
    });
    if (credErr) {
      return json({ error: "AI_LIMIT_REACHED", message: credErr.message }, 402);
    }

    const today = new Date().toISOString().slice(0, 10);
    const systemPrompt = `Tu es DeepFlow Auto-Pilot, un coach IA expert en productivité.
À partir d'un objectif vague de l'utilisateur, tu construis un PLAN COMPLET et RÉALISTE en français.

Contraintes :
- 1 objectif principal (SMART), date cible cohérente avec l'horizon (${horizonWeeks} semaines à partir du ${today}).
- 5 à 12 tâches concrètes, étalées dans le temps, avec priorités équilibrées.
- 2 à 5 habitudes de soutien (daily ou weekly).
- Cadence hebdomadaire (weekly_plan) courte et actionnable.
- Intensité demandée : ${intensity}.
- Réponds UNIQUEMENT via l'outil build_plan.`;

    const resp = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: `Objectif : ${objective}` },
          ],
          tools: [PLAN_TOOL],
          tool_choice: {
            type: "function",
            function: { name: "build_plan" },
          },
        }),
      },
    );

    if (!resp.ok) {
      const t = await resp.text();
      console.error("AI gateway error", resp.status, t);
      if (resp.status === 429)
        return json({ error: "Rate limited, réessayez plus tard." }, 429);
      if (resp.status === 402)
        return json({ error: "Crédits Lovable AI épuisés." }, 402);
      return json({ error: "AI gateway error" }, 500);
    }

    const data = await resp.json();
    const call =
      data.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
    if (!call) return json({ error: "Réponse IA invalide" }, 500);
    const plan = JSON.parse(call);

    return json({ ok: true, plan });
  } catch (e) {
    console.error("autopilot error", e);
    return json({ error: e instanceof Error ? e.message : "Unknown" }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

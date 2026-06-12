// AI Roadmap: turn an objective into a personalized roadmap with goal, tasks,
// habits, weekly forecast (predicted productivity evolution), tailored advices and risks.
// Modes via { action }: "preview" returns plan only, "apply" inserts into DB.
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
    name: "build_roadmap",
    description:
      "Build a personalized roadmap: SMART goal, supporting tasks, supporting habits, weekly cadence, weekly forecast of predicted productivity score, tailored advices and risks.",
    parameters: {
      type: "object",
      properties: {
        goal: {
          type: "object",
          properties: {
            title: { type: "string" },
            description: { type: "string" },
            category: { type: "string" },
            target_date: { type: "string", description: "ISO date YYYY-MM-DD" },
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
              due_date: { type: "string" },
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
              frequency: { type: "string", enum: ["daily", "weekly"] },
              days_of_week: {
                type: "array",
                items: { type: "integer", minimum: 0, maximum: 6 },
              },
              category: { type: "string" },
            },
            required: ["title", "frequency"],
            additionalProperties: false,
          },
        },
        weekly_plan: {
          type: "string",
          description: "Cadence hebdomadaire courte (max 600 chars).",
        },
        forecast: {
          type: "array",
          description:
            "Évolution hebdomadaire prédite. Une entrée par semaine de 1 à horizon. predicted_score = score productivité projeté (0-100), progress = % avancement de l'objectif (0-100). Milestone court (max 60 chars).",
          items: {
            type: "object",
            properties: {
              week: { type: "integer", minimum: 1 },
              predicted_score: { type: "integer", minimum: 0, maximum: 100 },
              progress: { type: "integer", minimum: 0, maximum: 100 },
              milestone: { type: "string" },
            },
            required: ["week", "predicted_score", "progress", "milestone"],
            additionalProperties: false,
          },
        },
        advices: {
          type: "array",
          description: "3 à 6 conseils personnalisés, actionnables, en français.",
          items: {
            type: "object",
            properties: {
              title: { type: "string" },
              content: { type: "string" },
            },
            required: ["title", "content"],
            additionalProperties: false,
          },
        },
        risks: {
          type: "array",
          description: "2 à 4 risques/obstacles probables avec mitigation.",
          items: {
            type: "object",
            properties: {
              risk: { type: "string" },
              mitigation: { type: "string" },
            },
            required: ["risk", "mitigation"],
            additionalProperties: false,
          },
        },
        rationale: {
          type: "string",
          description: "Pourquoi cette roadmap, en français (max 500 chars).",
        },
      },
      required: [
        "goal",
        "tasks",
        "habits",
        "weekly_plan",
        "forecast",
        "advices",
        "risks",
        "rationale",
      ],
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

      const selectedTasks = Array.isArray(body.selected_task_indices)
        ? (plan.tasks ?? []).filter((_: any, i: number) =>
            body.selected_task_indices.includes(i),
          )
        : (plan.tasks ?? []);
      const selectedHabits = Array.isArray(body.selected_habit_indices)
        ? (plan.habits ?? []).filter((_: any, i: number) =>
            body.selected_habit_indices.includes(i),
          )
        : (plan.habits ?? []);

      const taskRows = selectedTasks.slice(0, 50).map((t: any) => ({
        user_id: userId,
        title: t.title,
        description: t.description ?? null,
        priority: t.priority ?? "medium",
        due_date: t.due_date ?? null,
        category: plan.goal.category ?? null,
      }));
      const habitRows = selectedHabits.slice(0, 20).map((h: any) => ({
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

      const taskIds = (tIns.data ?? []).map((r: any) => r.id);
      const habitIds = (hIns.data ?? []).map((r: any) => r.id);

      // Save the roadmap snapshot for ongoing tracking on dashboard
      await supabase.from("ai_roadmaps").insert({
        user_id: userId,
        goal_id: goalRow.id,
        objective: plan.goal.title,
        horizon_weeks: Array.isArray(plan.forecast) ? plan.forecast.length : 12,
        intensity: body.intensity ?? "balanced",
        plan,
        task_ids: taskIds,
        habit_ids: habitIds,
        status: "active",
      });

      return json({
        ok: true,
        goal_id: goalRow.id,
        task_ids: taskIds,
        habit_ids: habitIds,
      });
    }


    // === preview ===
    const objective = (body.objective ?? "").toString().trim();
    if (!objective || objective.length < 5) {
      return json({ error: "Objective too short" }, 400);
    }
    const horizonWeeks = Math.min(
      Math.max(Number(body.horizon_weeks) || 12, 1),
      52,
    );
    const intensity = ["chill", "balanced", "intense"].includes(body.intensity)
      ? body.intensity
      : "balanced";

    // Pull lightweight user context for personalization
    const [{ data: recentTasks }, { data: recentHabits }, { data: profile }] =
      await Promise.all([
        supabase
          .from("tasks")
          .select("title, status, priority, due_date")
          .eq("user_id", userId)
          .order("created_at", { ascending: false })
          .limit(15),
        supabase
          .from("habits")
          .select("title, frequency, category")
          .eq("user_id", userId)
          .limit(15),
        supabase
          .from("user_profiles")
          .select("display_name, email")
          .eq("id", userId)
          .maybeSingle(),
      ]);

    // Consume 1 credit (voluntary action)
    const { error: credErr } = await supabase.rpc("consume_ai_credit", {
      amount: 1,
    });
    if (credErr) {
      return json({ error: "AI_LIMIT_REACHED", message: credErr.message }, 402);
    }

    const today = new Date().toISOString().slice(0, 10);
    const ctx = {
      recent_tasks: (recentTasks ?? []).slice(0, 10),
      recent_habits: (recentHabits ?? []).slice(0, 10),
    };

    const systemPrompt = `Tu es DeepFlow Roadmap IA, un coach expert en productivité.
À partir d'un objectif utilisateur, construis une ROADMAP PERSONNALISÉE en français.

Contraintes :
- 1 objectif principal SMART, date cible cohérente avec ${horizonWeeks} semaines depuis ${today}.
- 5 à 12 tâches concrètes, étalées dans le temps.
- 2 à 5 habitudes de soutien.
- weekly_plan : cadence hebdo courte et actionnable.
- forecast : EXACTEMENT ${horizonWeeks} entrées (week=1..${horizonWeeks}), progression réaliste et non linéaire (montée initiale, plateaux, accélération finale). predicted_score commence ~55-65 et évolue selon l'intensité (${intensity}).
- advices : 3-6 conseils personnalisés basés sur le contexte utilisateur si dispo.
- risks : 2-4 risques probables avec mitigation concrète.
- Intensité demandée : ${intensity}.
- Réponds UNIQUEMENT via l'outil build_roadmap.

Contexte utilisateur : ${JSON.stringify(ctx)}`;

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
            function: { name: "build_roadmap" },
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
    console.error("roadmap error", e);
    return json({ error: e instanceof Error ? e.message : "Unknown" }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

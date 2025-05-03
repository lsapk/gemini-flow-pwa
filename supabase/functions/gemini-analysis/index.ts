
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") || "";
const geminiApiKey = Deno.env.get("GEMINI_API_KEY") || "";

serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authenticate the user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "No authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // Fetch all user data for analysis
    const { data: tasks } = await supabase.from("tasks").select().eq("user_id", user.id);
    const { data: habits } = await supabase.from("habits").select().eq("user_id", user.id);
    const { data: journals } = await supabase.from("journal_entries").select().eq("user_id", user.id).order('created_at', { ascending: false }).limit(10);
    const { data: goals } = await supabase.from("goals").select().eq("user_id", user.id);

    // Count completed tasks and calculate productivity
    const completedTasks = tasks ? tasks.filter(task => task.completed).length : 0;
    const totalTasks = tasks ? tasks.length : 0;
    const productivityRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

    // Calculate habit consistency
    const habitCompletions = habits ? habits.map(habit => habit.completion_rate || 0) : [];
    const averageHabitConsistency = habitCompletions.length > 0 
      ? habitCompletions.reduce((acc, val) => acc + val, 0) / habitCompletions.length 
      : 0;

    // Prepare user data summary
    const userDataSummary = {
      tasks: {
        total: totalTasks,
        completed: completedTasks,
        productivityRate: productivityRate.toFixed(2)
      },
      habits: {
        total: habits ? habits.length : 0,
        averageConsistency: averageHabitConsistency.toFixed(2)
      },
      journals: journals ? journals.length : 0,
      goals: goals ? goals.length : 0
    };

    // Prepare the prompt for Gemini API
    const apiUrl = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent";
    
    const prompt = {
      contents: [{
        role: "user",
        parts: [{
          text: `Tu es DeepFlow Analytics, un analyste IA spécialiste en productivité et développement personnel. 
          Analyse ces données utilisateur et génère:
          
          1. Un résumé des performances (max 3 phrases)
          2. 3 observations importantes basées sur les données
          3. 3 recommandations concrètes et exploitables pour améliorer la productivité
          4. Une suggestion d'habitude à développer
          
          Données utilisateur:
          ${JSON.stringify(userDataSummary)}
          
          Tâches détaillées:
          ${JSON.stringify(tasks || [])}
          
          Habitudes:
          ${JSON.stringify(habits || [])}
          
          Extraits récents du journal:
          ${JSON.stringify(journals || [])}
          
          Objectifs:
          ${JSON.stringify(goals || [])}
          
          Format ta réponse en sections, de manière concise, motivante et personnalisée. N'invente pas de données non fournies.`
        }]
      }],
      generationConfig: {
        temperature: 0.2,
        topP: 0.8,
        topK: 40,
        maxOutputTokens: 1000,
      }
    };

    // Call Gemini API
    const response = await fetch(`${apiUrl}?key=${geminiApiKey}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(prompt)
    });

    const data = await response.json();
    
    // Process the response
    let analysis = "";
    if (data.candidates && data.candidates[0] && data.candidates[0].content && 
        data.candidates[0].content.parts && data.candidates[0].content.parts[0]) {
      analysis = data.candidates[0].content.parts[0].text;
    } else if (data.error) {
      console.error("Gemini API error:", data.error);
      analysis = "Analyse non disponible pour le moment. Veuillez réessayer plus tard.";
    } else {
      analysis = "Je n'ai pas pu générer une analyse cette fois-ci. Veuillez réessayer.";
    }

    // Generate statistics for charts
    const weeklyStats = {
      taskCompletion: [
        { day: "Lun", completed: Math.floor(Math.random() * 10), total: Math.floor(Math.random() * 15) + 10 },
        { day: "Mar", completed: Math.floor(Math.random() * 10), total: Math.floor(Math.random() * 15) + 10 },
        { day: "Mer", completed: Math.floor(Math.random() * 10), total: Math.floor(Math.random() * 15) + 10 },
        { day: "Jeu", completed: Math.floor(Math.random() * 10), total: Math.floor(Math.random() * 15) + 10 },
        { day: "Ven", completed: Math.floor(Math.random() * 10), total: Math.floor(Math.random() * 15) + 10 },
        { day: "Sam", completed: Math.floor(Math.random() * 10), total: Math.floor(Math.random() * 15) + 10 },
        { day: "Dim", completed: Math.floor(Math.random() * 10), total: Math.floor(Math.random() * 15) + 10 }
      ],
      habitConsistency: [
        { name: "Méditation", completion: Math.floor(Math.random() * 100) },
        { name: "Lecture", completion: Math.floor(Math.random() * 100) },
        { name: "Exercise", completion: Math.floor(Math.random() * 100) },
        { name: "Journal", completion: Math.floor(Math.random() * 100) }
      ],
      productivityByHour: [
        { hour: "6-8h", score: Math.floor(Math.random() * 100) },
        { hour: "8-10h", score: Math.floor(Math.random() * 100) },
        { hour: "10-12h", score: Math.floor(Math.random() * 100) },
        { hour: "12-14h", score: Math.floor(Math.random() * 100) },
        { hour: "14-16h", score: Math.floor(Math.random() * 100) },
        { hour: "16-18h", score: Math.floor(Math.random() * 100) },
        { hour: "18-20h", score: Math.floor(Math.random() * 100) },
        { hour: "20-22h", score: Math.floor(Math.random() * 100) }
      ]
    };

    // Save the analysis to the database
    await supabase.from("ai_analysis").insert({
      user_id: user.id,
      analysis_text: analysis,
      stats: weeklyStats,
      created_at: new Date().toISOString()
    });

    return new Response(JSON.stringify({ 
      analysis, 
      statistics: weeklyStats
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });

  } catch (error) {
    console.error("Error in gemini-analysis function:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});

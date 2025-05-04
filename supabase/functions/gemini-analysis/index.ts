
// Follow this setup guide to integrate the Deno runtime and Gemini into your Supabase project:
// https://supabase.com/docs/guides/functions/ai/google-ai?utm_source=create-supabase-app
import { serve } from "https://deno.land/std@0.186.0/http/server.ts";
import { GoogleGenerativeAI } from "npm:@google/generative-ai@^0.2.0";
import { createClient } from "npm:@supabase/supabase-js@2";

// Initialize Google Generative AI with your API key
const genAI = new GoogleGenerativeAI(Deno.env.get("GEMINI_API_KEY") || "");

// Set up the model configuration - Using gemini-pro instead of flash since it's more widely available
const modelName = "gemini-pro";
const model = genAI.getGenerativeModel({ model: modelName });

// Initialize Supabase client
const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Define CORS headers for browser access
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userId } = await req.json();
    
    if (!userId) {
      return new Response(
        JSON.stringify({ error: "User ID is required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Gather user data for analysis
    const [tasksResult, habitsResult, journalResult, goalsResult, focusResult] = await Promise.all([
      supabase.from('tasks').select('*').eq('user_id', userId),
      supabase.from('habits').select('*').eq('user_id', userId),
      supabase.from('journal_entries').select('*').eq('user_id', userId).limit(20),
      supabase.from('goals').select('*').eq('user_id', userId),
      supabase.from('focus_sessions').select('*').eq('user_id', userId).limit(50)
    ]);
    
    const tasks = tasksResult.data || [];
    const habits = habitsResult.data || [];
    const journalEntries = journalResult.data || [];
    const goals = goalsResult.data || [];
    const focusSessions = focusResult.data || [];

    // Prepare data summary for the AI
    const completedTasks = tasks.filter(task => task.completed).length;
    const pendingTasks = tasks.length - completedTasks;
    
    const completedGoals = goals.filter(goal => goal.completed).length;
    const inProgressGoals = goals.length - completedGoals;
    
    const totalFocusTime = focusSessions.reduce((sum, session) => sum + (session.duration || 0), 0);
    const averageFocusSessionLength = focusSessions.length > 0 ? totalFocusTime / focusSessions.length : 0;
    
    // Format data for the AI prompt
    const dataSummary = `
    User Activity Summary:
    - Tasks: ${tasks.length} total, ${completedTasks} completed, ${pendingTasks} pending
    - Habits: ${habits.length} being tracked
    - Goals: ${goals.length} total, ${completedGoals} completed, ${inProgressGoals} in progress
    - Focus: ${focusSessions.length} sessions, ${Math.round(totalFocusTime / 60)} minutes total, ${Math.round(averageFocusSessionLength / 60)} minutes average
    - Journal: ${journalEntries.length} entries
    `;

    // Define the prompt for analysis
    const prompt = `
    As DeepFlow AI, analyze this user's data and provide personalized insights and recommendations:
    
    ${dataSummary}
    
    Please provide:
    1. A brief productivity analysis
    2. Three specific recommendations for improvement
    3. A motivational insight based on their patterns
    
    Format your response in clear sections with bullet points for easy readability.
    `;

    console.log("Sending request to Gemini API with model:", modelName);

    // Generate analysis from Gemini
    const result = await model.generateContent(prompt);
    const response = result.response.text();

    console.log("Received response from Gemini API");

    // Return the analysis
    return new Response(
      JSON.stringify({
        analysis: response,
        stats: {
          tasks: { total: tasks.length, completed: completedTasks, pending: pendingTasks },
          habits: { total: habits.length },
          goals: { total: goals.length, completed: completedGoals, inProgress: inProgressGoals },
          focus: { sessions: focusSessions.length, totalMinutes: Math.round(totalFocusTime / 60) }
        }
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in gemini-analysis function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

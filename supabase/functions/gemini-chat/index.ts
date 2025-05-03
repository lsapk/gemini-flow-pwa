
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
    const { message, chatHistory } = await req.json();

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

    // Fetch user data for context
    const { data: tasks } = await supabase.from("tasks").select().eq("user_id", user.id).limit(5);
    const { data: habits } = await supabase.from("habits").select().eq("user_id", user.id).limit(5);
    const { data: journals } = await supabase.from("journal_entries").select().eq("user_id", user.id).limit(3);

    // Prepare context from user data
    const userContext = `
      User tasks: ${JSON.stringify(tasks || [])}
      User habits: ${JSON.stringify(habits || [])}
      Recent journal entries: ${JSON.stringify(journals || [])}
    `;

    // Prepare the messages for Gemini API
    const apiUrl = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent";
    
    // Format the messages for Gemini
    const promptHistory = chatHistory.map((chat: any) => ({
      role: chat.role,
      parts: [{ text: chat.content }]
    }));

    const prompt = {
      contents: [
        {
          role: "user",
          parts: [{ text: "You are DeepFlow AI Assistant, a helpful productivity coach and mental wellness companion. Be empathetic, motivational but concise. Your purpose is to help users achieve their goals and improve their routines. You have access to user's data like tasks, habits and journal entries. USE THIS CONTEXT:" + userContext }]
        },
        ...promptHistory,
        {
          role: "user",
          parts: [{ text: message }]
        }
      ],
      generationConfig: {
        temperature: 0.7,
        topP: 0.8,
        topK: 40,
        maxOutputTokens: 800,
      },
      safetySettings: [
        {
          category: "HARM_CATEGORY_HARASSMENT",
          threshold: "BLOCK_MEDIUM_AND_ABOVE"
        },
        {
          category: "HARM_CATEGORY_HATE_SPEECH",
          threshold: "BLOCK_MEDIUM_AND_ABOVE"
        },
        {
          category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
          threshold: "BLOCK_MEDIUM_AND_ABOVE"
        },
        {
          category: "HARM_CATEGORY_DANGEROUS_CONTENT",
          threshold: "BLOCK_MEDIUM_AND_ABOVE"
        }
      ]
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
    let aiResponse = "";
    if (data.candidates && data.candidates[0] && data.candidates[0].content && 
        data.candidates[0].content.parts && data.candidates[0].content.parts[0]) {
      aiResponse = data.candidates[0].content.parts[0].text;
    } else if (data.error) {
      console.error("Gemini API error:", data.error);
      aiResponse = "Je suis désolé, j'ai rencontré une erreur. Veuillez réessayer plus tard.";
    } else {
      aiResponse = "Je suis désolé, je n'ai pas pu générer de réponse cette fois. Veuillez réessayer.";
    }

    // Save the conversation to the database
    await supabase.from("ai_conversations").insert({
      user_id: user.id,
      user_message: message,
      ai_response: aiResponse,
      created_at: new Date().toISOString()
    });

    return new Response(JSON.stringify({ response: aiResponse }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("Error in gemini-chat function:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});

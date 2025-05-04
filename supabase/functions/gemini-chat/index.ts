
// Follow this setup guide to integrate the Deno runtime and Gemini into your Supabase project:
// https://supabase.com/docs/guides/functions/ai/google-ai?utm_source=create-supabase-app
import { serve } from "https://deno.land/std@0.186.0/http/server.ts";
import { GoogleGenerativeAI } from "npm:@google/generative-ai@^0.2.0";

// Initialize Google Generative AI with your API key
const genAI = new GoogleGenerativeAI(Deno.env.get("GEMINI_API_KEY") || "");

// Set up the model configuration - Using gemini-pro instead of flash
const modelName = "gemini-pro";
const model = genAI.getGenerativeModel({ model: modelName });

// Define CORS headers for browser access
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// System prompt for the AI assistant
const systemPrompt = `
You are DeepFlow AI, a supportive and insightful personal assistant focused on productivity, 
mindfulness, and personal development. Your goal is to help users enhance their daily routines, 
develop better habits, achieve their goals, and maintain focus.

Key aspects of your personality:
- Supportive and encouraging, but not overly enthusiastic
- Professional yet warm
- Concise and practical in your advice
- Data-driven when relevant
- Respectful of the user's time and priorities

Always respond in the same language that the user is using.
Provide concrete, actionable advice rather than vague motivational statements.
`;

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, chatHistory = [] } = await req.json();

    console.log("Processing chat request with model:", modelName);

    // Prepare the chat history for Gemini
    const formattedHistory = chatHistory.map((msg: any) => ({
      role: msg.role,
      parts: [{ text: msg.content }],
    }));

    // Start a chat session
    const chat = model.startChat({
      history: formattedHistory,
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 1024,
      },
      safetySettings: [
        {
          category: "HARM_CATEGORY_HARASSMENT",
          threshold: "BLOCK_MEDIUM_AND_ABOVE",
        },
        {
          category: "HARM_CATEGORY_HATE_SPEECH",
          threshold: "BLOCK_MEDIUM_AND_ABOVE",
        },
        {
          category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
          threshold: "BLOCK_MEDIUM_AND_ABOVE",
        },
        {
          category: "HARM_CATEGORY_DANGEROUS_CONTENT",
          threshold: "BLOCK_MEDIUM_AND_ABOVE",
        },
      ],
    });

    // Generate a response
    const result = await chat.sendMessage(message);
    const response = result.response.text();

    console.log("Received response from Gemini chat API");

    // Return the AI response
    return new Response(
      JSON.stringify({
        response,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in gemini-chat function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

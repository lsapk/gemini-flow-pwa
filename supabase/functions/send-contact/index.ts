
import { serve } from "https://deno.land/std@0.186.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ContactRequest {
  name: string;
  email: string;
  message: string;
  website?: string; // honeypot field
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_NAME_LENGTH = 100;
const MAX_EMAIL_LENGTH = 255;
const MAX_MESSAGE_LENGTH = 10000;

// Simple in-memory rate limiter (per edge function instance)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_MAX = 5;
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return false;
  }
  entry.count++;
  return entry.count > RATE_LIMIT_MAX;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Rate limit by IP
    const clientIP = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() 
      || req.headers.get("cf-connecting-ip") 
      || "unknown";

    if (isRateLimited(clientIP)) {
      return new Response(
        JSON.stringify({ error: "Too many requests. Please try again later." }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { name, email, message, website } = await req.json() as ContactRequest;

    // Honeypot: if the hidden "website" field is filled, it's a bot
    if (website && website.trim().length > 0) {
      // Silently accept to not tip off bots
      return new Response(
        JSON.stringify({ success: true, message: "Your message has been sent to DeepFlow.ia@gmail.com" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    if (!name || !email || !message) {
      return new Response(
        JSON.stringify({ error: "Name, email, and message are required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (typeof name !== 'string' || typeof email !== 'string' || typeof message !== 'string') {
      return new Response(
        JSON.stringify({ error: "Invalid input types" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const trimmedName = name.trim();
    const trimmedEmail = email.trim();
    const trimmedMessage = message.trim();

    if (!EMAIL_REGEX.test(trimmedEmail)) {
      return new Response(
        JSON.stringify({ error: "Invalid email format" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (trimmedName.length > MAX_NAME_LENGTH || trimmedEmail.length > MAX_EMAIL_LENGTH || trimmedMessage.length > MAX_MESSAGE_LENGTH) {
      return new Response(
        JSON.stringify({ error: "Input exceeds maximum length" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (trimmedName.length === 0 || trimmedEmail.length === 0 || trimmedMessage.length === 0) {
      return new Response(
        JSON.stringify({ error: "Name, email, and message cannot be empty" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    console.log(`Contact form submission received from: ${trimmedEmail.substring(0, 50)}`);
    
    return new Response(
      JSON.stringify({ 
        success: true,
        message: "Your message has been sent to DeepFlow.ia@gmail.com"
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in send-contact function:", (error as Error).message);
    return new Response(
      JSON.stringify({ error: "An error occurred processing your request" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

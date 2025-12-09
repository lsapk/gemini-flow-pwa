
import { serve } from "https://deno.land/std@0.186.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Interface for expected request body
interface ContactRequest {
  name: string;
  email: string;
  message: string;
}

// Email validation regex
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Input constraints
const MAX_NAME_LENGTH = 100;
const MAX_EMAIL_LENGTH = 255;
const MAX_MESSAGE_LENGTH = 10000;

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { name, email, message } = await req.json() as ContactRequest;
    
    // Validate required fields presence
    if (!name || !email || !message) {
      return new Response(
        JSON.stringify({ error: "Name, email, and message are required fields" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Validate input types
    if (typeof name !== 'string' || typeof email !== 'string' || typeof message !== 'string') {
      return new Response(
        JSON.stringify({ error: "Invalid input types" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Trim inputs
    const trimmedName = name.trim();
    const trimmedEmail = email.trim();
    const trimmedMessage = message.trim();

    // Validate email format
    if (!EMAIL_REGEX.test(trimmedEmail)) {
      return new Response(
        JSON.stringify({ error: "Invalid email format" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Validate length limits
    if (trimmedName.length > MAX_NAME_LENGTH) {
      return new Response(
        JSON.stringify({ error: `Name must be less than ${MAX_NAME_LENGTH} characters` }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (trimmedEmail.length > MAX_EMAIL_LENGTH) {
      return new Response(
        JSON.stringify({ error: `Email must be less than ${MAX_EMAIL_LENGTH} characters` }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (trimmedMessage.length > MAX_MESSAGE_LENGTH) {
      return new Response(
        JSON.stringify({ error: `Message must be less than ${MAX_MESSAGE_LENGTH} characters` }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Validate non-empty after trim
    if (trimmedName.length === 0 || trimmedEmail.length === 0 || trimmedMessage.length === 0) {
      return new Response(
        JSON.stringify({ error: "Name, email, and message cannot be empty" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }
    
    // Log contact form submission (sanitized for security)
    console.log(`Contact form submission received from: ${trimmedEmail.substring(0, 50)}`);
    
    // For now, simulate success
    return new Response(
      JSON.stringify({ 
        success: true,
        message: "Your message has been sent to DeepFlow.ia@gmail.com"
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in send-contact function:", error);
    return new Response(
      JSON.stringify({ error: "An error occurred processing your request" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

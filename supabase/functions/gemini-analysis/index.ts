
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { user_id, data } = await req.json()
    
    if (!user_id || !data) {
      throw new Error('Missing required parameters')
    }

    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY')
    if (!GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY not configured')
    }

    // Analyser les données avec Gemini
    const prompt = `En tant qu'expert en productivité, analyse ces données utilisateur et donne un score de productivité sur 100 ainsi que 3 conseils personnalisés concis.

Données:
- Habitudes: ${data.habits.total} totales, ${data.habits.active} actives, série moyenne: ${data.habits.avgStreak} jours
- Tâches: ${data.tasks.total} totales, ${data.tasks.completed} terminées (${data.tasks.completionRate}% de réussite)
- Objectifs: ${data.goals.total} totaux, progression moyenne: ${data.goals.avgProgress}%, ${data.goals.completed} terminés
- Journal: ${data.journal.entriesThisWeek} entrées cette semaine
- Focus: ${data.focus.totalMinutes} minutes, ${data.focus.sessions} sessions cette semaine

Réponds UNIQUEMENT en JSON dans ce format exact:
{
  "score": nombre_entre_0_et_100,
  "insights": [
    "conseil 1 (max 80 caractères)",
    "conseil 2 (max 80 caractères)", 
    "conseil 3 (max 80 caractères)"
  ]
}`

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }]
        })
      }
    )

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status}`)
    }

    const result = await response.json()
    
    if (!result.candidates || !result.candidates[0] || !result.candidates[0].content) {
      throw new Error('Invalid response from Gemini API')
    }

    const content = result.candidates[0].content.parts[0].text
    
    try {
      const analysis = JSON.parse(content)
      
      // Validation des données
      if (typeof analysis.score !== 'number' || !Array.isArray(analysis.insights)) {
        throw new Error('Invalid analysis format')
      }

      // Assurer que le score est entre 0 et 100
      analysis.score = Math.max(0, Math.min(100, Math.round(analysis.score)))
      
      // Limiter à 3 insights maximum
      analysis.insights = analysis.insights.slice(0, 3)

      return new Response(
        JSON.stringify(analysis),
        { 
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json' 
          } 
        }
      )
    } catch (parseError) {
      console.error('Failed to parse Gemini response:', content)
      
      // Score de fallback basé sur les données
      const fallbackScore = Math.min(100, Math.round(
        (data.habits.avgStreak * 5) +
        (data.tasks.completionRate * 0.3) +
        (data.goals.avgProgress * 0.4) +
        (data.focus.totalMinutes * 0.1) +
        (data.journal.entriesThisWeek * 2)
      ))

      return new Response(
        JSON.stringify({
          score: fallbackScore,
          insights: [
            "Continuez vos bonnes habitudes !",
            "Fixez-vous des objectifs réalisables",
            "Prenez du temps pour vous concentrer"
          ]
        }),
        { 
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json' 
          } 
        }
      )
    }

  } catch (error) {
    console.error('Error in gemini-analysis function:', error)
    
    return new Response(
      JSON.stringify({ 
        error: error.message,
        score: 50,
        insights: ["Analyse temporairement indisponible"]
      }),
      { 
        status: 500,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    )
  }
})

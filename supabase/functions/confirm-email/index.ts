import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create Supabase admin client
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    const url = new URL(req.url)
    const token = url.searchParams.get('token')
    const userId = url.searchParams.get('user_id')
    
    // Get the site URL for redirects
    const siteUrl = Deno.env.get('SITE_URL') || 'http://localhost:5173'

    // Check if token or userId is missing
    if (!token && !userId) {
      return Response.redirect(`${siteUrl}/auth?verification_status=invalid_link`, 302)
    }

    // Use userId if provided, otherwise try to decode from token
    let targetUserId = userId
    
    if (!targetUserId && token) {
      // Simple token format: base64 encoded user ID (in real implementation, use proper JWT)
      try {
        targetUserId = atob(token)
      } catch {
        return Response.redirect(`${siteUrl}/auth?verification_status=invalid_token`, 302)
      }
    }

    // Validate that we have a user ID
    if (!targetUserId) {
      return Response.redirect(`${siteUrl}/auth?verification_status=missing_user_id`, 302)
    }

    // Update the user's email confirmation status
    const { data: user, error } = await supabaseAdmin.auth.admin.updateUserById(
      targetUserId,
      { 
        email_confirm: true,
        email_confirmed_at: new Date().toISOString()
      }
    )

    if (error) {
      console.error('Error confirming email:', error)
      return Response.redirect(`${siteUrl}/auth?verification_status=verification_failed`, 302)
    }

    // Success! Redirect to auth page with verified=true
    return Response.redirect(`${siteUrl}/auth?verified=true`, 302)

  } catch (error) {
    console.error('Edge function error:', error)
    return Response.redirect(`${Deno.env.get('SITE_URL') || 'http://localhost:5173'}/auth?verification_status=server_error`, 302)
  }
})
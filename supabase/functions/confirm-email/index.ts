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

    if (!token && !userId) {
      return new Response(
        `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Invalid Verification Link</title>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <style>
            body { font-family: Arial, sans-serif; text-align: center; padding: 50px; background: #0f0f23; color: white; }
            .container { max-width: 500px; margin: 0 auto; }
            .error { color: #ef4444; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1 class="error">Invalid Verification Link</h1>
            <p>The verification link is invalid or missing required parameters.</p>
            <a href="${Deno.env.get('SITE_URL') || 'http://localhost:5173'}/auth" 
               style="color: #a855f7; text-decoration: none;">Return to Sign In</a>
          </div>
        </body>
        </html>
        `,
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'text/html' } 
        }
      )
    }

    // Use userId if provided, otherwise try to decode from token
    let targetUserId = userId
    
    if (!targetUserId && token) {
      // Simple token format: base64 encoded user ID (in real implementation, use proper JWT)
      try {
        targetUserId = atob(token)
      } catch {
        return new Response(
          `
          <!DOCTYPE html>
          <html>
          <head>
            <title>Invalid Token</title>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <style>
              body { font-family: Arial, sans-serif; text-align: center; padding: 50px; background: #0f0f23; color: white; }
              .container { max-width: 500px; margin: 0 auto; }
              .error { color: #ef4444; }
            </style>
          </head>
          <body>
            <div class="container">
              <h1 class="error">Invalid Token</h1>
              <p>The verification token is malformed or expired.</p>
              <a href="${Deno.env.get('SITE_URL') || 'http://localhost:5173'}/auth" 
                 style="color: #a855f7; text-decoration: none;">Return to Sign In</a>
            </div>
          </body>
          </html>
          `,
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'text/html' } 
          }
        )
      }
    }

    // Update the user's email confirmation status
    const { data: user, error } = await supabaseAdmin.auth.admin.updateUserById(
      targetUserId!,
      { 
        email_confirm: true,
        email_confirmed_at: new Date().toISOString()
      }
    )

    if (error) {
      console.error('Error confirming email:', error)
      return new Response(
        `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Verification Failed</title>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <style>
            body { font-family: Arial, sans-serif; text-align: center; padding: 50px; background: #0f0f23; color: white; }
            .container { max-width: 500px; margin: 0 auto; }
            .error { color: #ef4444; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1 class="error">Verification Failed</h1>
            <p>Unable to verify your email address. The link may be expired or invalid.</p>
            <a href="${Deno.env.get('SITE_URL') || 'http://localhost:5173'}/auth" 
               style="color: #a855f7; text-decoration: none;">Return to Sign In</a>
          </div>
        </body>
        </html>
        `,
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'text/html' } 
        }
      )
    }

    // Redirect to success page
    const siteUrl = Deno.env.get('SITE_URL') || 'http://localhost:5173'
    
    return new Response(
      `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Email Verified Successfully</title>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style>
          body { 
            font-family: Arial, sans-serif; 
            text-align: center; 
            padding: 50px; 
            background: linear-gradient(135deg, #0f0f23 0%, #1e1b4b 50%, #0f0f23 100%);
            color: white; 
            margin: 0;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .container { 
            max-width: 500px; 
            margin: 0 auto; 
            padding: 40px;
            background: rgba(0,0,0,0.2);
            border-radius: 16px;
            border: 1px solid rgba(255,255,255,0.1);
          }
          .success { color: #10b981; font-size: 48px; margin-bottom: 20px; }
          h1 { color: #10b981; margin-bottom: 20px; }
          p { color: #d1d5db; line-height: 1.6; margin-bottom: 30px; }
          .button {
            display: inline-block;
            padding: 12px 24px;
            background: linear-gradient(135deg, #8b5cf6, #ec4899);
            color: white;
            text-decoration: none;
            border-radius: 8px;
            font-weight: 600;
            transition: transform 0.2s;
          }
          .button:hover { transform: translateY(-2px); }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="success">✓</div>
          <h1>Email Verified Successfully!</h1>
          <p>Your email address has been verified. You can now sign in to your account and start sharing your love story.</p>
          <a href="${siteUrl}/auth?verified=true" class="button">Sign In to Your Account</a>
        </div>
        <script>
          // Auto-redirect after 5 seconds
          setTimeout(() => {
            window.location.href = '${siteUrl}/auth?verified=true';
          }, 5000);
        </script>
      </body>
      </html>
      `,
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'text/html' } 
      }
    )

  } catch (error) {
    console.error('Edge function error:', error)
    return new Response(
      `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Server Error</title>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style>
          body { font-family: Arial, sans-serif; text-align: center; padding: 50px; background: #0f0f23; color: white; }
          .container { max-width: 500px; margin: 0 auto; }
          .error { color: #ef4444; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1 class="error">Server Error</h1>
          <p>An unexpected error occurred while processing your request.</p>
          <a href="${Deno.env.get('SITE_URL') || 'http://localhost:5173'}/auth" 
             style="color: #a855f7; text-decoration: none;">Return to Sign In</a>
        </div>
      </body>
      </html>
      `,
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'text/html' } 
      }
    )
  }
})
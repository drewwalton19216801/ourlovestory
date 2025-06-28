import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

interface SendInvitationRequest {
  inviteeEmail: string;
  personalMessage?: string;
}

// Generate invitation email HTML
function generateInvitationEmail(data: {
  inviterName: string;
  inviteeEmail: string;
  personalMessage?: string;
  appUrl: string;
  siteName?: string;
}): string {
  const siteName = data.siteName || 'Our Love Story';
  
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>You're Invited to Join ${siteName}!</title>
      <style>
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          line-height: 1.6;
          color: #333;
          background-color: #f8fafc;
          margin: 0;
          padding: 0;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          background: white;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        .header {
          background: linear-gradient(135deg, #8b5cf6, #ec4899);
          color: white;
          padding: 40px 30px;
          text-align: center;
        }
        .header h1 {
          margin: 0;
          font-size: 28px;
          font-weight: 600;
        }
        .content {
          padding: 40px 30px;
        }
        .greeting {
          font-size: 18px;
          margin-bottom: 20px;
          color: #1f2937;
        }
        .message {
          color: #4b5563;
          margin-bottom: 30px;
          line-height: 1.7;
        }
        .invitation-box {
          background: linear-gradient(135deg, #f3e8ff, #fce7f3);
          border: 1px solid #d8b4fe;
          border-radius: 12px;
          padding: 24px;
          margin: 30px 0;
          text-align: center;
        }
        .invitation-box .inviter {
          font-size: 24px;
          font-weight: 600;
          color: #7c3aed;
          margin-bottom: 8px;
        }
        .invitation-box .invite-text {
          color: #be185d;
          font-weight: 500;
        }
        .personal-message {
          background: #fef3c7;
          border: 1px solid #fbbf24;
          border-radius: 8px;
          padding: 20px;
          margin: 30px 0;
          font-style: italic;
          color: #78350f;
        }
        .personal-message h3 {
          margin: 0 0 10px 0;
          color: #92400e;
          font-style: normal;
          font-size: 16px;
        }
        .button-container {
          text-align: center;
          margin: 40px 0;
        }
        .action-button {
          display: inline-block;
          background: linear-gradient(135deg, #8b5cf6, #ec4899);
          color: #ffffff !important;
          text-decoration: none;
          padding: 16px 32px;
          border-radius: 8px;
          font-weight: 600;
          font-size: 16px;
          transition: transform 0.2s ease;
          border: none;
          mso-line-height-rule: exactly;
        }
        .action-button:hover {
          transform: translateY(-2px);
          color: #ffffff !important;
        }
        .action-button:visited {
          color: #ffffff !important;
        }
        .action-button:active {
          color: #ffffff !important;
        }
        .features-section {
          background: #f0f9ff;
          border: 1px solid #bae6fd;
          border-radius: 8px;
          padding: 20px;
          margin: 30px 0;
        }
        .features-section h3 {
          margin: 0 0 15px 0;
          color: #0369a1;
          font-size: 16px;
        }
        .features-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 15px;
          margin-top: 15px;
        }
        .feature-item {
          color: #0c4a6e;
          font-size: 14px;
        }
        .footer {
          background: #f9fafb;
          padding: 30px;
          text-align: center;
          border-top: 1px solid #e5e7eb;
        }
        .footer p {
          margin: 0;
          color: #6b7280;
          font-size: 14px;
        }
        .footer .social-links {
          margin-top: 20px;
        }
        .footer .social-links a {
          color: #8b5cf6;
          text-decoration: none;
          margin: 0 10px;
        }
        .heart {
          color: #ec4899;
          font-size: 20px;
        }
        .unsubscribe {
          margin-top: 20px;
          font-size: 12px;
          color: #9ca3af;
        }
        .unsubscribe a {
          color: #6b7280;
        }
        @media (max-width: 600px) {
          .features-grid {
            grid-template-columns: 1fr;
          }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1><span class="heart">💕</span> You're Invited!</h1>
        </div>
        
        <div class="content">
          <div class="greeting">Hello!</div>
          
          <div class="invitation-box">
            <div class="inviter">${data.inviterName}</div>
            <div class="invite-text">has invited you to join ${siteName}</div>
          </div>
          
          ${data.personalMessage ? `
          <div class="personal-message">
            <h3>Personal Message:</h3>
            <p>"${data.personalMessage}"</p>
          </div>
          ` : ''}
          
          <div class="message">
            <p>${siteName} is a beautiful platform where couples and families can create and share their love stories together. Join us to:</p>
          </div>
          
          <div class="features-section">
            <h3>🌟 What you can do on ${siteName}:</h3>
            <div class="features-grid">
              <div class="feature-item">📸 Share precious memories</div>
              <div class="feature-item">📅 Create timeline stories</div>
              <div class="feature-item">💕 Connect with loved ones</div>
              <div class="feature-item">💬 Comment and react to posts</div>
              <div class="feature-item">🔒 Private & secure sharing</div>
              <div class="feature-item">🎉 Celebrate milestones together</div>
            </div>
          </div>
          
          <div class="button-container">
            <a href="${data.appUrl}" class="action-button" style="color: #ffffff !important; text-decoration: none;">
              Join ${siteName} Now
            </a>
          </div>
          
          <div class="message">
            <p><strong>Getting started is easy:</strong></p>
            <ol>
              <li>Click the button above to visit ${siteName}</li>
              <li>Create your free account</li>
              <li>Start sharing your own memories</li>
              <li>Connect with ${data.inviterName} and others</li>
            </ol>
            
            <p>Join thousands of couples and families who are already creating beautiful digital scrapbooks of their most precious moments.</p>
          </div>
        </div>
        
        <div class="footer">
          <p>You received this invitation because ${data.inviterName} thought you'd enjoy ${siteName}.</p>
          <p>If you're not interested, you can safely ignore this email.</p>
          
          <div class="social-links">
            <a href="#">Privacy Policy</a> |
            <a href="#">Terms of Service</a> |
            <a href="#">Support</a>
          </div>
          
          <div class="unsubscribe">
            <p>This is a one-time invitation. You will not receive further emails unless you create an account.</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create Supabase client
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

    // Get the authenticated user from the request
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authorization header required' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Extract token from Bearer header
    const token = authHeader.replace('Bearer ', '')
    
    // Verify the user
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token)
    
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid or expired token' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const { inviteeEmail, personalMessage }: SendInvitationRequest = await req.json()

    if (!inviteeEmail) {
      return new Response(
        JSON.stringify({ error: 'Invitee email is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Validate email format
    const emailRegex = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;
    if (!emailRegex.test(inviteeEmail)) {
      return new Response(
        JSON.stringify({ error: 'Invalid email address format' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Get the inviter's profile information
    const { data: inviterProfile, error: profileError } = await supabaseAdmin
      .from('user_profiles')
      .select('display_name')
      .eq('id', user.id)
      .single()

    if (profileError) {
      console.error('Error fetching inviter profile:', profileError)
      return new Response(
        JSON.stringify({ error: 'Could not fetch user profile' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const inviterName = inviterProfile?.display_name || user.email || 'Someone'
    const appUrl = Deno.env.get('SITE_URL') || 'https://ourlovestory.online'
    const siteName = 'Our Love Story'

    // Generate the invitation email HTML
    const emailHtml = generateInvitationEmail({
      inviterName,
      inviteeEmail,
      personalMessage,
      appUrl,
      siteName
    })

    // Send the email using the send-email-resend function
    const emailApiUrl = `${Deno.env.get('SUPABASE_URL')}/functions/v1/send-email-resend`
    
    const emailResponse = await fetch(emailApiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: inviteeEmail,
        subject: `${inviterName} invited you to join ${siteName}`,
        html: emailHtml
      }),
    })

    const emailResult = await emailResponse.json()

    if (!emailResponse.ok) {
      console.error('Failed to send invitation email:', emailResult)
      return new Response(
        JSON.stringify({ 
          error: 'Failed to send invitation email',
          details: emailResult.error 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Invitation sent successfully',
        inviteeEmail,
        messageId: emailResult.messageId 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Edge function error:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
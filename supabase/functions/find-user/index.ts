import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

interface FindUserRequest {
  email: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create Supabase client with service role key for admin operations
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

    const { email }: FindUserRequest = await req.json()

    if (!email) {
      return new Response(
        JSON.stringify({ error: 'Email is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // First try to find user in user_profiles by display_name (case-insensitive)
    const { data: profiles, error: profileError } = await supabaseAdmin
      .from('user_profiles')
      .select('id, display_name')
      .ilike('display_name', email)
      .limit(1)

    if (profileError) {
      console.error('Profile search error:', profileError)
    }

    if (profiles && profiles.length > 0) {
      return new Response(
        JSON.stringify({ 
          user: {
            id: profiles[0].id,
            display_name: profiles[0].display_name
          }
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // If not found in profiles, search auth users by email
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.listUsers()

    if (authError) {
      console.error('Auth user search error:', authError)
      return new Response(
        JSON.stringify({ error: 'Failed to search users' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const foundUser = authData.users.find(u => 
      u.email?.toLowerCase() === email.toLowerCase()
    )

    if (!foundUser) {
      return new Response(
        JSON.stringify({ error: 'User not found' }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Check if user has a profile
    const { data: userProfile, error: userProfileError } = await supabaseAdmin
      .from('user_profiles')
      .select('id, display_name')
      .eq('id', foundUser.id)
      .single()

    if (userProfileError || !userProfile) {
      return new Response(
        JSON.stringify({ error: 'User has not completed profile setup' }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    return new Response(
      JSON.stringify({ 
        user: {
          id: userProfile.id,
          display_name: userProfile.display_name || foundUser.email
        }
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Edge function error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
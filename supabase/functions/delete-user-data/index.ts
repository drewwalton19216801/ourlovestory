import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'DELETE, OPTIONS',
}

// Helper function to extract storage path from public URL
function extractStoragePath(publicUrl: string): string | null {
  try {
    const url = new URL(publicUrl);
    const pathParts = url.pathname.split('/');
    const storageIndex = pathParts.findIndex(part => part === 'storage');
    
    if (storageIndex === -1) return null;
    
    // Get everything after /storage/v1/object/public/memory-images/
    const pathFromBucket = pathParts.slice(storageIndex + 5).join('/');
    return pathFromBucket;
  } catch {
    return null;
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'DELETE') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { 
        status: 405, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
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
    
    // Verify the user using admin client
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

    const userId = user.id;

    console.log(`Starting account deletion process for user: ${userId}`);

    // Step 1: Get all memory images for this user
    const { data: memories, error: memoriesError } = await supabaseAdmin
      .from('memories')
      .select('images')
      .eq('author_id', userId);

    if (memoriesError) {
      console.error('Error fetching user memories:', memoriesError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch user data for deletion' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Step 2: Extract all image paths and delete from storage
    const allImageUrls = (memories || [])
      .flatMap(memory => memory.images || [])
      .filter(Boolean);

    if (allImageUrls.length > 0) {
      console.log(`Found ${allImageUrls.length} images to delete for user ${userId}`);
      
      const imagePaths = allImageUrls
        .map(url => extractStoragePath(url))
        .filter(path => path !== null) as string[];

      if (imagePaths.length > 0) {
        console.log(`Deleting ${imagePaths.length} images from storage`);
        
        const { error: storageError } = await supabaseAdmin.storage
          .from('memory-images')
          .remove(imagePaths);

        if (storageError) {
          console.error('Error deleting images from storage:', storageError);
          // Log the error but don't fail the whole process
          // The user deletion should continue even if some images fail to delete
        } else {
          console.log('Successfully deleted images from storage');
        }
      }
    }

    // Step 3: Delete the user from auth.users
    // This will trigger CASCADE DELETE for all related tables:
    // - user_profiles
    // - memories (and their associated reactions, comments, participants)
    // - relationships
    console.log(`Deleting user ${userId} from auth.users`);
    
    const { error: deleteUserError } = await supabaseAdmin.auth.admin.deleteUser(userId);

    if (deleteUserError) {
      console.error('Error deleting user:', deleteUserError);
      return new Response(
        JSON.stringify({ 
          error: 'Failed to delete user account',
          details: deleteUserError.message 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log(`Successfully deleted user ${userId} and all associated data`);

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'User account and all associated data deleted successfully'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Edge function error:', error);
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
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
}

// Helper function to truncate text
const truncateText = (text: string, maxLength: number = 160): string => {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3).trim() + '...';
};

// Helper function to get category display name
const getCategoryDisplayName = (category: string): string => {
  const categoryLabels: Record<string, string> = {
    first_date: 'First Date',
    anniversary: 'Anniversary',
    proposal: 'Proposal', 
    wedding: 'Wedding',
    vacation: 'Vacation',
    milestone: 'Milestone',
    special_moment: 'Special Moment',
    everyday_joy: 'Everyday Joy',
  };
  return categoryLabels[category] || category;
};

// Generate HTML with proper meta tags for a memory
const generateMemoryHTML = (memory: any, siteUrl: string) => {
  const categoryName = getCategoryDisplayName(memory.category);
  const memoryDate = new Date(memory.created_at).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  
  // Enhanced description
  let enhancedDescription = truncateText(memory.description, 140);
  if (memory.location) {
    enhancedDescription += ` • ${memory.location}`;
  }
  enhancedDescription += ` • ${categoryName} from ${memoryDate}`;
  enhancedDescription = truncateText(enhancedDescription, 160);

  // Enhanced title
  const pageTitle = `${memory.title} - ${categoryName} by ${memory.author_name} | Our Love Story`;
  
  // Image handling
  const primaryImage = memory.images && memory.images.length > 0 
    ? memory.images[0] 
    : 'https://images.pexels.com/photos/1024960/pexels-photo-1024960.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1';

  const memoryUrl = `${siteUrl}/memory/${memory.id}`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${pageTitle}</title>
  <meta name="description" content="${enhancedDescription}">
  <meta name="keywords" content="${categoryName.toLowerCase()}, memories, relationships, ${memory.location || 'special moments'}, ${memory.author_name}">
  <meta name="author" content="${memory.author_name}">
  <meta name="robots" content="${memory.is_public ? 'index, follow' : 'noindex, nofollow'}">
  
  <!-- OpenGraph tags -->
  <meta property="og:title" content="${memory.title}" />
  <meta property="og:description" content="${enhancedDescription}" />
  <meta property="og:image" content="${primaryImage}" />
  <meta property="og:image:width" content="1260" />
  <meta property="og:image:height" content="750" />
  <meta property="og:image:alt" content="${memory.title} - ${categoryName} memory shared by ${memory.author_name}" />
  <meta property="og:url" content="${memoryUrl}" />
  <meta property="og:type" content="article" />
  <meta property="og:site_name" content="Our Love Story" />
  <meta property="og:locale" content="en_US" />
  
  <!-- Twitter Card tags -->
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${memory.title}" />
  <meta name="twitter:description" content="${enhancedDescription}" />
  <meta name="twitter:image" content="${primaryImage}" />
  <meta name="twitter:image:alt" content="${memory.title} - ${categoryName} memory" />
  
  <!-- Article tags -->
  <meta property="article:author" content="${memory.author_name}" />
  <meta property="article:published_time" content="${memory.created_at}" />
  <meta property="article:modified_time" content="${memory.updated_at || memory.created_at}" />
  <meta property="article:section" content="Memories" />
  <meta property="article:tag" content="${categoryName}" />
  ${memory.location ? `<meta property="article:tag" content="${memory.location}" />` : ''}
  <meta property="article:tag" content="memories" />
  <meta property="article:tag" content="relationships" />
  
  <!-- Additional images -->
  ${memory.images && memory.images.length > 1 ? 
    memory.images.slice(1, 4).map((img: string) => `<meta property="og:image" content="${img}" />`).join('\n  ') 
    : ''
  }
  
  <!-- Structured Data -->
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": "${memory.title}",
    "description": "${enhancedDescription}",
    "image": ${JSON.stringify(memory.images && memory.images.length > 0 ? memory.images : [primaryImage])},
    "author": {
      "@type": "Person",
      "name": "${memory.author_name}",
      "url": "${siteUrl}/profile/${memory.author_id}"
    },
    "publisher": {
      "@type": "Organization",
      "name": "Our Love Story",
      "logo": {
        "@type": "ImageObject",
        "url": "${siteUrl}/vite.svg"
      }
    },
    "datePublished": "${memory.created_at}",
    "dateModified": "${memory.updated_at || memory.created_at}",
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": "${memoryUrl}"
    },
    "url": "${memoryUrl}",
    "articleSection": "Memories",
    "keywords": "${categoryName}, ${memory.location || ''}, memories, relationships".replace(/, ,/g, ',').replace(/^,|,$/g, ''),
    "about": {
      "@type": "Thing",
      "name": "${categoryName}"
    }
  }
  </script>
  
  <!-- Redirect to main app after a brief delay -->
  <meta http-equiv="refresh" content="2;url=${memoryUrl}">
  
  <style>
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      background: linear-gradient(135deg, #1f2937, #7c3aed, #ec4899, #1f2937);
      color: white;
      text-align: center;
      padding: 2rem;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
    }
    .container { max-width: 600px; }
    .memory-card {
      background: rgba(0, 0, 0, 0.2);
      backdrop-filter: blur(10px);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 16px;
      padding: 2rem;
      margin-bottom: 2rem;
    }
    .title { font-size: 2rem; font-weight: bold; margin-bottom: 1rem; }
    .description { font-size: 1.1rem; line-height: 1.6; margin-bottom: 1rem; opacity: 0.9; }
    .meta { font-size: 0.9rem; opacity: 0.7; margin-bottom: 1rem; }
    .redirect-note { font-size: 0.8rem; opacity: 0.6; }
    .heart { color: #ec4899; }
  </style>
</head>
<body>
  <div class="container">
    <div class="memory-card">
      <div class="title">${memory.title}</div>
      <div class="description">${memory.description}</div>
      <div class="meta">
        <span class="heart">❤</span> ${categoryName} by ${memory.author_name}
        ${memory.location ? ` • ${memory.location}` : ''} • ${memoryDate}
      </div>
      ${memory.images && memory.images.length > 0 ? 
        `<img src="${memory.images[0]}" alt="${memory.title}" style="max-width: 100%; height: auto; border-radius: 8px; margin: 1rem 0;" />` 
        : ''
      }
    </div>
    <div class="redirect-note">
      Redirecting to Our Love Story... If you're not redirected, <a href="${memoryUrl}" style="color: #a855f7;">click here</a>.
    </div>
  </div>
</body>
</html>`;
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const url = new URL(req.url);
    const memoryId = url.searchParams.get('id');
    
    if (!memoryId) {
      return new Response('Memory ID is required', { 
        status: 400, 
        headers: corsHeaders 
      });
    }

    // Create Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Fetch the memory
    const { data: memory, error } = await supabase
      .from('memories')
      .select(`
        *,
        participants:memory_participants(*)
      `)
      .eq('id', memoryId)
      .single();

    if (error) {
      console.error('Error fetching memory:', error);
      return new Response('Memory not found', { 
        status: 404, 
        headers: corsHeaders 
      });
    }

    if (!memory) {
      return new Response('Memory not found', { 
        status: 404, 
        headers: corsHeaders 
      });
    }

    // Check if memory is public (private memories require authentication)
    if (!memory.is_public) {
      return new Response('Memory is private', { 
        status: 403, 
        headers: corsHeaders 
      });
    }

    const siteUrl = Deno.env.get('SITE_URL') || 'https://ourlovestory.online';
    const html = generateMemoryHTML(memory, siteUrl);

    return new Response(html, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
      },
    });

  } catch (error) {
    console.error('Edge function error:', error);
    return new Response('Internal server error', { 
      status: 500, 
      headers: corsHeaders 
    });
  }
});
// Meta tag utilities for dynamic OpenGraph updates
export interface MetaTagData {
  title: string;
  description: string;
  image?: string;
  url?: string;
  type?: string;
  author?: string;
  publishedTime?: string;
  modifiedTime?: string;
  section?: string;
  tags?: string[];
}

// Helper function to truncate text for meta descriptions
export const truncateText = (text: string, maxLength: number = 160): string => {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3).trim() + '...';
};

// Helper function to get category display name
export const getCategoryDisplayName = (category: string): string => {
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

// Update or create meta tag
export const updateMetaTag = (property: string, content: string, isProperty = true) => {
  if (typeof document === 'undefined') return; // SSR safety
  
  const attribute = isProperty ? 'property' : 'name';
  let meta = document.querySelector(`meta[${attribute}="${property}"]`);
  
  if (meta) {
    meta.setAttribute('content', content);
  } else {
    meta = document.createElement('meta');
    meta.setAttribute(attribute, property);
    meta.setAttribute('content', content);
    document.head.appendChild(meta);
  }
};

// Remove meta tags with specific attributes
export const removeMetaTags = (properties: string[], isProperty = true) => {
  if (typeof document === 'undefined') return;
  
  const attribute = isProperty ? 'property' : 'name';
  properties.forEach(prop => {
    const metas = document.querySelectorAll(`meta[${attribute}="${prop}"]`);
    metas.forEach(meta => meta.remove());
  });
};

// Generate memory-specific meta tags
export const generateMemoryMetaTags = (memory: any): MetaTagData => {
  const siteUrl = typeof window !== 'undefined' ? window.location.origin : '';
  const memoryUrl = `${siteUrl}/memory/${memory.id}`;
  
  // Enhanced description with additional context
  const baseDescription = truncateText(memory.description, 140);
  const categoryName = getCategoryDisplayName(memory.category);
  const memoryDate = new Date(memory.created_at).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long', 
    day: 'numeric'
  });
  
  let enhancedDescription = baseDescription;
  if (memory.location) {
    enhancedDescription += ` • ${memory.location}`;
  }
  enhancedDescription += ` • ${categoryName} from ${memoryDate}`;
  
  // Ensure final description doesn't exceed 160 characters
  enhancedDescription = truncateText(enhancedDescription, 160);

  // Enhanced title with more context
  const pageTitle = `${memory.title} - ${categoryName} by ${memory.author_name} | Our Love Story`;

  // Image handling with fallback
  const primaryImage = memory.images && memory.images.length > 0 
    ? memory.images[0] 
    : 'https://images.pexels.com/photos/1024960/pexels-photo-1024960.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1';

  return {
    title: pageTitle,
    description: enhancedDescription,
    image: primaryImage,
    url: memoryUrl,
    type: 'article',
    author: memory.author_name,
    publishedTime: memory.created_at,
    modifiedTime: memory.updated_at || memory.created_at,
    section: 'Love Stories',
    tags: [categoryName, memory.location, 'love story', 'memories'].filter(Boolean)
  };
};

// Update all meta tags for a memory
export const updateMemoryMetaTags = (memory: any) => {
  if (typeof document === 'undefined') return;
  
  const metaData = generateMemoryMetaTags(memory);
  const siteUrl = window.location.origin;

  // Update page title
  document.title = metaData.title;

  // Update basic OpenGraph tags
  updateMetaTag('og:title', memory.title);
  updateMetaTag('og:description', metaData.description);
  updateMetaTag('og:url', metaData.url || '');
  updateMetaTag('og:type', metaData.type || 'article');
  updateMetaTag('og:site_name', 'Our Love Story');
  updateMetaTag('og:locale', 'en_US');
  
  // Image handling with additional properties
  updateMetaTag('og:image', metaData.image || '');
  updateMetaTag('og:image:width', '1260');
  updateMetaTag('og:image:height', '750');
  updateMetaTag('og:image:alt', `${memory.title} - ${getCategoryDisplayName(memory.category)} memory shared by ${memory.author_name}`);
  
  // If there are multiple images, add them as additional og:image tags
  if (memory.images && memory.images.length > 1) {
    // Remove existing additional images first
    const existingAdditionalImages = document.querySelectorAll('meta[property="og:image"][data-index]');
    existingAdditionalImages.forEach(meta => meta.remove());
    
    memory.images.slice(1, 4).forEach((imageUrl: string, index: number) => {
      const meta = document.createElement('meta');
      meta.setAttribute('property', 'og:image');
      meta.setAttribute('content', imageUrl);
      meta.setAttribute('data-index', (index + 1).toString());
      document.head.appendChild(meta);
    });
  }

  // Update Twitter Card tags
  updateMetaTag('twitter:card', 'summary_large_image', false);
  updateMetaTag('twitter:title', memory.title, false);
  updateMetaTag('twitter:description', metaData.description, false);
  updateMetaTag('twitter:image', metaData.image || '', false);
  updateMetaTag('twitter:image:alt', `${memory.title} - ${getCategoryDisplayName(memory.category)} memory`, false);

  // Article-specific meta tags
  updateMetaTag('article:author', metaData.author || '');
  updateMetaTag('article:published_time', metaData.publishedTime || '');
  updateMetaTag('article:modified_time', metaData.modifiedTime || '');
  updateMetaTag('article:section', metaData.section || '');
  
  // Remove existing article tags first
  const existingTags = document.querySelectorAll('meta[property="article:tag"]:not([data-participant])');
  existingTags.forEach(tag => tag.remove());
  
  // Add new tags for category and location
  if (metaData.tags) {
    metaData.tags.forEach(tag => {
      const meta = document.createElement('meta');
      meta.setAttribute('property', 'article:tag');
      meta.setAttribute('content', tag);
      document.head.appendChild(meta);
    });
  }
  
  // Add participants as tags if available
  if (memory.participants && memory.participants.length > 0) {
    // Remove existing participant tags
    const participantTags = document.querySelectorAll('meta[data-participant="true"]');
    participantTags.forEach(meta => meta.remove());
    
    memory.participants.forEach((participant: any) => {
      if (participant.user_name && participant.user_name !== memory.author_name) {
        const meta = document.createElement('meta');
        meta.setAttribute('property', 'article:tag');
        meta.setAttribute('content', participant.user_name);
        meta.setAttribute('data-participant', 'true');
        document.head.appendChild(meta);
      }
    });
  }

  // Additional meta tags for better SEO
  updateMetaTag('description', metaData.description, false);
  updateMetaTag('keywords', metaData.tags?.join(', ') || '', false);
  updateMetaTag('author', metaData.author || '', false);
  
  // Privacy-related meta tags
  if (!memory.is_public) {
    updateMetaTag('robots', 'noindex, nofollow', false);
  } else {
    updateMetaTag('robots', 'index, follow', false);
  }

  // Structured data for rich snippets
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": memory.title,
    "description": metaData.description,
    "image": memory.images && memory.images.length > 0 ? memory.images : [metaData.image],
    "author": {
      "@type": "Person",
      "name": memory.author_name,
      "url": `${siteUrl}/profile/${memory.author_id}`
    },
    "publisher": {
      "@type": "Organization", 
      "name": "Our Love Story",
      "logo": {
        "@type": "ImageObject",
        "url": `${siteUrl}/vite.svg`
      }
    },
    "datePublished": memory.created_at,
    "dateModified": memory.updated_at || memory.created_at,
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": metaData.url
    },
    "url": metaData.url,
    "articleSection": metaData.section,
    "keywords": metaData.tags?.join(', '),
    "about": {
      "@type": "Thing",
      "name": getCategoryDisplayName(memory.category)
    }
  };

  // Add or update structured data script
  let structuredDataScript = document.querySelector('script[type="application/ld+json"][data-memory]');
  if (structuredDataScript) {
    structuredDataScript.textContent = JSON.stringify(structuredData);
  } else {
    structuredDataScript = document.createElement('script');
    structuredDataScript.type = 'application/ld+json';
    structuredDataScript.setAttribute('data-memory', 'true');
    structuredDataScript.textContent = JSON.stringify(structuredData);
    document.head.appendChild(structuredDataScript);
  }
};

// Reset meta tags to defaults
export const resetMetaTags = () => {
  if (typeof document === 'undefined') return;
  
  const siteUrl = window.location.origin;
  
  // Reset to default values
  document.title = 'Our Love Story - Romantic Timeline';
  
  // Reset to default OpenGraph tags
  updateMetaTag('og:title', 'Our Love Story - Romantic Timeline');
  updateMetaTag('og:description', 'A beautiful timeline application for couples to share and celebrate their love story together.');
  updateMetaTag('og:url', siteUrl);
  updateMetaTag('og:type', 'website');
  updateMetaTag('og:image', 'https://images.pexels.com/photos/1024960/pexels-photo-1024960.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1');

  // Reset Twitter Card tags
  updateMetaTag('twitter:title', 'Our Love Story - Romantic Timeline', false);
  updateMetaTag('twitter:description', 'A beautiful timeline application for couples to share and celebrate their love story together.', false);
  updateMetaTag('twitter:image', 'https://images.pexels.com/photos/1024960/pexels-photo-1024960.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1', false);

  // Reset other meta tags
  updateMetaTag('description', 'A beautiful timeline application for couples to share and celebrate their love story together.', false);
  updateMetaTag('keywords', 'love story, couples, timeline, memories, romance', false);
  updateMetaTag('robots', 'index, follow', false);

  // Remove memory-specific tags
  const memorySpecificTags = [
    'article:author', 'article:published_time', 'article:modified_time', 
    'article:section', 'article:tag', 'og:image:width', 'og:image:height', 
    'og:image:alt', 'twitter:image:alt'
  ];
  
  removeMetaTags(memorySpecificTags);

  // Remove additional og:image tags
  const additionalImages = document.querySelectorAll('meta[property="og:image"][data-index]');
  additionalImages.forEach(meta => meta.remove());

  // Remove participant tags
  const participantTags = document.querySelectorAll('meta[data-participant="true"]');
  participantTags.forEach(meta => meta.remove());

  // Remove structured data
  const structuredDataScript = document.querySelector('script[type="application/ld+json"][data-memory]');
  if (structuredDataScript) {
    structuredDataScript.remove();
  }
};

// Generate static meta tags for server-side rendering (future use)
export const generateStaticMetaTags = (memory: any): string => {
  const metaData = generateMemoryMetaTags(memory);
  
  return `
    <title>${metaData.title}</title>
    <meta name="description" content="${metaData.description}" />
    <meta name="keywords" content="${metaData.tags?.join(', ')}" />
    <meta name="author" content="${metaData.author}" />
    <meta name="robots" content="${memory.is_public ? 'index, follow' : 'noindex, nofollow'}" />
    
    <!-- OpenGraph tags -->
    <meta property="og:title" content="${memory.title}" />
    <meta property="og:description" content="${metaData.description}" />
    <meta property="og:image" content="${metaData.image}" />
    <meta property="og:image:width" content="1260" />
    <meta property="og:image:height" content="750" />
    <meta property="og:image:alt" content="${memory.title} - ${getCategoryDisplayName(memory.category)} memory shared by ${memory.author_name}" />
    <meta property="og:url" content="${metaData.url}" />
    <meta property="og:type" content="article" />
    <meta property="og:site_name" content="Our Love Story" />
    <meta property="og:locale" content="en_US" />
    
    <!-- Twitter Card tags -->
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${memory.title}" />
    <meta name="twitter:description" content="${metaData.description}" />
    <meta name="twitter:image" content="${metaData.image}" />
    <meta name="twitter:image:alt" content="${memory.title} - ${getCategoryDisplayName(memory.category)} memory" />
    
    <!-- Article tags -->
    <meta property="article:author" content="${metaData.author}" />
    <meta property="article:published_time" content="${metaData.publishedTime}" />
    <meta property="article:modified_time" content="${metaData.modifiedTime}" />
    <meta property="article:section" content="${metaData.section}" />
    ${metaData.tags?.map(tag => `<meta property="article:tag" content="${tag}" />`).join('\n    ')}
    
    <!-- Structured Data -->
    <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "Article",
      "headline": "${memory.title}",
      "description": "${metaData.description}",
      "image": "${metaData.image}",
      "author": {
        "@type": "Person",
        "name": "${memory.author_name}",
        "url": "${window.location.origin}/profile/${memory.author_id}"
      },
      "publisher": {
        "@type": "Organization",
        "name": "Our Love Story",
        "logo": {
          "@type": "ImageObject", 
          "url": "${window.location.origin}/vite.svg"
        }
      },
      "datePublished": "${memory.created_at}",
      "dateModified": "${memory.updated_at || memory.created_at}",
      "mainEntityOfPage": {
        "@type": "WebPage",
        "@id": "${metaData.url}"
      },
      "url": "${metaData.url}",
      "articleSection": "${metaData.section}",
      "keywords": "${metaData.tags?.join(', ')}",
      "about": {
        "@type": "Thing",
        "name": "${getCategoryDisplayName(memory.category)}"
      }
    }
    </script>
  `.trim();
};
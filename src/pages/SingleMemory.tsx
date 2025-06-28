import React, { useEffect } from 'react';
import { useParams, Link, Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Heart, AlertCircle } from 'lucide-react';
import { MemoryCard } from '../components/Memory/MemoryCard';
import { useSingleMemory } from '../hooks/useMemories';
import { useAuth } from '../contexts/AuthContext';
import { format } from 'date-fns';

// Helper function to truncate text for meta descriptions
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

// Helper function to update OpenGraph meta tags
const updateMetaTags = (memory: any) => {
  const siteUrl = window.location.origin;
  const memoryUrl = `${siteUrl}/memory/${memory.id}`;
  
  // Helper function to update or create meta tag
  const updateMetaTag = (property: string, content: string, isProperty = true) => {
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

  // Enhanced description with additional context
  const baseDescription = truncateText(memory.description, 140);
  const categoryName = getCategoryDisplayName(memory.category);
  const memoryDate = format(new Date(memory.created_at), 'MMMM d, yyyy');
  
  let enhancedDescription = baseDescription;
  if (memory.location) {
    enhancedDescription += ` • ${memory.location}`;
  }
  enhancedDescription += ` • ${categoryName} from ${memoryDate}`;
  
  // Ensure final description doesn't exceed 160 characters
  enhancedDescription = truncateText(enhancedDescription, 160);

  // Update page title with more context
  const pageTitle = `${memory.title} - ${categoryName} by ${memory.author_name} | Our Love Story`;
  document.title = pageTitle;

  // Update basic OpenGraph tags
  updateMetaTag('og:title', memory.title);
  updateMetaTag('og:description', enhancedDescription);
  updateMetaTag('og:url', memoryUrl);
  updateMetaTag('og:type', 'article');
  updateMetaTag('og:site_name', 'Our Love Story');
  updateMetaTag('og:locale', 'en_US');
  
  // Image handling with fallback
  const primaryImage = memory.images && memory.images.length > 0 
    ? memory.images[0] 
    : 'https://images.pexels.com/photos/1024960/pexels-photo-1024960.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1';
  
  updateMetaTag('og:image', primaryImage);
  updateMetaTag('og:image:width', '1260');
  updateMetaTag('og:image:height', '750');
  updateMetaTag('og:image:alt', `${memory.title} - ${categoryName} memory shared by ${memory.author_name}`);
  
  // If there are multiple images, add them as additional og:image tags
  if (memory.images && memory.images.length > 1) {
    memory.images.slice(1, 4).forEach((imageUrl: string, index: number) => {
      // Remove any existing additional image tags first
      const existingImage = document.querySelector(`meta[property="og:image"][data-index="${index + 1}"]`);
      if (existingImage) {
        existingImage.remove();
      }
      
      // Add new image tag
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
  updateMetaTag('twitter:description', enhancedDescription, false);
  updateMetaTag('twitter:image', primaryImage, false);
  updateMetaTag('twitter:image:alt', `${memory.title} - ${categoryName} memory`, false);

  // Article-specific meta tags
  updateMetaTag('article:author', memory.author_name);
  updateMetaTag('article:published_time', memory.created_at);
  updateMetaTag('article:modified_time', memory.updated_at || memory.created_at);
  updateMetaTag('article:section', 'Love Stories');
  
  // Add tags for category and location
  updateMetaTag('article:tag', categoryName);
  if (memory.location) {
    updateMetaTag('article:tag', memory.location);
  }
  
  // Add participants as tags if available
  if (memory.participants && memory.participants.length > 0) {
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
  updateMetaTag('description', enhancedDescription, false);
  updateMetaTag('keywords', `love story, ${categoryName.toLowerCase()}, memories, ${memory.location || 'relationship'}, ${memory.author_name}`, false);
  updateMetaTag('author', memory.author_name, false);
  
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
    "description": enhancedDescription,
    "image": memory.images && memory.images.length > 0 ? memory.images : [primaryImage],
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
      "@id": memoryUrl
    },
    "url": memoryUrl,
    "articleSection": "Love Stories",
    "keywords": [categoryName, memory.location, 'love story', 'memories'].filter(Boolean).join(', '),
    "about": {
      "@type": "Thing",
      "name": categoryName
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

// Helper function to reset meta tags to defaults
const resetMetaTags = () => {
  const siteUrl = window.location.origin;
  
  // Reset to default values
  document.title = 'Our Love Story - Romantic Timeline';
  
  const updateMetaTag = (property: string, content: string, isProperty = true) => {
    const attribute = isProperty ? 'property' : 'name';
    const meta = document.querySelector(`meta[${attribute}="${property}"]`);
    if (meta) {
      meta.setAttribute('content', content);
    }
  };

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
  
  memorySpecificTags.forEach(tag => {
    const metas = document.querySelectorAll(`meta[property="${tag}"], meta[name="${tag}"]`);
    metas.forEach(meta => meta.remove());
  });

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

export function SingleMemory() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { memory, loading, error, toggleReaction, addComment, deleteComment } = useSingleMemory(id);

  // Update meta tags when memory loads
  useEffect(() => {
    if (memory) {
      updateMetaTags(memory);
    }

    // Cleanup function to reset meta tags when component unmounts
    return () => {
      resetMetaTags();
    };
  }, [memory]);

  // Handle missing ID parameter
  if (!id) {
    return <Navigate to="/" replace />;
  }

  // Loading state
  if (loading) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-400"></div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-black/20 backdrop-blur-md rounded-xl border border-white/10 p-8 text-center"
        >
          <AlertCircle className="h-16 w-16 text-red-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-4">Memory Not Found</h1>
          <p className="text-gray-400 mb-6">
            The memory you're looking for doesn't exist or may have been deleted.
          </p>
          <Link
            to="/"
            className="inline-flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-medium rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Timeline</span>
          </Link>
        </motion.div>
      </div>
    );
  }

  // Memory not found (null but no error)
  if (!memory) {
    return (
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-black/20 backdrop-blur-md rounded-xl border border-white/10 p-8 text-center"
        >
          <AlertCircle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-4">Memory Not Found</h1>
          <p className="text-gray-400 mb-6">
            This memory may be private or no longer exists.
          </p>
          <Link
            to="/"
            className="inline-flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-medium rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Timeline</span>
          </Link>
        </motion.div>
      </div>
    );
  }

  // Privacy check for non-authenticated users
  if (!user && !memory.is_public) {
    return (
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-black/20 backdrop-blur-md rounded-xl border border-white/10 p-8 text-center"
        >
          <Heart className="h-16 w-16 text-purple-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-4">Private Memory</h1>
          <p className="text-gray-400 mb-6">
            This memory is private. Please sign in to view it if you have access.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/auth"
              className="inline-flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-medium rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all"
            >
              <span>Sign In</span>
            </Link>
            <Link
              to="/"
              className="inline-flex items-center space-x-2 px-6 py-3 bg-white/10 text-white font-medium rounded-lg hover:bg-white/20 transition-all border border-white/20"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Timeline</span>
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  // Handle delete (redirect to timeline after successful delete)
  const handleDeleteMemory = async (memoryId: string) => {
    // In the context of a single memory view, we'll need to navigate away after deletion
    // This would be handled by the parent component or through a different approach
    console.log('Delete memory:', memoryId);
  };

  const handleDeleteComment = async (memoryId: string, commentId: string) => {
    await deleteComment(commentId);
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Back Navigation */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="mb-6"
      >
        <Link
          to="/"
          className="inline-flex items-center space-x-2 text-purple-400 hover:text-purple-300 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Timeline</span>
        </Link>
      </motion.div>

      {/* Single Memory Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <MemoryCard
          memory={memory}
          onReaction={toggleReaction}
          onComment={addComment}
          onDeleteMemory={handleDeleteMemory}
          onDeleteComment={handleDeleteComment}
          showViewPostLink={false}
        />
      </motion.div>

      {/* Share Information */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="mt-8 bg-purple-500/10 border border-purple-500/20 rounded-lg p-4"
      >
        <div className="flex items-start space-x-3">
          <Heart className="h-5 w-5 text-purple-400 mt-0.5 flex-shrink-0" />
          <div className="text-sm">
            <p className="text-purple-300 font-medium mb-1">Share This Memory</p>
            <p className="text-purple-200/80">
              This memory has its own dedicated page that you can share on social media. 
              When shared, it will display the memory's title, description, images, and all relevant details for a rich preview.
              Use the "Copy Post Link" option to get a direct link to this memory.
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
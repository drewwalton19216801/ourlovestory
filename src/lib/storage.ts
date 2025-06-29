import { supabase } from './supabase';

export interface UploadResult {
  url: string;
  path: string;
}

export interface UploadError {
  message: string;
  code?: string;
}

/**
 * Upload a placeholder file to maintain user's storage folder
 */
export async function uploadPlaceholderFile(userId: string): Promise<void> {
  try {
    // Create a tiny placeholder file
    const placeholderContent = new Blob([''], { type: 'text/plain' });
    const placeholderPath = `${userId}/.keep`;

    // Check if placeholder already exists to avoid unnecessary uploads
    const { data: existingFile } = await supabase.storage
      .from('memory-images')
      .list(userId, {
        search: '.keep'
      });

    // Only upload if placeholder doesn't already exist
    if (!existingFile || existingFile.length === 0) {
      const { error } = await supabase.storage
        .from('memory-images')
        .upload(placeholderPath, placeholderContent, {
          cacheControl: '3600',
          upsert: true // Overwrite if exists
        });

      if (error) {
        console.warn('Failed to upload placeholder file:', error);
        // Don't throw error as this is not critical to the main operation
      }
    }
  } catch (error) {
    console.warn('Error managing placeholder file:', error);
    // Don't throw error as this is not critical to the main operation
  }
}

/**
 * Upload a file to Supabase Storage
 */
export async function uploadImage(file: File, userId?: string): Promise<UploadResult> {
  try {
    // Get current user if userId not provided
    if (!userId) {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User must be authenticated to upload images');
      }
      userId = user.id;
    }

    // Generate a unique filename
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
    // Include user ID in path for RLS policies to work correctly
    const filePath = `${userId}/${fileName}`;

    // Upload file to Supabase Storage
    const { data, error } = await supabase.storage
      .from('memory-images')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      throw new Error(error.message);
    }

    // Get the public URL
    const { data: { publicUrl } } = supabase.storage
      .from('memory-images')
      .getPublicUrl(data.path);

    return {
      url: publicUrl,
      path: data.path
    };
  } catch (error) {
    console.error('Error uploading image:', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to upload image');
  }
}

/**
 * Upload multiple files to Supabase Storage
 */
export async function uploadImages(files: File[], userId?: string): Promise<UploadResult[]> {
  try {
    // Get current user if userId not provided
    if (!userId) {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User must be authenticated to upload images');
      }
      userId = user.id;
    }

    const uploadPromises = files.map(file => uploadImage(file, userId));
    const results = await Promise.all(uploadPromises);
    return results;
  } catch (error) {
    console.error('Error uploading images:', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to upload images');
  }
}

/**
 * Delete an image from Supabase Storage
 */
export async function deleteImage(path: string): Promise<void> {
  try {
    const { error } = await supabase.storage
      .from('memory-images')
      .remove([path]);

    if (error) {
      throw new Error(error.message);
    }
  } catch (error) {
    console.error('Error deleting image:', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to delete image');
  }
}

/**
 * Delete multiple images from Supabase Storage
 */
export async function deleteImages(paths: string[]): Promise<void> {
  try {
    const { error } = await supabase.storage
      .from('memory-images')
      .remove(paths);

    if (error) {
      throw new Error(error.message);
    }
  } catch (error) {
    console.error('Error deleting images:', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to delete images');
  }
}

/**
 * Extract storage path from public URL
 */
export function extractStoragePath(publicUrl: string): string | null {
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

/**
 * Validate file type and size
 */
export function validateImageFile(file: File): { valid: boolean; error?: string } {
  // Check file type
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  if (!allowedTypes.includes(file.type)) {
    return { 
      valid: false, 
      error: 'Please select a valid image file (JPEG, PNG, GIF, or WebP)' 
    };
  }

  // Check file size (max 5MB)
  const maxSize = 5 * 1024 * 1024; // 5MB in bytes
  if (file.size > maxSize) {
    return { 
      valid: false, 
      error: 'Image file size must be less than 5MB' 
    };
  }

  return { valid: true };
}

/**
 * Validate multiple image files
 */
export function validateImageFiles(files: File[]): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (files.length === 0) {
    return { valid: true, errors: [] };
  }

  if (files.length > 10) {
    errors.push('You can upload a maximum of 10 images per memory');
  }

  files.forEach((file, index) => {
    const validation = validateImageFile(file);
    if (!validation.valid && validation.error) {
      errors.push(`File ${index + 1}: ${validation.error}`);
    }
  });

  return { valid: errors.length === 0, errors };
}
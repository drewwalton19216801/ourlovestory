import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, X, Image as ImageIcon, AlertCircle } from 'lucide-react';
import { uploadImages, validateImageFiles, UploadResult } from '../../lib/storage';
import toast from 'react-hot-toast';

interface ImageUploadProps {
  onImagesUploaded: (imageUrls: string[]) => void;
  existingImages: string[];
  disabled?: boolean;
}

interface PreviewImage {
  file: File;
  preview: string;
  id: string;
}

export function ImageUpload({ onImagesUploaded, existingImages, disabled = false }: ImageUploadProps) {
  const [selectedFiles, setSelectedFiles] = useState<PreviewImage[]>([]);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (files: File[]) => {
    if (disabled) return;

    const validation = validateImageFiles(files);
    
    if (!validation.valid) {
      validation.errors.forEach(error => toast.error(error));
      return;
    }

    // Create preview images
    const newPreviews: PreviewImage[] = files.map(file => ({
      file,
      preview: URL.createObjectURL(file),
      id: Math.random().toString(36).substring(2)
    }));

    setSelectedFiles(prev => [...prev, ...newPreviews]);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    handleFileSelect(files);
    // Reset the input so the same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    
    const files = Array.from(e.dataTransfer.files);
    handleFileSelect(files);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
  };

  const removePreviewImage = (id: string) => {
    setSelectedFiles(prev => {
      const imageToRemove = prev.find(img => img.id === id);
      if (imageToRemove) {
        URL.revokeObjectURL(imageToRemove.preview);
      }
      return prev.filter(img => img.id !== id);
    });
  };

  const removeExistingImage = (index: number) => {
    const updatedImages = existingImages.filter((_, i) => i !== index);
    onImagesUploaded(updatedImages);
  };

  const uploadSelectedImages = async () => {
    if (selectedFiles.length === 0) return;

    setUploading(true);
    try {
      const files = selectedFiles.map(preview => preview.file);
      const uploadResults: UploadResult[] = await uploadImages(files);
      
      const newImageUrls = uploadResults.map(result => result.url);
      const allImages = [...existingImages, ...newImageUrls];
      
      onImagesUploaded(allImages);
      
      // Clean up preview URLs
      selectedFiles.forEach(preview => URL.revokeObjectURL(preview.preview));
      setSelectedFiles([]);
      
      toast.success(`${newImageUrls.length} image${newImageUrls.length > 1 ? 's' : ''} uploaded successfully!`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to upload images');
    } finally {
      setUploading(false);
    }
  };

  const triggerFileInput = () => {
    if (!disabled && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // Cleanup preview URLs on unmount
  React.useEffect(() => {
    return () => {
      selectedFiles.forEach(preview => URL.revokeObjectURL(preview.preview));
    };
  }, []);

  return (
    <div className="space-y-4">
      {/* File Input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*"
        onChange={handleFileInputChange}
        className="hidden"
        disabled={disabled}
      />

      {/* Upload Area */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={triggerFileInput}
        className={`relative border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all ${
          dragActive
            ? 'border-purple-400 bg-purple-500/10'
            : 'border-white/20 hover:border-white/40'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-white/5'}`}
      >
        <div className="flex flex-col items-center space-y-3">
          <Upload className={`h-8 w-8 ${dragActive ? 'text-purple-400' : 'text-gray-400'}`} />
          <div>
            <p className="text-white font-medium">
              {dragActive ? 'Drop images here' : 'Click to upload or drag and drop'}
            </p>
            <p className="text-sm text-gray-400 mt-1">
              PNG, JPG, GIF, WebP up to 5MB each (max 10 images)
            </p>
          </div>
        </div>
      </div>

      {/* Selected Files Preview */}
      <AnimatePresence>
        {selectedFiles.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-3"
          >
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium text-gray-300">
                Selected Images ({selectedFiles.length})
              </h4>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={uploadSelectedImages}
                disabled={uploading || disabled}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
              >
                {uploading ? 'Uploading...' : 'Upload Images'}
              </motion.button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {selectedFiles.map((preview) => (
                <motion.div
                  key={preview.id}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="relative group"
                >
                  <img
                    src={preview.preview}
                    alt="Preview"
                    className="w-full h-24 object-cover rounded-lg border border-white/20"
                  />
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={(e) => {
                      e.stopPropagation();
                      removePreviewImage(preview.id);
                    }}
                    disabled={uploading}
                    className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50"
                  >
                    <X className="h-3 w-3" />
                  </motion.button>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Existing Images */}
      {existingImages.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-gray-300">
            Uploaded Images ({existingImages.length})
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {existingImages.map((imageUrl, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="relative group"
              >
                <img
                  src={imageUrl}
                  alt={`Uploaded ${index + 1}`}
                  className="w-full h-24 object-cover rounded-lg border border-white/20"
                />
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => removeExistingImage(index)}
                  disabled={disabled}
                  className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50"
                >
                  <X className="h-3 w-3" />
                </motion.button>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Upload Constraints Info */}
      <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
        <div className="flex items-start space-x-2">
          <AlertCircle className="h-4 w-4 text-blue-400 mt-0.5 flex-shrink-0" />
          <div className="text-sm">
            <p className="text-blue-300 font-medium mb-1">Image Upload Guidelines</p>
            <ul className="text-blue-200/80 space-y-1 text-xs">
              <li>• Supported formats: JPEG, PNG, GIF, WebP</li>
              <li>• Maximum file size: 5MB per image</li>
              <li>• Maximum images per memory: 10</li>
              <li>• Images are automatically optimized for web viewing</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
import React from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { EditMemoryForm } from '../components/Memory/EditMemoryForm';
import { useSingleMemory } from '../hooks/useMemories';
import { useAuth } from '../contexts/AuthContext';
import { motion } from 'framer-motion';
import { AlertCircle } from 'lucide-react';

export function EditMemory() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { memory, loading, error } = useSingleMemory(id);

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
            The memory you're trying to edit doesn't exist or may have been deleted.
          </p>
        </motion.div>
      </div>
    );
  }

  // Memory not found
  if (!memory) {
    return <Navigate to="/" replace />;
  }

  // Check if user can edit this memory
  if (!user || user.id !== memory.author_id) {
    return <Navigate to={`/memory/${id}`} replace />;
  }

  return (
    <div className="max-w-4xl mx-auto">
      <EditMemoryForm memory={memory} />
    </div>
  );
}
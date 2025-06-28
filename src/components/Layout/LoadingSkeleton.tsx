import React from 'react';
import { motion } from 'framer-motion';

interface LoadingSkeletonProps {
  className?: string;
}

export function LoadingSkeleton({ className = '' }: LoadingSkeletonProps) {
  return (
    <motion.div
      animate={{ opacity: [0.3, 0.7, 0.3] }}
      transition={{ duration: 1.5, repeat: Infinity }}
      className={`bg-gradient-to-r from-gray-700 to-gray-600 rounded-lg ${className}`}
    />
  );
}

export function MemoryCardSkeleton() {
  return (
    <div className="bg-black/20 backdrop-blur-md rounded-xl border border-white/10 p-6 space-y-4">
      <div className="flex items-center justify-between">
        <LoadingSkeleton className="h-6 w-32" />
        <LoadingSkeleton className="h-5 w-20" />
      </div>
      
      <LoadingSkeleton className="h-8 w-3/4" />
      
      <LoadingSkeleton className="h-24 w-full" />
      
      <div className="grid grid-cols-2 gap-4">
        <LoadingSkeleton className="h-40 w-full" />
        <LoadingSkeleton className="h-40 w-full" />
      </div>
      
      <div className="flex items-center justify-between pt-4">
        <div className="flex space-x-2">
          <LoadingSkeleton className="h-8 w-8 rounded-full" />
          <LoadingSkeleton className="h-8 w-8 rounded-full" />
          <LoadingSkeleton className="h-8 w-8 rounded-full" />
        </div>
        <LoadingSkeleton className="h-8 w-16" />
      </div>
    </div>
  );
}
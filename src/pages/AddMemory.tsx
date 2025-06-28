import React from 'react';
import { AddMemoryForm } from '../components/Memory/AddMemoryForm';
import { useMemories } from '../hooks/useMemories';

export function AddMemory() {
  const { addMemory } = useMemories();

  return (
    <div className="max-w-4xl mx-auto">
      <AddMemoryForm onAddMemory={addMemory} />
    </div>
  );
}
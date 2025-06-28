/*
  # Add Foreign Key Constraints for Memory App

  1. Foreign Key Constraints
    - Add constraint linking reactions.memory_id to memories.id
    - Add constraint linking reactions.user_id to auth.users.id  
    - Add constraint linking comments.memory_id to memories.id
    - Add constraint linking comments.user_id to auth.users.id

  2. Data Integrity
    - All constraints use CASCADE DELETE to maintain referential integrity
    - When a memory is deleted, all associated reactions and comments are removed
    - When a user is deleted, all their reactions and comments are removed

  3. Performance
    - These constraints will also create indexes automatically for better query performance
*/

-- Add foreign key constraint for reactions table referencing memories
ALTER TABLE public.reactions 
ADD CONSTRAINT reactions_memory_id_fkey 
FOREIGN KEY (memory_id) REFERENCES public.memories(id) ON DELETE CASCADE;

-- Add foreign key constraint for reactions table referencing auth.users
ALTER TABLE public.reactions 
ADD CONSTRAINT reactions_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Add foreign key constraint for comments table referencing memories
ALTER TABLE public.comments 
ADD CONSTRAINT comments_memory_id_fkey 
FOREIGN KEY (memory_id) REFERENCES public.memories(id) ON DELETE CASCADE;

-- Add foreign key constraint for comments table referencing auth.users
ALTER TABLE public.comments 
ADD CONSTRAINT comments_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
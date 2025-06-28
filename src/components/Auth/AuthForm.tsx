import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { Heart, Mail, Lock, User } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';

interface AuthFormData {
  email: string;
  password: string;
  name?: string;
}

export function AuthForm() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();

  const { register, handleSubmit, formState: { errors }, reset } = useForm<AuthFormData>();

  const onSubmit = async (data: AuthFormData) => {
    setIsSubmitting(true);
    try {
      if (isSignUp) {
        // Create the account first
        await signUp(data.email, data.password);
        
        // Get the current user after signup
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        
        if (userError) {
          console.error('Error getting user after signup:', userError);
        } else if (user && data.name) {
          // Update the user profile with the provided name
          try {
            const { error: profileError } = await supabase
              .from('user_profiles')
              .upsert({
                id: user.id,
                display_name: data.name,
                updated_at: new Date().toISOString()
              });
            
            if (profileError) {
              console.error('Error updating profile:', profileError);
              // Don't throw error as the account was created successfully
            }
          } catch (profileErr) {
            console.error('Profile update failed:', profileErr);
            // Don't throw error as the account was created successfully
          }
        }
        
        toast.success('Account created successfully! You can now start adding memories.');
        navigate('/');
      } else {
        await signIn(data.email, data.password);
        toast.success('Welcome back!');
        navigate('/');
      }
    } catch (error: any) {
      toast.error(error.message || 'Authentication failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleMode = () => {
    setIsSignUp(!isSignUp);
    reset();
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-black/20 backdrop-blur-md rounded-xl border border-white/10 p-8"
      >
        <div className="text-center mb-8">
          <Heart className="h-12 w-12 text-purple-400 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-white mb-2">Our Love Story</h1>
          <p className="text-gray-400">
            {isSignUp ? 'Create your account to start sharing memories' : 'Sign in to your account'}
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {isSignUp && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                <User className="inline h-4 w-4 mr-1" />
                Display Name
              </label>
              <input
                {...register('name', { 
                  required: isSignUp ? 'Display name is required' : false,
                  minLength: {
                    value: 2,
                    message: 'Display name must be at least 2 characters'
                  }
                })}
                type="text"
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="How should we call you?"
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-400">{errors.name.message}</p>
              )}
              <p className="mt-1 text-xs text-gray-500">
                This will be shown on your memories and can be changed later.
              </p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              <Mail className="inline h-4 w-4 mr-1" />
              Email
            </label>
            <input
              {...register('email', { 
                required: 'Email is required',
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: 'Invalid email address'
                }
              })}
              type="email"
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="your@email.com"
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-400">{errors.email.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              <Lock className="inline h-4 w-4 mr-1" />
              Password
            </label>
            <input
              {...register('password', { 
                required: 'Password is required',
                minLength: {
                  value: 6,
                  message: 'Password must be at least 6 characters'
                }
              })}
              type="password"
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="Your password"
            />
            {errors.password && (
              <p className="mt-1 text-sm text-red-400">{errors.password.message}</p>
            )}
          </div>

          {isSignUp && (
            <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-4">
              <div className="flex items-start space-x-2">
                <Heart className="h-4 w-4 text-purple-400 mt-0.5 flex-shrink-0" />
                <div className="text-sm">
                  <p className="text-purple-300 font-medium mb-1">Welcome to Our Love Story!</p>
                  <p className="text-purple-200/80 text-xs leading-relaxed">
                    Create a beautiful timeline of your relationship. Share memories, 
                    connect with your partner, and build your digital love story together.
                  </p>
                </div>
              </div>
            </div>
          )}

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={isSubmitting}
            className="w-full py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-medium rounded-lg hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {isSubmitting 
              ? (isSignUp ? 'Creating Account...' : 'Signing In...')
              : (isSignUp ? 'Create Account' : 'Sign In')
            }
          </motion.button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={toggleMode}
            className="text-purple-400 hover:text-purple-300 transition-colors"
          >
            {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
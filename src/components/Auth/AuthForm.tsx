import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { Heart, Mail, Lock, User, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate, useSearchParams } from 'react-router-dom';
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
  const [showResendVerification, setShowResendVerification] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const { signIn, signUp, resendVerification } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const { register, handleSubmit, formState: { errors }, reset, watch } = useForm<AuthFormData>();

  const email = watch('email');

  // Check for verification status in URL parameters
  useEffect(() => {
    const verified = searchParams.get('verified');
    const verificationStatus = searchParams.get('verification_status');

    if (verified === 'true') {
      toast.success('Email verified successfully! You can now sign in.');
    } else if (verificationStatus) {
      // Handle different verification error states
      switch (verificationStatus) {
        case 'invalid_link':
          toast.error('Invalid verification link. Please check that you clicked the correct link from your email.');
          break;
        case 'invalid_token':
          toast.error('Invalid or expired verification token. Please try requesting a new verification email.');
          setShowResendVerification(true);
          break;
        case 'missing_user_id':
          toast.error('Malformed verification link. Please check that you clicked the complete link from your email.');
          break;
        case 'verification_failed':
          toast.error('Email verification failed. The link may be expired or already used. Please try requesting a new verification email.');
          setShowResendVerification(true);
          break;
        case 'server_error':
          toast.error('A server error occurred during verification. Please try again or contact support if the issue persists.');
          break;
        default:
          toast.error('Email verification failed. Please try requesting a new verification email.');
          setShowResendVerification(true);
      }
    }

    // Clear the parameters from URL after handling them
    if (verified || verificationStatus) {
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete('verified');
      newUrl.searchParams.delete('verification_status');
      window.history.replaceState({}, '', newUrl.toString());
    }
  }, [searchParams]);

  const onSubmit = async (data: AuthFormData) => {
    setIsSubmitting(true);
    setShowResendVerification(false);
    
    try {
      if (isSignUp) {
        await signUp(data.email, data.password, data.name || '');
        // Success message is shown in signUp function
        // User stays on auth page to sign in after verification
      } else {
        await signIn(data.email, data.password);
        toast.success('Welcome back!');
        navigate('/');
      }
    } catch (error: any) {
      console.error('Auth error:', error);
      
      if (error.message?.includes('verify your email')) {
        setShowResendVerification(true);
        toast.error(error.message);
      } else if (error.message?.includes('Invalid login credentials')) {
        toast.error('Invalid email or password. Please check your credentials and try again.');
      } else if (error.message?.includes('Email not confirmed')) {
        setShowResendVerification(true);
        toast.error('Please verify your email address before signing in.');
      } else {
        toast.error(error.message || 'Authentication failed');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendVerification = async () => {
    if (!email) {
      toast.error('Please enter your email address first.');
      return;
    }

    setIsResending(true);
    try {
      await resendVerification(email);
    } catch (error: any) {
      toast.error(error.message || 'Failed to resend verification email');
    } finally {
      setIsResending(false);
    }
  };

  const toggleMode = () => {
    setIsSignUp(!isSignUp);
    setShowResendVerification(false);
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

          {/* Email Verification Notice */}
          {isSignUp && (
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
              <div className="flex items-start space-x-2">
                <Mail className="h-4 w-4 text-blue-400 mt-0.5 flex-shrink-0" />
                <div className="text-sm">
                  <p className="text-blue-300 font-medium mb-1">Email Verification Required</p>
                  <p className="text-blue-200/80 text-xs leading-relaxed">
                    After creating your account, you'll receive a verification email. 
                    Please click the link in that email to activate your account before signing in.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Resend Verification */}
          {showResendVerification && !isSignUp && (
            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
              <div className="flex items-start space-x-2 mb-3">
                <AlertCircle className="h-4 w-4 text-yellow-400 mt-0.5 flex-shrink-0" />
                <div className="text-sm">
                  <p className="text-yellow-300 font-medium mb-1">Email Verification Required</p>
                  <p className="text-yellow-200/80 text-xs leading-relaxed">
                    Your email address needs to be verified before you can sign in.
                  </p>
                </div>
              </div>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="button"
                onClick={handleResendVerification}
                disabled={isResending || !email}
                className="w-full py-2 bg-yellow-600/20 text-yellow-300 font-medium rounded-lg hover:bg-yellow-600/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm border border-yellow-500/30 flex items-center justify-center space-x-2"
              >
                {isResending ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    <span>Sending...</span>
                  </>
                ) : (
                  <>
                    <Mail className="h-4 w-4" />
                    <span>Resend Verification Email</span>
                  </>
                )}
              </motion.button>
            </div>
          )}

          {/* Welcome message for new users */}
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
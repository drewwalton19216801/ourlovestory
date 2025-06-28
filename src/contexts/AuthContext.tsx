import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { generateVerificationEmail } from '../lib/emailTemplates';
import toast from 'react-hot-toast';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string) => Promise<void>;
  signOut: () => Promise<void>;
  resendVerification: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const sendVerificationEmail = async (user: User, name: string) => {
    try {
      const siteUrl = import.meta.env.VITE_SITE_URL || window.location.origin;
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      
      // Create verification token (simple base64 encoding - in production, use proper JWT)
      const verificationToken = btoa(user.id);
      const verificationUrl = `${supabaseUrl}/functions/v1/confirm-email?token=${verificationToken}`;
      
      const emailHtml = generateVerificationEmail({
        userName: name,
        verificationUrl: verificationUrl,
        siteName: 'Our Love Story'
      });

      const emailApiUrl = `${supabaseUrl}/functions/v1/send-email-resend`;
      
      const response = await fetch(emailApiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: user.email,
          subject: 'Verify your email address - Our Love Story',
          html: emailHtml
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to send verification email');
      }

      return data;
    } catch (error) {
      console.error('Error sending verification email:', error);
      throw new Error('Failed to send verification email. Please try again.');
    }
  };

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;

    // Check if email is verified (Supabase sets email_confirmed_at when verified)
    if (data.user && !data.user.email_confirmed_at) {
      // Sign out the user if email is not verified
      await supabase.auth.signOut();
      throw new Error('Please verify your email address before signing in. Check your inbox for a verification link.');
    }
  };

  const signUp = async (email: string, password: string, name: string) => {
    // Validate name input
    const trimmedName = name.trim();
    if (!trimmedName || trimmedName.length < 2) {
      throw new Error('Display name must be at least 2 characters long');
    }

    // Create user with Supabase Auth and ensure name is stored in metadata
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name: trimmedName,
          display_name: trimmedName,
          full_name: trimmedName
        }
      }
    });

    if (error) throw error;

    if (data.user) {
      // Send custom verification email via Resend
      try {
        await sendVerificationEmail(data.user, trimmedName);
        
        // Sign out the user immediately since they need to verify email first
        await supabase.auth.signOut();
        
        toast.success('Account created! Please check your email and click the verification link to complete your registration.');
      } catch (emailError) {
        // If email sending fails, we should clean up the created user
        console.error('Failed to send verification email:', emailError);
        
        // Attempt to delete the user (this requires admin privileges, so it might fail)
        try {
          await supabase.auth.admin?.deleteUser(data.user.id);
        } catch {
          // If we can't delete the user, that's okay - they just won't be able to sign in without verification
        }
        
        throw new Error('Account created but failed to send verification email. Please try signing up again.');
      }
    }
  };

  const resendVerification = async (email: string) => {
    try {
      // Get user by email (this would need to be done via edge function in production)
      const { data: { users }, error } = await supabase.auth.admin.listUsers();
      
      if (error) throw error;
      
      const user = users.find(u => u.email === email);
      if (!user) {
        throw new Error('No account found with this email address.');
      }
      
      if (user.email_confirmed_at) {
        throw new Error('This email is already verified. You can sign in normally.');
      }
      
      const userName = user.user_metadata?.name || user.user_metadata?.display_name || user.email || 'User';
      await sendVerificationEmail(user, userName);
      
      toast.success('Verification email sent! Please check your inbox.');
    } catch (error: any) {
      throw new Error(error.message || 'Failed to resend verification email.');
    }
  };

  const signOut = async () => {
    try {
      // Sign out from Supabase
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      // Clear local state immediately
      setUser(null);
      setSession(null);

      // Clear any cached data in localStorage
      localStorage.removeItem('supabase.auth.token');
      
      // Clear any sessionStorage data
      sessionStorage.clear();
      
      // Force a page reload to ensure complete cleanup
      window.location.reload();
    } catch (error) {
      // Even if there's an error, try to clear local state and reload
      setUser(null);
      setSession(null);
      localStorage.removeItem('supabase.auth.token');
      sessionStorage.clear();
      window.location.reload();
      throw error;
    }
  };

  const value = {
    user,
    session,
    loading,
    signIn,
    signUp,
    signOut,
    resendVerification,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
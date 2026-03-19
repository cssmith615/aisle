import { create } from 'zustand';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { UserProfile, UserRole } from '../types';

interface AuthState {
  session: Session | null;
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  initialized: boolean;

  initialize: () => Promise<void>;
  signUp: (email: string, password: string, displayName: string, role: UserRole) => Promise<{ error?: string }>;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
  loadProfile: () => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<{ error?: string }>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  session: null,
  user: null,
  profile: null,
  loading: false,
  initialized: false,

  initialize: async () => {
    const { data: { session } } = await supabase.auth.getSession();
    set({ session, user: session?.user ?? null });

    if (session?.user) {
      await get().loadProfile();
    }

    supabase.auth.onAuthStateChange(async (_event, session) => {
      set({ session, user: session?.user ?? null });
      if (session?.user) {
        await get().loadProfile();
      } else {
        set({ profile: null });
      }
    });

    set({ initialized: true });
  },

  signUp: async (email, password, displayName, role) => {
    set({ loading: true });
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) {
      set({ loading: false });
      return { error: error.message };
    }

    if (data.user) {
      const { error: profileError } = await supabase.from('user_profiles').insert({
        id: data.user.id,
        display_name: displayName,
        role,
        tier: 'free',
        onboarding_done: false,
      });
      if (profileError) {
        set({ loading: false });
        return { error: profileError.message };
      }
      await get().loadProfile();
    }

    set({ loading: false });
    return {};
  },

  signIn: async (email, password) => {
    set({ loading: true });
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      set({ loading: false });
      return { error: error.message };
    }
    set({ loading: false });
    return {};
  },

  signOut: async () => {
    await supabase.auth.signOut();
    set({ session: null, user: null, profile: null });
  },

  loadProfile: async () => {
    const user = get().user ?? (await supabase.auth.getUser()).data.user;
    if (!user) return;

    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (error || !data) {
      // Profile may not exist yet — create a fallback
      const { data: created } = await supabase
        .from('user_profiles')
        .insert({ id: user.id, display_name: 'User', tier: 'free', role: 'user', onboarding_done: false })
        .select()
        .single();
      set({ profile: created ?? null });
      return;
    }

    set({ profile: data as UserProfile });
  },

  updateProfile: async (updates) => {
    const user = get().user;
    if (!user) return { error: 'Not authenticated' };

    const { data, error } = await supabase
      .from('user_profiles')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', user.id)
      .select()
      .single();

    if (error) return { error: error.message };
    set({ profile: data as UserProfile });
    return {};
  },
}));

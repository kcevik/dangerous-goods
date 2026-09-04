import type { Session, SupabaseClient, User } from '@supabase/supabase-js'

declare global {
  namespace App {
    interface Locals {
      supabase: SupabaseClient
      safeGetSession: () => Promise<
        | { session: Session, user: User, isActive: boolean }
        | { session: null, user: null, isActive: false }
      >
    }
    // PageData: `supabase`, `session`, `user`, `isActive` are inferred from the root layout load
    // interface Error {}
    // interface PageState {}
    // interface Platform {}
  }
}

export {}

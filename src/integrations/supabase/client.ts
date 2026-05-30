import React from "react";
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://xzgdfetnjnwrberyddmf.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh6Z2RmZXRuam53cmJlcnlkZG1mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDIzMjk4MTksImV4cCI6MjA1NzkwNTgxOX0.XJFYvBiZHo1vcfCV6Fn79C9U6LP4Vuf05PCixBWqaYU";

const STORAGE_KEY = 'deepflow-auth-session';


export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {

    persistSession: true,

    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    storageKey: STORAGE_KEY,

    autoRefreshToken: true,

    detectSessionInUrl: true,

    flowType: 'pkce',
  },
});
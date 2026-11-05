import { supabase } from '../lib/supabase';
import { fetchRows } from '../lib/db';
import type { Profile } from '../types';

const columns = 'id, role, full_name, created_at';

export function listProfiles(): Promise<Profile[]> {
  return fetchRows<Profile>(supabase.from('profiles').select(columns).order('full_name'));
}

export function listWorkers(): Promise<Profile[]> {
  return fetchRows<Profile>(supabase.from('profiles').select(columns).eq('role', 'worker').order('full_name'));
}

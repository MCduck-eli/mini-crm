import { supabase } from '../lib/supabase';
import { fetchRow, fetchRows, mutate } from '../lib/db';
import type { AppObject } from '../types';

const columns = 'id, name, address, created_at';

export function listObjects(): Promise<AppObject[]> {
  return fetchRows<AppObject>(supabase.from('objects').select(columns).order('created_at', { ascending: false }));
}

export function getObject(id: string): Promise<AppObject> {
  return fetchRow<AppObject>(
    supabase.from('objects').select(columns).eq('id', id).single(),
    'Объект не найден, либо у вас нет к нему доступа',
  );
}

export function createObject(input: { name: string; address: string }): Promise<AppObject> {
  return fetchRow<AppObject>(supabase.from('objects').insert(input).select(columns).single());
}

export function updateObject(id: string, input: { name: string; address: string }): Promise<AppObject> {
  return fetchRow<AppObject>(supabase.from('objects').update(input).eq('id', id).select(columns).single());
}

export async function deleteObject(id: string): Promise<void> {
  await mutate(supabase.from('objects').delete().eq('id', id));
}

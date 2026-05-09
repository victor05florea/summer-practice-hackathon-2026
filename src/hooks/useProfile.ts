import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../services/supabase';
import { type Profile } from '../types';

export function useProfile(userId: string | undefined) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    if (!userId) return;
    const { data } = await supabase.from('profiles').select('*').eq('id', userId).single();
    setProfile(data);
  }, [userId]);

  useEffect(() => {
    if (!userId) { setLoading(false); return; }
    setLoading(true);
    supabase.from('profiles').select('*').eq('id', userId).single().then(({ data }) => {
      setProfile(data);
      setLoading(false);
    });
  }, [userId]);

  return { profile, setProfile, loading, refetch };
}
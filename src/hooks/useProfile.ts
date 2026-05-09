import { useEffect, useState } from 'react'
import { supabase } from '../services/supabase'
import { type Profile } from '../types'

export function useProfile(userId: string | undefined) {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!userId) { setLoading(false); return }

    supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
      .then(({ data }) => {
        setProfile(data)
        setLoading(false)
      })
  }, [userId])

  return { profile, setProfile, loading }
}
import { useEffect, useState } from "react";
import { supabase } from "../services/supabase";
import { type Profile } from "../types";

export function useNearby(profile: Profile, enabled: boolean) {
  const [people, setPeople] = useState<Profile[]>([]);
  const sportsKey = profile.sports.join(",");

  useEffect(() => {
    if (!enabled) {
      setPeople([]);
      return;
    }
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .neq("id", profile.id)
        .eq("city", profile.city)
        .overlaps("sports", profile.sports);
      if (cancelled) return;
      if (error) console.error("fetchPeople", error);
      setPeople(data ?? []);
    })();
    return () => {
      cancelled = true;
    };
  }, [profile.id, profile.city, sportsKey, enabled]);

  return people;
}

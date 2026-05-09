import { useCallback, useEffect, useState } from "react";
import { supabase } from "../services/supabase";
import { type Group, type Profile } from "../types";

export function useGroups(profile: Profile, enabled: boolean) {
  const [groups, setGroups] = useState<Group[]>([]);
  const [memberDetails, setMemberDetails] = useState<Record<string, Profile>>(
    {},
  );
  const sportsKey = profile.sports.join(",");

  const refetch = useCallback(async () => {
    if (!enabled || profile.sports.length === 0) {
      setGroups([]);
      return;
    }
    const { data, error } = await supabase
      .from("groups")
      .select("*")
      .eq("status", "open")
      .in("sport", profile.sports);
    if (error) console.error("fetchGroups", error);
    setGroups(data ?? []);
  }, [profile.sports, enabled, sportsKey]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  useEffect(() => {
    const ids = new Set<string>();
    groups.forEach((g) => g.members.forEach((id) => ids.add(id)));
    if (ids.size === 0) {
      setMemberDetails({});
      return;
    }
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .in("id", Array.from(ids));
      if (cancelled) return;
      if (error) {
        console.error("fetchMembers", error);
        return;
      }
      const map: Record<string, Profile> = {};
      (data ?? []).forEach((p) => (map[p.id] = p));
      setMemberDetails(map);
    })();
    return () => {
      cancelled = true;
    };
  }, [groups]);

  return { groups, memberDetails, refetch };
}

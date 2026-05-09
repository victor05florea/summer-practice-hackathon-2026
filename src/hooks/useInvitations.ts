import { useCallback, useEffect, useState } from "react";
import { supabase } from "../services/supabase";
import { type Invitation, type Profile } from "../types";

export interface InvitationView extends Invitation {
  fromProfile?: Profile;
}

export function useInvitations(userId: string) {
  const [invitations, setInvitations] = useState<InvitationView[]>([]);

  const fetchInvitations = useCallback(async () => {
    const { data, error } = await supabase
      .from("invitations")
      .select("*")
      .eq("to_user_id", userId)
      .eq("status", "pending")
      .order("created_at", { ascending: false });
    if (error) {
      console.error("fetchInvitations", error);
      return;
    }
    const rows = (data ?? []) as Invitation[];
    if (rows.length === 0) {
      setInvitations([]);
      return;
    }
    const senderIds = Array.from(new Set(rows.map((r) => r.from_user_id)));
    const { data: senders } = await supabase
      .from("profiles")
      .select("*")
      .in("id", senderIds);
    const map: Record<string, Profile> = {};
    (senders ?? []).forEach((p) => (map[p.id] = p));
    setInvitations(rows.map((r) => ({ ...r, fromProfile: map[r.from_user_id] })));
  }, [userId]);

  useEffect(() => {
    if (!userId) return;
    fetchInvitations();
    const channel = supabase
      .channel(`invites:${userId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "invitations",
          filter: `to_user_id=eq.${userId}`,
        },
        () => fetchInvitations(),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, fetchInvitations]);

  const sendInvite = async (toUserId: string, sport: string, groupId: string | null) => {
    const { error } = await supabase.from("invitations").insert({
      from_user_id: userId,
      to_user_id: toUserId,
      sport,
      group_id: groupId,
      status: "pending",
    });
    if (error) console.error("sendInvite", error);
    return !error;
  };

  const respondInvite = async (id: string, status: "accepted" | "declined") => {
    const { error } = await supabase
      .from("invitations")
      .update({ status })
      .eq("id", id);
    if (error) console.error("respondInvite", error);
    fetchInvitations();
  };

  return { invitations, sendInvite, respondInvite };
}

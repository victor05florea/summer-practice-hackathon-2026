import { useCallback, useEffect, useState } from "react";
import { supabase } from "../services/supabase";
import { type Message } from "../types";

export function useChat(groupId: string | null, userId: string) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!groupId) {
      setMessages([]);
      return;
    }
    setLoading(true);
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .eq("group_id", groupId)
        .order("created_at", { ascending: true });
      if (cancelled) return;
      if (error) console.error("fetchMessages", error);
      setMessages(data ?? []);
      setLoading(false);
    })();

    const channel = supabase
      .channel(`chat:${groupId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `group_id=eq.${groupId}`,
        },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as Message]);
        },
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [groupId]);

  const send = useCallback(
    async (content: string) => {
      const text = content.trim();
      if (!text || !groupId) return;
      const { error } = await supabase.from("messages").insert({
        group_id: groupId,
        user_id: userId,
        content: text,
      });
      if (error) console.error("sendMessage", error);
    },
    [groupId, userId],
  );

  return { messages, loading, send };
}

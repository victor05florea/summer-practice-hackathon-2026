import { useEffect, useRef, useState } from "react";
import { type Group, type Profile } from "../types";
import { sportIcon } from "../constants/sports";
import { useChat } from "../hooks/useChat";
import { initials } from "../lib/format";

interface Props {
  group: Group;
  me: Profile;
  memberDetails: Record<string, Profile>;
  onClose: () => void;
}

export default function ChatModal({ group, me, memberDetails, onClose }: Props) {
  const { messages, loading, send } = useChat(group.id, me.id);
  const [text, setText] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages.length]);

  const handleSend = async () => {
    if (!text.trim()) return;
    const value = text;
    setText("");
    await send(value);
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-[#1a1f26] w-full max-w-md rounded-3xl border border-[#2a3038] shadow-2xl flex flex-col h-[500px] overflow-hidden"
      >
        <div className="p-4 border-b border-[#2a3038] flex items-center justify-between bg-[#0f1419]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#1a1f26] border border-[#2a3038] flex items-center justify-center text-xl">
              {sportIcon(group.sport)}
            </div>
            <div>
              <h3 className="font-bold text-gray-100 leading-tight">
                {group.sport} Room
              </h3>
              <p className="text-xs text-emerald-400 font-medium">
                {group.members.length} players inside
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#2a3038] text-gray-400 hover:text-white flex items-center justify-center"
          >
            ✕
          </button>
        </div>

        <div
          ref={scrollRef}
          className="flex-1 p-4 overflow-y-auto space-y-3 bg-[#1a1f26]"
        >
          {loading && (
            <p className="text-xs text-gray-500 text-center">Loading...</p>
          )}
          {!loading && messages.length === 0 && (
            <p className="text-xs text-gray-500 text-center">
              No messages yet. Say hi 👋
            </p>
          )}
          {messages.map((m) => {
            const mine = m.user_id === me.id;
            const author = memberDetails[m.user_id];
            const name = author?.username ?? "User";
            return (
              <div
                key={m.id}
                className={`flex gap-2 ${mine ? "flex-row-reverse" : ""}`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                    mine
                      ? "bg-emerald-500/20 text-emerald-400"
                      : "bg-indigo-500/20 text-indigo-400"
                  }`}
                >
                  {initials(name)}
                </div>
                <div
                  className={`max-w-[75%] p-2.5 text-sm border ${
                    mine
                      ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-100 rounded-2xl rounded-tr-sm"
                      : "bg-[#2a3038] border-[#3e4550] text-gray-200 rounded-2xl rounded-tl-sm"
                  }`}
                >
                  {!mine && (
                    <p className="text-[10px] text-gray-400 mb-0.5 font-bold">
                      {name}
                    </p>
                  )}
                  <p className="whitespace-pre-wrap break-words">{m.content}</p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="p-3 border-t border-[#2a3038] bg-[#0f1419]">
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Write a message..."
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              className="flex-1 bg-[#1a1f26] border border-[#2a3038] rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
            />
            <button
              onClick={handleSend}
              disabled={!text.trim()}
              className="bg-emerald-500 disabled:opacity-50 text-white px-5 py-2 rounded-xl text-sm font-bold shadow-lg shadow-emerald-500/20 hover:bg-emerald-600 transition-colors"
            >
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

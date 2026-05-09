import { useState } from "react";
import { type Group, type Profile } from "../types";
import { sportIcon, sportSize } from "../constants/sports";
import { supabase } from "../services/supabase";
import {
  getEventSuggestions,
  getWelcomeMessage,
  getIcebreaker,
} from "../services/ollama";
import { initials } from "../lib/format";

interface Props {
  sport: string;
  group: Group | undefined;
  profile: Profile;
  memberDetails: Record<string, Profile>;
  onChange: () => void;
  onOpenChat: (group: Group) => void;
  onSelectProfile: (profile: Profile) => void;
}

export default function GroupCard({
  sport,
  group,
  profile,
  memberDetails,
  onChange,
  onOpenChat,
  onSelectProfile,
}: Props) {
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);
  const [tempLocation, setTempLocation] = useState("");
  const [tempTime, setTempTime] = useState("");
  const [aiBusy, setAiBusy] = useState(false);
  const [aiReply, setAiReply] = useState("");

  const isCaptain = group?.captain_id === profile.id;
  const isMember = !!group?.members.includes(profile.id);
  const memberCount = group?.members.length ?? 0;
  const maxSize = group?.max_size ?? sportSize(sport);
  const isFull = !!group && memberCount >= maxSize;
  const fillPercent = (memberCount / maxSize) * 100;

  const createGroup = async () => {
    const { error } = await supabase.from("groups").insert({
      sport,
      captain_id: profile.id,
      members: [profile.id],
      status: "open",
      max_size: sportSize(sport),
    });
    if (error) console.error("createGroup", error);
    onChange();
  };

  const joinGroup = async () => {
    if (!group || isMember || isFull) return;
    const { error } = await supabase
      .from("groups")
      .update({ members: [...group.members, profile.id] })
      .eq("id", group.id);
    if (error) console.error("joinGroup", error);
    onChange();
  };

  const leaveGroup = async () => {
    if (!group) return;
    const remaining = group.members.filter((id) => id !== profile.id);
    if (remaining.length === 0) {
      const { error } = await supabase
        .from("groups")
        .delete()
        .eq("id", group.id);
      if (error) console.error("deleteGroup", error);
    } else {
      const updates: Partial<Group> = { members: remaining };
      if (group.captain_id === profile.id) updates.captain_id = remaining[0];
      const { error } = await supabase
        .from("groups")
        .update(updates)
        .eq("id", group.id);
      if (error) console.error("leaveGroup", error);
    }
    onChange();
  };

  const startEdit = () => {
    if (!group) return;
    setTempLocation(group.location ?? "");
    setTempTime(group.event_time ?? "");
    setEditing(true);
  };

  const saveDetails = async () => {
    if (!group) return;
    const { error } = await supabase
      .from("groups")
      .update({ location: tempLocation, event_time: tempTime })
      .eq("id", group.id);
    if (error) console.error("saveDetails", error);
    setEditing(false);
    onChange();
  };

  const askAI = async (kind: "venues" | "welcome" | "icebreaker") => {
    if (!group) return;
    setAiBusy(true);
    setAiReply("");
    let res = "";
    if (kind === "venues") res = await getEventSuggestions(sport, profile.city);
    if (kind === "welcome")
      res = await getWelcomeMessage(sport, group.members.length);
    if (kind === "icebreaker") res = await getIcebreaker(sport);
    setAiReply(res);
    setAiBusy(false);
  };

  return (
    <div
      className={`bg-[#1a1f26] rounded-2xl border transition-all duration-300 overflow-hidden flex flex-col ${
        isMember
          ? "border-emerald-500/40 shadow-lg shadow-emerald-500/5"
          : "border-[#2a3038] hover:border-[#3e4550]"
      } ${isMember && expanded ? "md:col-span-2" : ""}`}
    >
      <div className="p-4 flex-1">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#0f1419] border border-[#2a3038] flex items-center justify-center text-xl shadow-inner">
              {sportIcon(sport)}
            </div>
            <div>
              <p className="text-base font-bold text-gray-100">{sport}</p>
              {isCaptain && (
                <p className="text-[10px] text-amber-400 font-bold uppercase tracking-wider">
                  👑 Captain
                </p>
              )}
            </div>
          </div>
          {isMember && group && (
            <button
              onClick={() => onOpenChat(group)}
              className="w-8 h-8 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center justify-center hover:bg-indigo-500/20 transition-colors"
              title="Open chat"
            >
              💬
            </button>
          )}
        </div>

        {group ? (
          <div className="mb-4">
            <div className="flex justify-between text-xs font-medium text-gray-400 mb-1.5">
              <span>
                {memberCount} of {maxSize} joined
              </span>
              <span className={fillPercent >= 100 ? "text-emerald-400" : ""}>
                {Math.round(fillPercent)}%
              </span>
            </div>
            <div className="h-2 bg-[#0f1419] rounded-full overflow-hidden border border-[#2a3038]">
              <div
                className="h-full bg-emerald-500 transition-all duration-500 rounded-full"
                style={{ width: `${fillPercent}%` }}
              />
            </div>
          </div>
        ) : (
          <p className="text-sm text-gray-500 mb-4 italic mt-2">
            No active room.
          </p>
        )}

        <div className="flex gap-2">
          {group ? (
            isMember ? (
              <>
                <button
                  onClick={() => setExpanded((v) => !v)}
                  className="flex-1 py-2 bg-[#2a3038] hover:bg-[#343b45] text-gray-300 text-xs font-bold uppercase tracking-wide rounded-xl transition-colors border border-[#3e4550]"
                >
                  {expanded ? "Collapse" : "Details"}
                </button>
                <button
                  onClick={leaveGroup}
                  className="px-4 py-2 bg-[#0f1419] hover:bg-red-500/10 text-gray-400 hover:text-red-400 text-xs font-bold uppercase tracking-wide rounded-xl transition-colors border border-[#2a3038]"
                >
                  Leave
                </button>
              </>
            ) : isFull ? (
              <button
                disabled
                className="w-full py-2 bg-[#0f1419] text-gray-600 text-xs font-bold uppercase tracking-wide rounded-xl border border-[#2a3038]"
              >
                Event Full
              </button>
            ) : (
              <button
                onClick={joinGroup}
                className="w-full py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold uppercase tracking-wide rounded-xl transition-colors shadow-lg shadow-emerald-500/20"
              >
                Join Event
              </button>
            )
          ) : (
            <button
              onClick={createGroup}
              className="w-full py-2 bg-[#2a3038] hover:bg-[#343b45] text-gray-300 text-xs font-bold uppercase tracking-wide rounded-xl transition-colors border border-[#3e4550]"
            >
              Start Event
            </button>
          )}
        </div>
      </div>

      {group && isMember && expanded && (
        <div className="border-t border-[#2a3038] bg-[#0a0e13] p-4 flex flex-col md:flex-row gap-6">
          <div className="flex-1 space-y-2">
            <p className="text-xs font-bold uppercase tracking-wider text-gray-500">
              Roster
            </p>
            <div className="space-y-1.5">
              {group.members.map((memberId) => {
                const member = memberDetails[memberId];
                if (!member) return null;
                return (
                  <button
                    key={memberId}
                    onClick={() => onSelectProfile(member)}
                    className="w-full flex items-center gap-3 p-2 rounded-xl bg-[#0f1419] hover:bg-[#1a1f26] border border-[#2a3038] transition-colors text-left group"
                  >
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 text-white flex items-center justify-center text-xs font-bold">
                      {initials(member.username)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-200 group-hover:text-emerald-400 transition-colors truncate">
                        {member.username}{" "}
                        {memberId === group.captain_id && "👑"}
                      </p>
                      <p className="text-[10px] text-gray-500 truncate uppercase tracking-wide">
                        {member.skill_level}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex-1 space-y-3">
            <p className="text-xs font-bold uppercase tracking-wider text-gray-500">
              Logistics
            </p>
            {!editing ? (
              <div className="space-y-2 bg-[#0f1419] rounded-xl p-3 border border-[#2a3038]">
                <div className="flex gap-2 text-sm">
                  <span className="text-gray-500">📍</span>
                  <span className="text-gray-200">
                    {group.location ?? "TBD"}
                  </span>
                </div>
                <div className="flex gap-2 text-sm">
                  <span className="text-gray-500">🕐</span>
                  <span className="text-gray-200">
                    {group.event_time ?? "TBD"}
                  </span>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <input
                  type="text"
                  placeholder="Location"
                  value={tempLocation}
                  onChange={(e) => setTempLocation(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-[#0f1419] border border-[#2a3038] rounded-xl text-white focus:outline-none focus:border-emerald-500"
                />
                <input
                  type="text"
                  placeholder="Time"
                  value={tempTime}
                  onChange={(e) => setTempTime(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-[#0f1419] border border-[#2a3038] rounded-xl text-white focus:outline-none focus:border-emerald-500"
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => setEditing(false)}
                    className="flex-1 py-2 bg-[#2a3038] text-gray-300 text-xs font-bold rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={saveDetails}
                    className="flex-1 py-2 bg-emerald-500 text-white text-xs font-bold rounded-xl"
                  >
                    Save
                  </button>
                </div>
              </div>
            )}

            {isCaptain && !editing && (
              <button
                onClick={startEdit}
                className="w-full py-2 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 text-xs font-bold uppercase tracking-wider rounded-xl border border-amber-500/20 transition-colors"
              >
                Edit Details
              </button>
            )}

            {isCaptain && (
              <div className="pt-2 space-y-2 border-t border-[#2a3038]">
                <p className="text-[10px] font-bold uppercase tracking-wider text-purple-400/70">
                  AI Assistant
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => askAI("venues")}
                    disabled={aiBusy}
                    className="flex-1 py-1.5 bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 text-xs rounded-lg border border-purple-500/20 transition-colors disabled:opacity-50"
                  >
                    📍 Locations
                  </button>
                  <button
                    onClick={() => askAI("welcome")}
                    disabled={aiBusy}
                    className="flex-1 py-1.5 bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 text-xs rounded-lg border border-purple-500/20 transition-colors disabled:opacity-50"
                  >
                    💬 Welcome
                  </button>
                </div>
                <button
                  onClick={() => askAI("icebreaker")}
                  disabled={aiBusy}
                  className="w-full py-1.5 bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 text-xs rounded-lg border border-purple-500/20 transition-colors disabled:opacity-50"
                >
                  ✨ Icebreaker
                </button>
              </div>
            )}

            {(aiBusy || aiReply) && (
              <div className="p-3 bg-purple-500/10 border border-purple-500/30 rounded-xl mt-2">
                <p className="text-xs text-purple-200 leading-relaxed whitespace-pre-wrap">
                  {aiBusy ? "Thinking..." : aiReply}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

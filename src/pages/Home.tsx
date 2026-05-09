import { useState, useRef, useEffect } from "react";
import { supabase } from "../services/supabase";
import { type Profile, type Group } from "../types";
import { getEventSuggestions, getWelcomeMessage } from "../services/ollama";

const SPORT_SIZES: Record<string, number> = {
  Football: 10,
  Basketball: 10,
  Tennis: 4,
  Volleyball: 12,
  Padel: 4,
  Running: 8,
  Cycling: 8,
  Swimming: 6,
};

interface Props {
  profile: Profile;
  onNavigate: (page: "home" | "profile") => void;
}

export default function Home({ profile, onNavigate }: Props) {
  const [available, setAvailable] = useState(profile.available_today);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [people, setPeople] = useState<Profile[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [editingGroup, setEditingGroup] = useState<string | null>(null);
  const [tempLocation, setTempLocation] = useState("");
  const [tempTime, setTempTime] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [aiLoading, setAiLoading] = useState<string | null>(null);
  const [aiResponse, setAiResponse] = useState<Record<string, string>>({});

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  useEffect(() => {
    fetchPeople();
    if (available) fetchGroups();
  }, [profile.city, profile.sports, available]);

  const fetchPeople = async () => {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .neq("id", profile.id)
      .eq("city", profile.city)
      .overlaps("sports", profile.sports || []);
    setPeople(data || []);
  };

  const fetchGroups = async () => {
    if (!profile.sports || profile.sports.length === 0) return;
    const { data } = await supabase
      .from("groups")
      .select("*")
      .eq("status", "open")
      .in("sport", profile.sports);
    setGroups(data || []);
  };

  const handleAvailability = async (value: boolean) => {
    setAvailable(value);
    await supabase
      .from("profiles")
      .update({ available_today: value })
      .eq("id", profile.id);
  };

  const createGroup = async (sport: string) => {
    await supabase.from("groups").insert({
      sport,
      captain_id: profile.id,
      members: [profile.id],
      status: "open",
      max_size: SPORT_SIZES[sport] || 10,
    });
    fetchGroups();
  };

  const joinGroup = async (group: Group) => {
    if (group.members?.includes(profile.id)) return;
    if (group.members && group.members.length >= group.max_size) return;
    const updatedMembers = [...(group.members || []), profile.id];
    await supabase
      .from("groups")
      .update({ members: updatedMembers })
      .eq("id", group.id);
    fetchGroups();
  };

  const leaveGroup = async (group: Group) => {
    const updatedMembers = (group.members || []).filter(
      (id) => id !== profile.id,
    );
    if (updatedMembers.length === 0) {
      await supabase.from("groups").delete().eq("id", group.id);
    } else {
      const updates: any = { members: updatedMembers };
      if (group.captain_id === profile.id) {
        updates.captain_id = updatedMembers[0];
      }
      await supabase.from("groups").update(updates).eq("id", group.id);
    }
    fetchGroups();
  };

  const startEdit = (group: Group) => {
    setEditingGroup(group.id);
    setTempLocation(group.location || "");
    setTempTime(group.event_time || "");
  };

  const saveDetails = async (groupId: string) => {
    await supabase
      .from("groups")
      .update({ location: tempLocation, event_time: tempTime })
      .eq("id", groupId);
    setEditingGroup(null);
    fetchGroups();
  };

  const askAIForLocation = async (group: Group) => {
    setAiLoading(group.id);
    const suggestion = await getEventSuggestions(group.sport, profile.city);
    setAiResponse((prev) => ({ ...prev, [group.id]: suggestion }));
    setAiLoading(null);
  };

  const askAIForWelcome = async (group: Group) => {
    setAiLoading(group.id);
    const msg = await getWelcomeMessage(
      group.sport,
      group.members?.length || 1,
    );
    setAiResponse((prev) => ({ ...prev, [group.id]: msg }));
    setAiLoading(null);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 18) return "Good afternoon";
    return "Good evening";
  };

  const initials = (name: string) => name.slice(0, 2).toUpperCase();

  return (
    <div className="min-h-screen bg-[#0f1419]">
      <nav className="bg-[#1a1f26] border-b border-[#2a3038] px-6 h-14 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-emerald-500 rounded-lg flex items-center justify-center">
            <span className="text-white text-sm">🏃</span>
          </div>
          <span className="text-base font-semibold text-gray-100">
            ShowUp2Move
          </span>
        </div>

        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="w-9 h-9 rounded-full bg-emerald-500/15 flex items-center justify-center hover:bg-emerald-500/25 transition-colors"
          >
            <span className="text-emerald-400 text-lg">👤</span>
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 top-12 bg-[#1a1f26] border border-[#2a3038] rounded-xl shadow-lg p-1.5 min-w-44 z-10">
              <div className="px-3 py-2 border-b border-[#2a3038] mb-1">
                <p className="text-sm font-medium text-gray-100">
                  {profile.username}
                </p>
                <p className="text-xs text-gray-500">
                  {profile.city || "No city set"}
                </p>
              </div>
              <button
                onClick={() => {
                  setDropdownOpen(false);
                  onNavigate("profile");
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-300 hover:bg-[#0f1419] rounded-lg transition-colors"
              >
                <span>⚙️</span> My profile
              </button>
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
              >
                <span>🚪</span> Logout
              </button>
            </div>
          )}
        </div>
      </nav>

      <div className="max-w-lg mx-auto px-4 py-5 flex flex-col gap-3.5">
        <div className="bg-[#1a1f26] rounded-2xl border border-[#2a3038] p-5">
          <p className="text-sm text-gray-400">{greeting()},</p>
          <h1 className="text-2xl font-semibold text-gray-100 mt-1 mb-4">
            {profile.username}
          </h1>

          <div className="bg-[#0f1419] rounded-xl p-4 border border-[#2a3038]">
            <p className="text-sm font-medium text-gray-100 mb-1">
              Are you showing up today?
            </p>
            <p className="text-xs text-gray-500 mb-3">
              Match instantly with your local crew
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => handleAvailability(true)}
                className={`flex-1 py-3 rounded-xl text-sm font-medium transition-all ${
                  available
                    ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20"
                    : "bg-[#2a3038] text-gray-400 hover:bg-[#343b45]"
                }`}
              >
                Yes, I'm in!
              </button>
              <button
                onClick={() => handleAvailability(false)}
                className={`flex-1 py-3 rounded-xl text-sm font-medium transition-all ${
                  !available
                    ? "bg-gray-600 text-white"
                    : "bg-[#2a3038] text-gray-400 hover:bg-[#343b45]"
                }`}
              >
                Not today
              </button>
            </div>
          </div>
        </div>

        {available && (
          <div className="bg-[#1a1f26] rounded-2xl border border-emerald-500/30 p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-medium text-gray-100">
                Lobbies for you
              </p>
              <span className="text-xs text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-full">
                Live
              </span>
            </div>

            <div className="flex flex-col gap-3">
              {profile.sports?.map((sport) => {
                const existingGroup = groups.find((g) => g.sport === sport);
                const isCaptain = existingGroup?.captain_id === profile.id;
                const isMember = existingGroup?.members?.includes(profile.id);
                const isFull =
                  existingGroup &&
                  existingGroup.members?.length >= existingGroup.max_size;
                const isEditing = editingGroup === existingGroup?.id;

                return (
                  <div
                    key={sport}
                    className="bg-[#0f1419] rounded-xl border border-[#2a3038] overflow-hidden"
                  >
                    <div className="flex items-center justify-between p-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-gray-100">
                            {sport}
                          </p>
                          {isCaptain && (
                            <span title="You are the captain">👑</span>
                          )}
                        </div>
                        {existingGroup ? (
                          <p className="text-xs text-gray-400 mt-0.5">
                            {existingGroup.members?.length || 1}/
                            {existingGroup.max_size} players
                          </p>
                        ) : (
                          <p className="text-xs text-gray-500 mt-0.5">
                            No active lobby
                          </p>
                        )}
                      </div>

                      {existingGroup ? (
                        isMember ? (
                          <button
                            onClick={() => leaveGroup(existingGroup)}
                            className="px-4 py-1.5 bg-[#2a3038] hover:bg-red-500/20 text-gray-300 hover:text-red-400 text-xs font-medium rounded-lg transition-colors"
                          >
                            Leave
                          </button>
                        ) : isFull ? (
                          <span className="px-4 py-1.5 bg-[#2a3038] text-gray-500 text-xs font-medium rounded-lg">
                            Full
                          </span>
                        ) : (
                          <button
                            onClick={() => joinGroup(existingGroup)}
                            className="px-4 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-medium rounded-lg transition-colors"
                          >
                            Join
                          </button>
                        )
                      ) : (
                        <button
                          onClick={() => createGroup(sport)}
                          className="px-4 py-1.5 bg-[#2a3038] hover:bg-[#343b45] text-gray-200 text-xs font-medium rounded-lg transition-colors border border-[#343b45]"
                        >
                          Start lobby
                        </button>
                      )}
                    </div>

                    {existingGroup && isMember && (
                      <div className="border-t border-[#2a3038] p-3 bg-[#0a0e13]">
                        {!isEditing ? (
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-gray-500">
                                📍 Location
                              </span>
                              <span className="text-xs text-gray-300">
                                {existingGroup.location || "Not set"}
                              </span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-gray-500">
                                🕐 Time
                              </span>
                              <span className="text-xs text-gray-300">
                                {existingGroup.event_time || "Not set"}
                              </span>
                            </div>
                            {isCaptain && (
                              <>
                                <button
                                  onClick={() => startEdit(existingGroup)}
                                  className="w-full mt-2 py-1.5 bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 text-xs font-medium rounded-lg transition-colors"
                                >
                                  {existingGroup.location ||
                                  existingGroup.event_time
                                    ? "Edit details"
                                    : "Set location & time"}
                                </button>

                                <div className="flex gap-2 mt-2">
                                  <button
                                    onClick={() =>
                                      askAIForLocation(existingGroup)
                                    }
                                    disabled={aiLoading === existingGroup.id}
                                    className="flex-1 py-1.5 bg-purple-500/15 hover:bg-purple-500/25 text-purple-400 text-xs font-medium rounded-lg transition-colors disabled:opacity-50"
                                  >
                                    ✨ AI: Suggest venues
                                  </button>
                                  <button
                                    onClick={() =>
                                      askAIForWelcome(existingGroup)
                                    }
                                    disabled={aiLoading === existingGroup.id}
                                    className="flex-1 py-1.5 bg-purple-500/15 hover:bg-purple-500/25 text-purple-400 text-xs font-medium rounded-lg transition-colors disabled:opacity-50"
                                  >
                                    ✨ AI: Welcome msg
                                  </button>
                                </div>

                                {aiLoading === existingGroup.id && (
                                  <p className="text-xs text-purple-400 mt-2 italic">
                                    AI is thinking...
                                  </p>
                                )}

                                {aiResponse[existingGroup.id] &&
                                  aiLoading !== existingGroup.id && (
                                    <div className="mt-2 p-3 bg-purple-500/10 border border-purple-500/30 rounded-lg">
                                      <p className="text-xs text-purple-300 whitespace-pre-wrap">
                                        {aiResponse[existingGroup.id]}
                                      </p>
                                    </div>
                                  )}
                              </>
                            )}
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <input
                              type="text"
                              placeholder="Location (e.g. Parcul Central)"
                              value={tempLocation}
                              onChange={(e) => setTempLocation(e.target.value)}
                              className="w-full px-3 py-2 text-xs bg-[#0f1419] border border-[#2a3038] rounded-lg text-gray-100 focus:outline-none focus:border-emerald-500"
                            />
                            <input
                              type="text"
                              placeholder="Time (e.g. 18:00)"
                              value={tempTime}
                              onChange={(e) => setTempTime(e.target.value)}
                              className="w-full px-3 py-2 text-xs bg-[#0f1419] border border-[#2a3038] rounded-lg text-gray-100 focus:outline-none focus:border-emerald-500"
                            />
                            <div className="flex gap-2">
                              <button
                                onClick={() => setEditingGroup(null)}
                                className="flex-1 py-1.5 bg-[#2a3038] text-gray-300 text-xs rounded-lg hover:bg-[#343b45]"
                              >
                                Cancel
                              </button>
                              <button
                                onClick={() => saveDetails(existingGroup.id)}
                                className="flex-1 py-1.5 bg-emerald-500 text-white text-xs rounded-lg hover:bg-emerald-600"
                              >
                                Save
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="bg-[#1a1f26] rounded-2xl border border-[#2a3038] p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium text-gray-100">People near you</p>
            <span className="text-xs text-gray-500">
              {profile.city || "Unknown City"} · {people.length}{" "}
              {people.length === 1 ? "match" : "matches"}
            </span>
          </div>

          {people.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-sm text-gray-500">
                No matches yet in your area.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-1">
              {people.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-[#0f1419] cursor-pointer transition-colors"
                >
                  <div className="w-10 h-10 rounded-full bg-emerald-500/15 text-emerald-400 flex items-center justify-center text-sm font-medium">
                    {initials(p.username)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-100 truncate">
                      {p.username}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {p.sports?.slice(0, 2).join(", ")} · {p.skill_level}
                    </p>
                  </div>
                  <div
                    className={`w-2 h-2 rounded-full ${p.available_today ? "bg-emerald-400" : "bg-gray-600"}`}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

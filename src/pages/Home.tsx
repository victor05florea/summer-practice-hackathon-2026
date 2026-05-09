import { useState, useRef, useEffect } from "react";
import { supabase } from "../services/supabase";
import { type Profile, type Group } from "../types";
// Importurile actualizate conform cerinței tale
import {
  getEventSuggestions,
  getWelcomeMessage,
  getDailyMotivation,
  getCompatibility,
  getIcebreaker,
} from "../services/ollama";

const SPORT_SIZES: Record<string, number> = {
  Football: 10,
  Basketball: 10,
  Tennis: 4,
  Volleyball: 12,
  Padel: 4,
  Running: 8,
  Cycling: 8,
  Swimming: 6,
  Golf: 4,
  Hiking: 10,
  Yoga: 15,
  Gym: 6,
  Calisthenics: 8,
  Skateboarding: 6,
  Skiing: 8,
  Boxing: 4,
  Badminton: 4,
};

const SPORT_ICONS: Record<string, string> = {
  Football: "⚽",
  Basketball: "🏀",
  Tennis: "🎾",
  Volleyball: "🏐",
  Padel: "🎾",
  Running: "🏃",
  Cycling: "🚴",
  Swimming: "🏊",
  Golf: "⛳",
  Hiking: "🥾",
  Yoga: "🧘",
  Gym: "💪",
  Calisthenics: "🤸",
  Skateboarding: "🛹",
  Skiing: "⛷️",
  Boxing: "🥊",
  Badminton: "🏸",
};

interface Props {
  profile: Profile;
  onNavigate: (page: "home" | "profile") => void;
}

export default function Home({ profile, onNavigate }: Props) {
  // State
  const [available, setAvailable] = useState(profile.available_today);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  const [people, setPeople] = useState<Profile[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [memberDetails, setMemberDetails] = useState<Record<string, Profile>>(
    {},
  );

  const [expandedGroup, setExpandedGroup] = useState<string | null>(null);
  const [editingGroup, setEditingGroup] = useState<string | null>(null);
  const [tempLocation, setTempLocation] = useState("");
  const [tempTime, setTempTime] = useState("");

  const [aiLoading, setAiLoading] = useState<string | null>(null);
  const [aiResponse, setAiResponse] = useState<Record<string, string>>({});

  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);
  const [chatGroup, setChatGroup] = useState<Group | null>(null);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  const notifications = [
    "Andrei invited you to play Tennis.",
    "A Football group is missing 1 player nearby!",
  ];

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      )
        setDropdownOpen(false);
      if (notifRef.current && !notifRef.current.contains(e.target as Node))
        setNotificationsOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  useEffect(() => {
    fetchPeople();
    if (available) fetchGroups();
  }, [profile.city, profile.sports, available]);

  useEffect(() => {
    fetchMemberDetails();
  }, [groups]);

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

  const fetchMemberDetails = async () => {
    const allMemberIds = new Set<string>();
    groups.forEach((g) => g.members?.forEach((id) => allMemberIds.add(id)));
    if (allMemberIds.size === 0) return;
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .in("id", Array.from(allMemberIds));
    if (data) {
      const map: Record<string, Profile> = {};
      data.forEach((p) => {
        map[p.id] = p;
      });
      setMemberDetails(map);
    }
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
    if (
      group.members?.includes(profile.id) ||
      (group.members && group.members.length >= group.max_size)
    )
      return;
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
      if (group.captain_id === profile.id)
        updates.captain_id = updatedMembers[0];
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

  // --- FUNCTIILE AI ACTUALIZATE CONFORM CERINTEI ---
  const askAIDailyTip = async () => {
    setAiLoading("daily-tip");
    const msg = await getDailyMotivation(
      profile.username,
      profile.sports || [],
    );
    setAiResponse((prev) => ({ ...prev, "daily-tip": msg }));
    setAiLoading(null);
  };

  const askAIForLocation = async (group: Group) => {
    setAiLoading(group.id);
    const res = await getEventSuggestions(group.sport, profile.city);
    setAiResponse((prev) => ({ ...prev, [group.id]: res }));
    setAiLoading(null);
  };

  const askAIForWelcome = async (group: Group) => {
    setAiLoading(group.id);
    const res = await getWelcomeMessage(
      group.sport,
      group.members?.length || 1,
    );
    setAiResponse((prev) => ({ ...prev, [group.id]: res }));
    setAiLoading(null);
  };

  const askAIForIcebreaker = async (group: Group) => {
    setAiLoading(group.id);
    const msg = await getIcebreaker(group.sport);
    setAiResponse((prev) => ({ ...prev, [group.id]: msg }));
    setAiLoading(null);
  };

  const askAICompatibility = async (other: Profile) => {
    setAiLoading("compatibility");
    const msg = await getCompatibility(
      profile.sports || [],
      profile.skill_level || "Beginner",
      other.username,
      other.sports || [],
      other.skill_level || "Beginner",
    );
    setAiResponse((prev) => ({ ...prev, compatibility: msg }));
    setAiLoading(null);
  };
  // ---------------------------------------------------

  const handleLogout = async () => await supabase.auth.signOut();

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 18) return "Good afternoon";
    return "Good evening";
  };

  const initials = (name: string) => name.slice(0, 2).toUpperCase();

  const sortedSports = [...(profile.sports || [])].sort((a, b) => {
    const groupA = groups.find((g) => g.sport === a);
    const groupB = groups.find((g) => g.sport === b);
    if (groupA && !groupB) return -1;
    if (!groupA && groupB) return 1;
    return 0;
  });

  return (
    <div className="min-h-screen bg-[#0f1419] pb-10">
      {/* NAVBAR */}
      <nav className="bg-[#1a1f26] border-b border-[#2a3038] px-6 h-16 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <div className="flex flex-col">
            <span className="text-xs text-gray-400 font-medium">
              {greeting()},
            </span>
            <span className="text-sm font-bold text-emerald-400">
              {profile.username}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={askAIDailyTip}
            disabled={aiLoading === "daily-tip"}
            className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 text-xs font-medium rounded-lg transition-colors border border-purple-500/20"
          >
            ✨ Daily Motivation
          </button>

          {/* Notifications */}
          <div className="relative" ref={notifRef}>
            <button
              onClick={() => setNotificationsOpen(!notificationsOpen)}
              className="relative p-2 text-gray-400 hover:text-white transition-colors"
            >
              🔔
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-[#1a1f26]"></span>
            </button>
            {notificationsOpen && (
              <div className="absolute right-0 top-12 bg-[#1a1f26] border border-[#2a3038] rounded-xl shadow-lg p-3 w-64 z-50">
                <p className="text-xs font-semibold text-gray-400 uppercase mb-2">
                  Notifications
                </p>
                <div className="space-y-2">
                  {notifications.map((notif, idx) => (
                    <div
                      key={idx}
                      className="p-2 bg-[#0f1419] rounded-lg border border-[#2a3038] text-xs text-gray-300"
                    >
                      {notif}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Profile Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="w-9 h-9 rounded-full bg-emerald-500/15 flex items-center justify-center border border-emerald-500/30 hover:bg-emerald-500/25 transition-colors"
            >
              <span className="text-emerald-400 text-sm font-semibold">
                {initials(profile.username)}
              </span>
            </button>
            {dropdownOpen && (
              <div className="absolute right-0 top-12 bg-[#1a1f26] border border-[#2a3038] rounded-xl shadow-lg p-1.5 min-w-44 z-50">
                <button
                  onClick={() => {
                    setDropdownOpen(false);
                    onNavigate("profile");
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-300 hover:bg-[#0f1419] rounded-lg transition-colors"
                >
                  <span>⚙️</span> Edit Profile
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
        </div>
      </nav>

      {/* AI TIP BANNER */}
      {aiResponse["daily-tip"] && (
        <div className="max-w-2xl mx-auto mt-4 px-4">
          <div className="p-3 bg-purple-500/10 border border-purple-500/20 rounded-xl text-center shadow-lg">
            <p className="text-sm text-purple-200 italic">
              "{aiResponse["daily-tip"]}"
            </p>
          </div>
        </div>
      )}

      {/* HERO SECTION */}
      <div className="max-w-2xl mx-auto px-4 py-10 md:py-14 text-center">
        <h1 className="text-3xl md:text-5xl font-extrabold text-white mb-8 tracking-tight">
          ARE YOU SHOWING UP <span className="text-emerald-500">TODAY?</span>
        </h1>

        <div className="flex items-center justify-center gap-5">
          <span
            className={`text-sm font-bold uppercase tracking-wide transition-colors ${!available ? "text-gray-400" : "text-gray-600"}`}
          >
            Not today
          </span>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              className="sr-only peer"
              checked={available}
              onChange={(e) => handleAvailability(e.target.checked)}
            />
            <div className="w-24 h-12 bg-[#2a3038] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-emerald-500 after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:rounded-full after:h-10 after:w-10 after:transition-all shadow-inner border border-[#1a1f26]"></div>
          </label>
          <span
            className={`text-sm font-bold uppercase tracking-wide transition-colors ${available ? "text-emerald-400" : "text-gray-600"}`}
          >
            Yes, I'm in
          </span>
        </div>
      </div>

      {/* MAIN LAYOUT */}
      {available && (
        <div className="max-w-6xl mx-auto px-4 flex flex-col lg:flex-row gap-6">
          {/* LOBBIES COLUMN */}
          <div className="flex-1 space-y-4">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-xl font-bold text-gray-100">Live Rooms</h2>
              <span className="text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full animate-pulse border border-emerald-500/20">
                Matching Active
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {sortedSports.map((sport) => {
                const existingGroup = groups.find((g) => g.sport === sport);
                const isCaptain = existingGroup?.captain_id === profile.id;
                const isMember = existingGroup?.members?.includes(profile.id);
                const isFull =
                  existingGroup &&
                  existingGroup.members?.length >= existingGroup.max_size;
                const isEditing = editingGroup === existingGroup?.id;
                const isExpanded = expandedGroup === existingGroup?.id;
                const memberCount = existingGroup?.members?.length || 0;
                const maxSize =
                  existingGroup?.max_size || SPORT_SIZES[sport] || 10;
                const fillPercent = (memberCount / maxSize) * 100;

                return (
                  <div
                    key={sport}
                    className={`bg-[#1a1f26] rounded-2xl border transition-all duration-300 overflow-hidden flex flex-col ${isMember ? "border-emerald-500/40 shadow-lg shadow-emerald-500/5" : "border-[#2a3038] hover:border-[#3e4550]"} ${isMember && isExpanded ? "md:col-span-2" : ""}`}
                  >
                    {/* Compact Card Header */}
                    <div className="p-4 flex-1">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-[#0f1419] border border-[#2a3038] flex items-center justify-center text-xl shadow-inner">
                            {SPORT_ICONS[sport] || "🏃"}
                          </div>
                          <div>
                            <p className="text-base font-bold text-gray-100">
                              {sport}
                            </p>
                            {isCaptain && (
                              <p className="text-[10px] text-amber-400 font-bold uppercase tracking-wider">
                                👑 Captain
                              </p>
                            )}
                          </div>
                        </div>
                        {isMember && (
                          <button
                            onClick={() => setChatGroup(existingGroup ?? null)}
                            className="w-8 h-8 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center justify-center hover:bg-indigo-500/20 transition-colors"
                          >
                            💬
                          </button>
                        )}
                      </div>

                      {existingGroup ? (
                        <div className="mb-4">
                          <div className="flex justify-between text-xs font-medium text-gray-400 mb-1.5">
                            <span>
                              {memberCount} of {maxSize} joined
                            </span>
                            <span
                              className={
                                fillPercent >= 100 ? "text-emerald-400" : ""
                              }
                            >
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
                        {existingGroup ? (
                          isMember ? (
                            <>
                              <button
                                onClick={() =>
                                  setExpandedGroup(
                                    isExpanded ? null : existingGroup.id,
                                  )
                                }
                                className="flex-1 py-2 bg-[#2a3038] hover:bg-[#343b45] text-gray-300 text-xs font-bold uppercase tracking-wide rounded-xl transition-colors border border-[#3e4550]"
                              >
                                {isExpanded ? "Hide" : "Details"}
                              </button>
                              <button
                                onClick={() => leaveGroup(existingGroup)}
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
                              Room Full
                            </button>
                          ) : (
                            <button
                              onClick={() => joinGroup(existingGroup)}
                              className="w-full py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold uppercase tracking-wide rounded-xl transition-colors shadow-lg shadow-emerald-500/20"
                            >
                              Join Room
                            </button>
                          )
                        ) : (
                          <button
                            onClick={() => createGroup(sport)}
                            className="w-full py-2 bg-[#2a3038] hover:bg-[#343b45] text-gray-300 text-xs font-bold uppercase tracking-wide rounded-xl transition-colors border border-[#3e4550]"
                          >
                            Start Room
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Expanded Details / AI Section */}
                    {existingGroup && isMember && isExpanded && (
                      <div className="border-t border-[#2a3038] bg-[#0a0e13] p-4 flex flex-col md:flex-row gap-6">
                        {/* Column 1: Members */}
                        <div className="flex-1 space-y-2">
                          <p className="text-xs font-bold uppercase tracking-wider text-gray-500">
                            Roster
                          </p>
                          <div className="space-y-1.5">
                            {existingGroup.members?.map((memberId) => {
                              const member = memberDetails[memberId];
                              if (!member) return null;
                              return (
                                <button
                                  key={memberId}
                                  onClick={() => setSelectedProfile(member)}
                                  className="w-full flex items-center gap-3 p-2 rounded-xl bg-[#0f1419] hover:bg-[#1a1f26] border border-[#2a3038] transition-colors text-left group"
                                >
                                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 text-white flex items-center justify-center text-xs font-bold">
                                    {initials(member.username)}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold text-gray-200 group-hover:text-emerald-400 transition-colors truncate">
                                      {member.username}{" "}
                                      {memberId === existingGroup.captain_id &&
                                        "👑"}
                                    </p>
                                    <p className="text-[10px] text-gray-500 truncate uppercase tracking-wide">
                                      {member.skill_level || "Unknown skill"}
                                    </p>
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {/* Column 2: Logistics & AI */}
                        <div className="flex-1 space-y-3">
                          <p className="text-xs font-bold uppercase tracking-wider text-gray-500">
                            Logistics
                          </p>
                          {!isEditing ? (
                            <div className="space-y-2 bg-[#0f1419] rounded-xl p-3 border border-[#2a3038]">
                              <div className="flex gap-2 text-sm">
                                <span className="text-gray-500">📍</span>
                                <span className="text-gray-200">
                                  {existingGroup.location || "TBD"}
                                </span>
                              </div>
                              <div className="flex gap-2 text-sm">
                                <span className="text-gray-500">🕐</span>
                                <span className="text-gray-200">
                                  {existingGroup.event_time || "TBD"}
                                </span>
                              </div>
                            </div>
                          ) : (
                            <div className="space-y-2">
                              <input
                                type="text"
                                placeholder="Location"
                                value={tempLocation}
                                onChange={(e) =>
                                  setTempLocation(e.target.value)
                                }
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
                                  onClick={() => setEditingGroup(null)}
                                  className="flex-1 py-2 bg-[#2a3038] text-gray-300 text-xs font-bold rounded-xl"
                                >
                                  Cancel
                                </button>
                                <button
                                  onClick={() => saveDetails(existingGroup.id)}
                                  className="flex-1 py-2 bg-emerald-500 text-white text-xs font-bold rounded-xl"
                                >
                                  Save
                                </button>
                              </div>
                            </div>
                          )}

                          {isCaptain && !isEditing && (
                            <button
                              onClick={() => startEdit(existingGroup)}
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
                                  onClick={() =>
                                    askAIForLocation(existingGroup)
                                  }
                                  className="flex-1 py-1.5 bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 text-xs rounded-lg border border-purple-500/20 transition-colors"
                                >
                                  📍 Venues
                                </button>
                                <button
                                  onClick={() => askAIForWelcome(existingGroup)}
                                  className="flex-1 py-1.5 bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 text-xs rounded-lg border border-purple-500/20 transition-colors"
                                >
                                  💬 Welcome
                                </button>
                              </div>
                              <button
                                onClick={() =>
                                  askAIForIcebreaker(existingGroup)
                                }
                                className="w-full py-1.5 bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 text-xs rounded-lg border border-purple-500/20 transition-colors"
                              >
                                ✨ Icebreaker
                              </button>
                            </div>
                          )}

                          {aiResponse[existingGroup.id] && (
                            <div className="p-3 bg-purple-500/10 border border-purple-500/30 rounded-xl mt-2">
                              <p className="text-xs text-purple-200 leading-relaxed whitespace-pre-wrap">
                                {aiResponse[existingGroup.id]}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* NEARBY COLUMN */}
          <div className="w-full lg:w-80 flex-shrink-0">
            <div className="bg-[#1a1f26] rounded-2xl border border-[#2a3038] p-5 sticky top-24 shadow-lg shadow-black/10">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-lg font-bold text-gray-100">Nearby You</h2>
                <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-md border border-emerald-500/20">
                  {profile.city}
                </span>
              </div>
              <p className="text-xs text-gray-500 mb-4">
                {people.length} active players found
              </p>

              {people.length === 0 ? (
                <div className="text-center py-10 bg-[#0f1419] rounded-xl border border-[#2a3038] border-dashed">
                  <p className="text-sm text-gray-500">
                    No active players nearby.
                  </p>
                </div>
              ) : (
                <div className="flex flex-col gap-2 max-h-[600px] overflow-y-auto pr-1">
                  {people.map((p) => (
                    <div
                      key={p.id}
                      className="flex items-center justify-between p-2.5 bg-[#0f1419] rounded-xl border border-[#2a3038] hover:border-emerald-500/30 transition-colors group"
                    >
                      <div
                        onClick={() => setSelectedProfile(p)}
                        className="flex items-center gap-3 cursor-pointer flex-1 min-w-0"
                      >
                        <div className="relative">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 text-white flex items-center justify-center text-sm font-bold shadow-md">
                            {initials(p.username)}
                          </div>
                          <div
                            className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-[#0f1419] ${p.available_today ? "bg-emerald-400" : "bg-gray-500"}`}
                          />
                        </div>
                        <div className="min-w-0 pr-2">
                          <p className="text-sm font-bold text-gray-200 truncate group-hover:text-emerald-400 transition-colors">
                            {p.username}
                          </p>
                          <p className="text-[10px] uppercase tracking-wide text-gray-500 truncate">
                            {p.sports?.slice(0, 2).join(", ")}
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={() => alert(`Invite sent to ${p.username}!`)}
                        className="px-3 py-1.5 bg-[#2a3038] hover:bg-emerald-500 text-gray-300 hover:text-white text-xs font-bold rounded-lg transition-colors border border-[#3e4550] hover:border-emerald-500 shrink-0"
                      >
                        Invite
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODALS */}

      {/* Profile Read-Only Modal */}
      {selectedProfile && (
        <div
          onClick={() => setSelectedProfile(null)}
          className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-[#1a1f26] w-full max-w-sm rounded-3xl border border-[#2a3038] shadow-2xl overflow-hidden relative"
          >
            <button
              onClick={() => setSelectedProfile(null)}
              className="absolute top-4 right-4 w-8 h-8 bg-black/30 hover:bg-black/60 rounded-full text-white flex items-center justify-center transition-colors z-10"
            >
              ✕
            </button>
            <div className="bg-[#0f1419] h-24 border-b border-[#2a3038]"></div>

            <div className="px-6 pb-6 relative">
              <div className="w-24 h-24 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-2xl border-4 border-[#1a1f26] absolute -top-12 left-1/2 -translate-x-1/2 flex items-center justify-center text-3xl font-bold text-white shadow-xl">
                {initials(selectedProfile.username)}
              </div>

              <div className="pt-14 text-center">
                <h2 className="text-xl font-extrabold text-white">
                  {selectedProfile.username}
                </h2>
                <p className="text-sm text-gray-400 mb-4">
                  {selectedProfile.city} •{" "}
                  {selectedProfile.age
                    ? `${selectedProfile.age} y/o`
                    : "Age hidden"}
                </p>

                {selectedProfile.description && (
                  <p className="text-sm text-gray-300 bg-[#0f1419] p-3 rounded-xl border border-[#2a3038] mb-5 italic">
                    "{selectedProfile.description}"
                  </p>
                )}

                <div className="grid grid-cols-2 gap-3 mb-5">
                  <div className="bg-[#0f1419] p-3 rounded-xl border border-[#2a3038]">
                    <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider mb-1">
                      Skill
                    </p>
                    <p className="text-sm font-semibold text-emerald-400">
                      {selectedProfile.skill_level || "Unknown"}
                    </p>
                  </div>
                  <div className="bg-[#0f1419] p-3 rounded-xl border border-[#2a3038]">
                    <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider mb-1">
                      Status
                    </p>
                    <p
                      className={`text-sm font-semibold ${selectedProfile.available_today ? "text-emerald-400" : "text-gray-500"}`}
                    >
                      {selectedProfile.available_today
                        ? "Available"
                        : "Not Today"}
                    </p>
                  </div>
                </div>

                <div className="mb-6">
                  <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider mb-2">
                    Plays
                  </p>
                  <div className="flex flex-wrap justify-center gap-2">
                    {selectedProfile.sports?.map((s) => (
                      <span
                        key={s}
                        className="text-xs font-medium text-gray-200 bg-[#2a3038] px-3 py-1 rounded-lg border border-[#3e4550]"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                </div>

                {/* AI Compatibility Button */}
                <button
                  onClick={() => askAICompatibility(selectedProfile)}
                  disabled={aiLoading === "compatibility"}
                  className="w-full py-2.5 mb-3 bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 text-xs font-bold uppercase tracking-wider rounded-xl transition-colors border border-purple-500/30"
                >
                  ✨ AI Compatibility Match
                </button>
                {aiResponse["compatibility"] && (
                  <div className="p-3 bg-purple-500/10 border border-purple-500/30 rounded-xl mb-3 text-left">
                    <p className="text-xs text-purple-200">
                      {aiResponse["compatibility"]}
                    </p>
                  </div>
                )}

                <button
                  onClick={() => {
                    alert(`Invite sent!`);
                    setSelectedProfile(null);
                  }}
                  className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-bold uppercase tracking-wide rounded-xl shadow-lg shadow-emerald-500/20 transition-colors"
                >
                  Invite to Play
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Chat Modal */}
      {chatGroup && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#1a1f26] w-full max-w-md rounded-3xl border border-[#2a3038] shadow-2xl flex flex-col h-[500px] overflow-hidden">
            <div className="p-4 border-b border-[#2a3038] flex items-center justify-between bg-[#0f1419]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#1a1f26] border border-[#2a3038] flex items-center justify-center text-xl">
                  {SPORT_ICONS[chatGroup.sport] || "🏃"}
                </div>
                <div>
                  <h3 className="font-bold text-gray-100 leading-tight">
                    {chatGroup.sport} Room
                  </h3>
                  <p className="text-xs text-emerald-400 font-medium">
                    {chatGroup.members?.length} players inside
                  </p>
                </div>
              </div>
              <button
                onClick={() => setChatGroup(null)}
                className="w-8 h-8 rounded-full bg-[#2a3038] text-gray-400 hover:text-white flex items-center justify-center"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-[#1a1f26]">
              {/* Mock Chat Message */}
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-xs font-bold shrink-0">
                  AI
                </div>
                <div className="bg-[#2a3038] rounded-2xl rounded-tl-sm p-3 text-sm text-gray-200 border border-[#3e4550]">
                  Welcome to the {chatGroup.sport} room! Use this chat to set
                  the final details.
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-[#2a3038] bg-[#0f1419]">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Write a message..."
                  className="flex-1 bg-[#1a1f26] border border-[#2a3038] rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                />
                <button className="bg-emerald-500 text-white px-5 py-2 rounded-xl text-sm font-bold shadow-lg shadow-emerald-500/20 hover:bg-emerald-600 transition-colors">
                  Send
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

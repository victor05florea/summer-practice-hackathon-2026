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
  const [available, setAvailable] = useState(profile.available_today);
  const [dropdownOpen, setDropdownOpen] = useState(false);
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
  const dropdownRef = useRef<HTMLDivElement>(null);

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

  const sortedSports = [...(profile.sports || [])].sort((a, b) => {
    const groupA = groups.find((g) => g.sport === a);
    const groupB = groups.find((g) => g.sport === b);
    if (groupA && !groupB) return -1;
    if (!groupA && groupB) return 1;
    return 0;
  });

  return (
    <div className="min-h-screen bg-[#0f1419]">
      <nav className="bg-[#1a1f26] border-b border-[#2a3038] px-6 h-14 flex items-center justify-between sticky top-0 z-20">
        <div className="flex items-center gap-2">
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

      <div className="max-w-2xl mx-auto px-4 py-5 flex flex-col gap-4">
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
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-medium text-gray-100">
                Lobbies for you
              </p>
              <span className="text-xs text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-full">
                Live
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                    className={`bg-[#0f1419] rounded-xl border overflow-hidden self-start transition-all ${
                      isMember ? "border-emerald-500/40" : "border-[#2a3038]"
                    } ${isMember && isExpanded ? "sm:col-span-2" : ""}`}
                  >
                    <div className="p-3.5">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-xl">
                            {SPORT_ICONS[sport] || "🏃"}
                          </span>
                          <p className="text-sm font-medium text-gray-100 truncate">
                            {sport}
                          </p>
                        </div>
                        {isCaptain && (
                          <span className="flex items-center gap-1 px-2 py-0.5 bg-amber-500/15 text-amber-400 text-[10px] font-semibold rounded-full border border-amber-500/30">
                            👑 Captain
                          </span>
                        )}
                      </div>

                      {existingGroup ? (
                        <>
                          <div className="mb-3">
                            <div className="flex justify-between text-xs text-gray-400 mb-1">
                              <span>
                                {memberCount}/{maxSize} players
                              </span>
                              <span>{Math.round(fillPercent)}%</span>
                            </div>
                            <div className="h-1.5 bg-[#2a3038] rounded-full overflow-hidden">
                              <div
                                className="h-full bg-emerald-500 transition-all"
                                style={{ width: `${fillPercent}%` }}
                              />
                            </div>
                          </div>

                          <div className="flex gap-2">
                            {isMember ? (
                              <>
                                <button
                                  onClick={() =>
                                    setExpandedGroup(
                                      isExpanded ? null : existingGroup.id,
                                    )
                                  }
                                  className="flex-1 py-1.5 bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 text-xs font-medium rounded-lg transition-colors"
                                >
                                  {isExpanded ? "Hide" : "View"}
                                </button>
                                <button
                                  onClick={() => leaveGroup(existingGroup)}
                                  className="px-3 py-1.5 bg-[#2a3038] hover:bg-red-500/20 text-gray-400 hover:text-red-400 text-xs font-medium rounded-lg transition-colors"
                                >
                                  Leave
                                </button>
                              </>
                            ) : isFull ? (
                              <span className="flex-1 py-1.5 bg-[#2a3038] text-gray-500 text-xs font-medium rounded-lg text-center">
                                Full
                              </span>
                            ) : (
                              <button
                                onClick={() => joinGroup(existingGroup)}
                                className="flex-1 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-medium rounded-lg transition-colors"
                              >
                                Join
                              </button>
                            )}
                          </div>
                        </>
                      ) : (
                        <button
                          onClick={() => createGroup(sport)}
                          className="w-full py-1.5 bg-[#2a3038] hover:bg-[#343b45] text-gray-300 text-xs font-medium rounded-lg transition-colors border border-[#343b45]"
                        >
                          Start lobby
                        </button>
                      )}
                    </div>

                    {existingGroup && isMember && isExpanded && (
                      <div className="border-t border-[#2a3038] bg-[#0a0e13] p-4 space-y-4">
                        <div>
                          <p className="text-xs font-medium text-gray-400 mb-2">
                            Participants ({memberCount})
                          </p>
                          <div className="space-y-1.5">
                            {existingGroup.members?.map((memberId) => {
                              const member = memberDetails[memberId];
                              if (!member) return null;
                              const isMemberCaptain =
                                memberId === existingGroup.captain_id;
                              return (
                                <button
                                  key={memberId}
                                  onClick={() => setSelectedProfile(member)}
                                  className="w-full flex items-center gap-3 p-2 rounded-lg bg-emerald-500/5 hover:bg-emerald-500/15 border border-emerald-500/20 transition-colors text-left"
                                >
                                  <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-300 flex items-center justify-center text-xs font-medium flex-shrink-0">
                                    {initials(member.username)}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-1.5">
                                      <p className="text-sm text-emerald-100 truncate">
                                        {member.username}
                                      </p>
                                      {isMemberCaptain && (
                                        <span className="text-xs">👑</span>
                                      )}
                                    </div>
                                    <p className="text-xs text-emerald-400/70 truncate">
                                      {member.skill_level || "—"}
                                    </p>
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        <div className="space-y-2">
                          <p className="text-xs font-medium text-gray-400">
                            Event details
                          </p>
                          {!isEditing ? (
                            <div className="space-y-1.5 bg-[#0f1419] rounded-lg p-3 border border-[#2a3038]">
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
                            </div>
                          ) : (
                            <div className="space-y-2">
                              <input
                                type="text"
                                placeholder="Location (e.g. Parcul Central)"
                                value={tempLocation}
                                onChange={(e) =>
                                  setTempLocation(e.target.value)
                                }
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

                        {isCaptain && !isEditing && (
                          <div className="space-y-2">
                            <button
                              onClick={() => startEdit(existingGroup)}
                              className="w-full py-1.5 bg-amber-500/15 hover:bg-amber-500/25 text-amber-400 text-xs font-medium rounded-lg transition-colors border border-amber-500/30"
                            >
                              👑{" "}
                              {existingGroup.location ||
                              existingGroup.event_time
                                ? "Edit details"
                                : "Set location & time"}
                            </button>
                            <div className="flex gap-2">
                              <button
                                onClick={() => askAIForLocation(existingGroup)}
                                disabled={aiLoading === existingGroup.id}
                                className="flex-1 py-1.5 bg-purple-500/15 hover:bg-purple-500/25 text-purple-300 text-xs font-medium rounded-lg transition-colors disabled:opacity-50"
                              >
                                ✨ Suggest venues
                              </button>
                              <button
                                onClick={() => askAIForWelcome(existingGroup)}
                                disabled={aiLoading === existingGroup.id}
                                className="flex-1 py-1.5 bg-purple-500/15 hover:bg-purple-500/25 text-purple-300 text-xs font-medium rounded-lg transition-colors disabled:opacity-50"
                              >
                                ✨ Welcome msg
                              </button>
                            </div>
                            {aiLoading === existingGroup.id && (
                              <p className="text-xs text-purple-400 italic">
                                AI is thinking...
                              </p>
                            )}
                            {aiResponse[existingGroup.id] &&
                              aiLoading !== existingGroup.id && (
                                <div className="p-3 bg-purple-500/10 border border-purple-500/30 rounded-lg">
                                  <p className="text-xs text-purple-200 whitespace-pre-wrap">
                                    {aiResponse[existingGroup.id]}
                                  </p>
                                </div>
                              )}
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
                <button
                  key={p.id}
                  onClick={() => setSelectedProfile(p)}
                  className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-[#0f1419] cursor-pointer transition-colors text-left"
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
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {selectedProfile && (
        <div
          onClick={() => setSelectedProfile(null)}
          className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-[#1a1f26] border border-[#2a3038] rounded-2xl p-6 max-w-sm w-full"
          >
            <div className="text-center mb-5">
              <div className="w-20 h-20 rounded-full bg-emerald-500/15 text-emerald-400 flex items-center justify-center text-2xl font-semibold mx-auto mb-3">
                {initials(selectedProfile.username)}
              </div>
              <h2 className="text-lg font-semibold text-gray-100">
                {selectedProfile.username}
              </h2>
              <p className="text-sm text-gray-500">
                {selectedProfile.city || "Unknown city"}
              </p>
            </div>

            {selectedProfile.description && (
              <p className="text-sm text-gray-300 italic mb-4 text-center">
                "{selectedProfile.description}"
              </p>
            )}

            <div className="space-y-2 mb-5">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Age</span>
                <span className="text-gray-200">
                  {selectedProfile.age || "—"}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Skill</span>
                <span className="text-gray-200">
                  {selectedProfile.skill_level || "—"}
                </span>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-2">Sports</p>
                <div className="flex flex-wrap gap-1.5">
                  {selectedProfile.sports?.map((s) => (
                    <span
                      key={s}
                      className="px-2.5 py-1 bg-emerald-500/15 text-emerald-400 text-xs rounded-full font-medium"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <button
              onClick={() => setSelectedProfile(null)}
              className="w-full py-2.5 bg-[#0f1419] border border-[#2a3038] text-gray-300 text-sm font-medium rounded-lg hover:bg-[#2a3038] transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

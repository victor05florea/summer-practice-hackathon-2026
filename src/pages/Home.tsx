import { useState, useRef, useEffect } from "react";
import { supabase } from "../services/supabase";
import { type Profile } from "../types";

interface Props {
  profile: Profile;
  onNavigate: (page: "home" | "profile") => void;
}

export default function Home({ profile, onNavigate }: Props) {
  const [available, setAvailable] = useState(profile.available_today);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [people, setPeople] = useState<Profile[]>([]);
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
  }, [profile.city, profile.sports]);

  const fetchPeople = async () => {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .neq("id", profile.id)
      .eq("city", profile.city)
      .overlaps("sports", profile.sports);
    setPeople(data || []);
  };

  const handleAvailability = async (value: boolean) => {
    setAvailable(value);
    await supabase
      .from("profiles")
      .update({ available_today: value })
      .eq("id", profile.id);
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

          <div className="bg-[#0f1419] rounded-xl p-4 mb-4">
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
                    ? "bg-emerald-500 text-white"
                    : "bg-[#2a3038] text-gray-400 hover:bg-[#343b45]"
                }`}
              >
                Yes, I'm in!
              </button>
              <button
                onClick={() => handleAvailability(false)}
                className={`flex-1 py-3 rounded-xl text-sm font-medium transition-all ${
                  !available
                    ? "bg-gray-700 text-white"
                    : "bg-[#2a3038] text-gray-400 hover:bg-[#343b45]"
                }`}
              >
                Not today
              </button>
            </div>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {profile.sports?.map((sport) => (
              <span
                key={sport}
                className="px-2.5 py-1 bg-emerald-500/15 text-emerald-400 text-xs rounded-full font-medium"
              >
                {sport}
              </span>
            ))}
          </div>
        </div>

        <div className="bg-[#1a1f26] rounded-2xl border border-[#2a3038] p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium text-gray-100">People near you</p>
            <span className="text-xs text-gray-500">
              {profile.city} · {people.length}{" "}
              {people.length === 1 ? "match" : "matches"}
            </span>
          </div>

          {people.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-sm text-gray-500">
                No matches yet in your area.
              </p>
              <p className="text-xs text-gray-600 mt-1">Check back later!</p>
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

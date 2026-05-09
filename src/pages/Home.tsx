import { useMemo, useState } from "react";
import { supabase } from "../services/supabase";
import { type Group, type Profile } from "../types";
import { useGroups } from "../hooks/useGroups";
import { useNearby } from "../hooks/useNearby";
import { useInvitations } from "../hooks/useInvitations";
import { getDailyMotivation } from "../services/ollama";

import Navbar from "../components/Navbar";
import HeroToggle from "../components/HeroToggle";
import DailyTipBanner from "../components/DailyTipBanner";
import GroupCard from "../components/GroupCard";
import NearbyList from "../components/NearbyList";
import ProfileModal from "../components/ProfileModal";
import ChatModal from "../components/ChatModal";

interface Props {
  profile: Profile;
  onNavigate: (page: "home" | "profile") => void;
  onProfileUpdate: () => void;
}

export default function Home({ profile, onNavigate, onProfileUpdate }: Props) {
  const [available, setAvailable] = useState(profile.available_today);

  const { groups, memberDetails, refetch } = useGroups(profile, available);
  const people = useNearby(profile, available);
  const { invitations, sendInvite, respondInvite } = useInvitations(profile.id);

  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);
  const [chatGroup, setChatGroup] = useState<Group | null>(null);

  const [tip, setTip] = useState("");
  const [tipLoading, setTipLoading] = useState(false);
  const [toast, setToast] = useState("");

  const sortedSports = useMemo(() => {
    return [...profile.sports].sort((a, b) => {
      const ga = groups.find((g) => g.sport === a);
      const gb = groups.find((g) => g.sport === b);
      if (ga && !gb) return -1;
      if (!ga && gb) return 1;
      return 0;
    });
  }, [profile.sports, groups]);

  const flashToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 2500);
  };

  const toggleAvailability = async (value: boolean) => {
    const previous = available;
    setAvailable(value);
    const { error } = await supabase
      .from("profiles")
      .update({ available_today: value })
      .eq("id", profile.id);
    if (error) {
      console.error("toggleAvailability", error);
      setAvailable(previous);
      flashToast("Could not update availability.");
      return;
    }
    onProfileUpdate();
  };

  const askDailyTip = async () => {
    setTipLoading(true);
    const msg = await getDailyMotivation(profile.username, profile.sports);
    setTip(msg);
    setTipLoading(false);
  };

  const handleInvite = async (other: Profile) => {
    const sport =
      other.sports.find((s) => profile.sports.includes(s)) ??
      profile.sports[0] ??
      other.sports[0];
    if (!sport) {
      flashToast("Add a sport first.");
      return;
    }
    const ok = await sendInvite(other.id, sport, null);
    flashToast(ok ? `Invite sent to ${other.username}` : "Could not send invite.");
    setSelectedProfile(null);
  };

  const handleLogout = () => supabase.auth.signOut();

  return (
    <div className="min-h-screen bg-[#0f1419] pb-10">
      <Navbar
        profile={profile}
        invitations={invitations}
        onAskTip={askDailyTip}
        tipLoading={tipLoading}
        onEditProfile={() => onNavigate("profile")}
        onLogout={handleLogout}
        onRespondInvite={respondInvite}
      />

      {tip && <DailyTipBanner message={tip} onDismiss={() => setTip("")} />}

      <HeroToggle available={available} onChange={toggleAvailability} />

      {available && (
        <div className="max-w-6xl mx-auto px-4 flex flex-col lg:flex-row gap-6">
          <div className="flex-1 space-y-4">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-xl font-bold text-gray-100">Live Rooms</h2>
              <span className="text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full animate-pulse border border-emerald-500/20">
                Matching Active
              </span>
            </div>

            {sortedSports.length === 0 ? (
              <div className="bg-[#1a1f26] rounded-2xl border border-[#2a3038] border-dashed p-6 text-center">
                <p className="text-sm text-gray-400">
                  No sports in your profile yet.
                </p>
                <button
                  onClick={() => onNavigate("profile")}
                  className="mt-3 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold uppercase tracking-wide rounded-lg transition-colors"
                >
                  Add sports
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {sortedSports.map((sport) => (
                  <GroupCard
                    key={sport}
                    sport={sport}
                    group={groups.find((g) => g.sport === sport)}
                    profile={profile}
                    memberDetails={memberDetails}
                    onChange={refetch}
                    onOpenChat={setChatGroup}
                    onSelectProfile={setSelectedProfile}
                  />
                ))}
              </div>
            )}
          </div>

          <NearbyList
            city={profile.city}
            people={people}
            onSelect={setSelectedProfile}
            onInvite={handleInvite}
          />
        </div>
      )}

      {selectedProfile && (
        <ProfileModal
          me={profile}
          other={selectedProfile}
          onClose={() => setSelectedProfile(null)}
          onInvite={handleInvite}
        />
      )}

      {chatGroup && (
        <ChatModal
          group={chatGroup}
          me={profile}
          memberDetails={memberDetails}
          onClose={() => setChatGroup(null)}
        />
      )}

      {toast && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-[#1a1f26] border border-[#2a3038] text-gray-100 text-sm px-4 py-2 rounded-xl shadow-lg z-50">
          {toast}
        </div>
      )}
    </div>
  );
}

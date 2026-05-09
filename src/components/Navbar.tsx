import { useEffect, useRef, useState } from "react";
import { type Profile } from "../types";
import { greeting, initials } from "../lib/format";
import NotificationsDropdown from "./NotificationsDropdown";
import { type InvitationView } from "../hooks/useInvitations";

interface Props {
  profile: Profile;
  invitations: InvitationView[];
  onAskTip: () => void;
  tipLoading: boolean;
  onEditProfile: () => void;
  onLogout: () => void;
  onRespondInvite: (id: string, status: "accepted" | "declined") => void;
}

export default function Navbar({
  profile,
  invitations,
  onAskTip,
  tipLoading,
  onEditProfile,
  onLogout,
  onRespondInvite,
}: Props) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <nav className="bg-[#1a1f26] border-b border-[#2a3038] px-4 sm:px-6 h-16 flex items-center justify-between sticky top-0 z-40">
      <div className="flex flex-col">
        <span className="text-xs text-gray-400 font-medium">{greeting()},</span>
        <span className="text-sm font-bold text-emerald-400">
          {profile.username}
        </span>
      </div>

      <div className="flex items-center gap-2 sm:gap-4">
        <button
          onClick={onAskTip}
          disabled={tipLoading}
          className="flex items-center gap-1.5 px-2.5 py-1.5 bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 text-xs font-medium rounded-lg transition-colors border border-purple-500/20 disabled:opacity-50"
          title="Daily Motivation"
        >
          <span>✨</span>
          <span className="hidden md:inline">Daily Motivation</span>
        </button>

        <NotificationsDropdown
          invitations={invitations}
          onRespond={onRespondInvite}
        />

        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="w-9 h-9 rounded-full bg-emerald-500/15 flex items-center justify-center border border-emerald-500/30 hover:bg-emerald-500/25 transition-colors"
          >
            <span className="text-emerald-400 text-sm font-semibold">
              {initials(profile.username)}
            </span>
          </button>
          {menuOpen && (
            <div className="absolute right-0 top-12 bg-[#1a1f26] border border-[#2a3038] rounded-xl shadow-lg p-1.5 min-w-44 z-50">
              <button
                onClick={() => {
                  setMenuOpen(false);
                  onEditProfile();
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-300 hover:bg-[#0f1419] rounded-lg transition-colors"
              >
                <span>⚙️</span> Edit Profile
              </button>
              <button
                onClick={onLogout}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
              >
                <span>🚪</span> Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}

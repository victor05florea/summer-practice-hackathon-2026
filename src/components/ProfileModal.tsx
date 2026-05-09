import { useState } from "react";
import { type Profile } from "../types";
import { getCompatibility } from "../services/ollama";
import { initials } from "../lib/format";

interface Props {
  me: Profile;
  other: Profile;
  onClose: () => void;
  onInvite: (other: Profile) => void;
}

export default function ProfileModal({ me, other, onClose, onInvite }: Props) {
  const [aiBusy, setAiBusy] = useState(false);
  const [aiReply, setAiReply] = useState("");

  const askCompatibility = async () => {
    setAiBusy(true);
    setAiReply("");
    const msg = await getCompatibility(
      me.sports,
      me.skill_level,
      other.username,
      other.sports,
      other.skill_level,
    );
    setAiReply(msg);
    setAiBusy(false);
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-[#1a1f26] w-full max-w-sm rounded-3xl border border-[#2a3038] shadow-2xl overflow-hidden relative"
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 bg-black/30 hover:bg-black/60 rounded-full text-white flex items-center justify-center transition-colors z-10"
        >
          ✕
        </button>
        <div className="bg-[#0f1419] h-24 border-b border-[#2a3038]"></div>

        <div className="px-6 pb-6 relative">
          <div className="w-24 h-24 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-2xl border-4 border-[#1a1f26] absolute -top-12 left-1/2 -translate-x-1/2 flex items-center justify-center text-3xl font-bold text-white shadow-xl">
            {initials(other.username)}
          </div>

          <div className="pt-14 text-center">
            <h2 className="text-xl font-extrabold text-white">
              {other.username}
            </h2>
            <p className="text-sm text-gray-400 mb-4">
              {other.city || "Unknown city"} •{" "}
              {other.age ? `${other.age} y/o` : "Age hidden"}
            </p>

            {other.description && (
              <p className="text-sm text-gray-300 bg-[#0f1419] p-3 rounded-xl border border-[#2a3038] mb-5 italic">
                "{other.description}"
              </p>
            )}

            <div className="grid grid-cols-2 gap-3 mb-5">
              <div className="bg-[#0f1419] p-3 rounded-xl border border-[#2a3038]">
                <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider mb-1">
                  Skill
                </p>
                <p className="text-sm font-semibold text-emerald-400">
                  {other.skill_level}
                </p>
              </div>
              <div className="bg-[#0f1419] p-3 rounded-xl border border-[#2a3038]">
                <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider mb-1">
                  Status
                </p>
                <p
                  className={`text-sm font-semibold ${
                    other.available_today ? "text-emerald-400" : "text-gray-500"
                  }`}
                >
                  {other.available_today ? "Available" : "Not Today"}
                </p>
              </div>
            </div>

            <div className="mb-6">
              <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider mb-2">
                Plays
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                {other.sports.map((s) => (
                  <span
                    key={s}
                    className="text-xs font-medium text-gray-200 bg-[#2a3038] px-3 py-1 rounded-lg border border-[#3e4550]"
                  >
                    {s}
                  </span>
                ))}
              </div>
            </div>

            <button
              onClick={askCompatibility}
              disabled={aiBusy}
              className="w-full py-2.5 mb-3 bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 text-xs font-bold uppercase tracking-wider rounded-xl transition-colors border border-purple-500/30 disabled:opacity-50"
            >
              ✨ AI Compatibility Match
            </button>
            {(aiBusy || aiReply) && (
              <div className="p-3 bg-purple-500/10 border border-purple-500/30 rounded-xl mb-3 text-left">
                <p className="text-xs text-purple-200">
                  {aiBusy ? "Thinking..." : aiReply}
                </p>
              </div>
            )}

            <button
              onClick={() => onInvite(other)}
              className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-bold uppercase tracking-wide rounded-xl shadow-lg shadow-emerald-500/20 transition-colors"
            >
              Invite to Play
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

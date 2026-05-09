import { type Profile } from "../types";
import Avatar from "./Avatar";

interface Props {
  city: string;
  people: Profile[];
  onSelect: (p: Profile) => void;
  onInvite: (p: Profile) => void;
}

export default function NearbyList({ city, people, onSelect, onInvite }: Props) {
  return (
    <div className="w-full lg:w-80 flex-shrink-0">
      <div className="bg-[#1a1f26] rounded-2xl border border-[#2a3038] p-5 sticky top-20 shadow-lg shadow-black/10">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-bold text-gray-100">Nearby You</h2>
          {city && (
            <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-md border border-emerald-500/20">
              {city}
            </span>
          )}
        </div>
        <p className="text-xs text-gray-500 mb-4">
          {people.length} active players found
        </p>

        {people.length === 0 ? (
          <div className="text-center py-10 bg-[#0f1419] rounded-xl border border-[#2a3038] border-dashed">
            <p className="text-sm text-gray-500">No active players nearby.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2 max-h-[600px] overflow-y-auto pr-1">
            {people.map((p) => (
              <div
                key={p.id}
                className="flex items-center justify-between p-2.5 bg-[#0f1419] rounded-xl border border-[#2a3038] hover:border-emerald-500/30 transition-colors group"
              >
                <button
                  onClick={() => onSelect(p)}
                  className="flex items-center gap-3 cursor-pointer flex-1 min-w-0 text-left"
                >
                  <Avatar name={p.username} showStatus online={p.available_today} />
                  <div className="min-w-0 pr-2">
                    <p className="text-sm font-bold text-gray-200 truncate group-hover:text-emerald-400 transition-colors">
                      {p.username}
                    </p>
                    <p className="text-[10px] uppercase tracking-wide text-gray-500 truncate">
                      {p.sports.slice(0, 2).join(", ")}
                    </p>
                  </div>
                </button>
                <button
                  onClick={() => onInvite(p)}
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
  );
}

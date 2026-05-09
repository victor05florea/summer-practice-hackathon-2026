import { useEffect, useRef, useState } from "react";
import { sportIcon } from "../constants/sports";
import { type InvitationView } from "../hooks/useInvitations";

interface Props {
  invitations: InvitationView[];
  onRespond: (id: string, status: "accepted" | "declined") => void;
}

export default function NotificationsDropdown({ invitations, onRespond }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const count = invitations.length;

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative p-2 text-gray-400 hover:text-white transition-colors"
      >
        🔔
        {count > 0 && (
          <span className="absolute top-0 right-0 min-w-4 h-4 px-1 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border border-[#1a1f26]">
            {count}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 top-12 bg-[#1a1f26] border border-[#2a3038] rounded-xl shadow-lg p-3 w-72 z-50">
          <p className="text-xs font-semibold text-gray-400 uppercase mb-2">
            Invitations
          </p>
          {count === 0 ? (
            <p className="text-xs text-gray-500 py-4 text-center">
              No invitations yet.
            </p>
          ) : (
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {invitations.map((inv) => (
                <div
                  key={inv.id}
                  className="p-2.5 bg-[#0f1419] rounded-lg border border-[#2a3038]"
                >
                  <p className="text-xs text-gray-200 mb-2">
                    <span className="mr-1">{sportIcon(inv.sport)}</span>
                    <span className="font-semibold text-emerald-400">
                      {inv.fromProfile?.username ?? "Someone"}
                    </span>{" "}
                    invited you to play{" "}
                    <span className="font-medium">{inv.sport}</span>.
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => onRespond(inv.id, "accepted")}
                      className="flex-1 py-1 bg-emerald-500 hover:bg-emerald-600 text-white text-[11px] font-bold uppercase tracking-wide rounded-md transition-colors"
                    >
                      Accept
                    </button>
                    <button
                      onClick={() => onRespond(inv.id, "declined")}
                      className="flex-1 py-1 bg-[#2a3038] hover:bg-red-500/20 text-gray-300 hover:text-red-400 text-[11px] font-bold uppercase tracking-wide rounded-md transition-colors"
                    >
                      Decline
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

import { initials } from "../lib/format";

interface Props {
  name: string;
  size?: "sm" | "md" | "lg" | "xl";
  showStatus?: boolean;
  online?: boolean;
}

const SIZES = {
  sm: "w-8 h-8 text-xs",
  md: "w-10 h-10 text-sm",
  lg: "w-12 h-12 text-base",
  xl: "w-24 h-24 text-3xl",
};

export default function Avatar({ name, size = "md", showStatus, online }: Props) {
  return (
    <div className="relative inline-block">
      <div
        className={`${SIZES[size]} rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 text-white flex items-center justify-center font-bold shadow-md`}
      >
        {initials(name)}
      </div>
      {showStatus && (
        <div
          className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-[#0f1419] ${online ? "bg-emerald-400" : "bg-gray-500"}`}
        />
      )}
    </div>
  );
}

interface Props {
  available: boolean;
  onChange: (value: boolean) => void;
}

export default function HeroToggle({ available, onChange }: Props) {
  return (
    <div className="max-w-2xl mx-auto px-4 py-10 md:py-14 text-center">
      <h1 className="text-3xl md:text-5xl font-extrabold text-white mb-8 tracking-tight">
        ARE YOU SHOWING UP <span className="text-emerald-500">TODAY?</span>
      </h1>

      <div className="flex items-center justify-center gap-5">
        <span
          className={`text-sm font-bold uppercase tracking-wide transition-colors ${
            !available ? "text-gray-400" : "text-gray-600"
          }`}
        >
          Not today
        </span>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            className="sr-only peer"
            checked={available}
            onChange={(e) => onChange(e.target.checked)}
          />
          <div className="w-24 h-12 bg-[#2a3038] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-emerald-500 after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:rounded-full after:h-10 after:w-10 after:transition-all shadow-inner border border-[#1a1f26]"></div>
        </label>
        <span
          className={`text-sm font-bold uppercase tracking-wide transition-colors ${
            available ? "text-emerald-400" : "text-gray-600"
          }`}
        >
          Yes, I'm in
        </span>
      </div>
    </div>
  );
}
